/**
 * MIT License
 *
 * Copyright (C) 2026 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/**
 * react-native-location (RNLocation) HarmonyOS ArkTS TurboModule 实现。
 *
 * 三块能力（API 均经 harmonyos-sdk-api-lookup 核实）：
 *  1. 定位：@kit.LocationKit geoLocationManager
 *     - on/off('locationChange', LocationRequest, cb)：持续定位（普通 + significant
 *       两路独立请求、独立回调，共用 locationUpdated 事件）
 *     - getLastLocation()：startUpdatingLocation 时立即回报最后已知位置
 *     （对齐 Android RNStandardLocationProvider 的 getLastKnownLocation 行为）
 *  2. 航向：@kit.SensorServiceKit sensor.on/off(SensorId.ORIENTATION)
 *     - OrientationResponse.alpha（绕 Z 轴旋转角 0-360）→ headingUpdated { heading }
 *     - headingFilter 角度阈值过滤（对齐 iOS headingFilter 语义）
 *  3. 权限：@kit.AbilityKit abilityAccessCtrl
 *     - requestPermissionsFromUser 两步串行：先前台 [LOCATION, APPROXIMATELY_LOCATION]，
 *       授权成功后再单独申请 [LOCATION_IN_BACKGROUND]（鸿蒙限制：后台定位权限不可与
 *       前台权限合并申请，否则可能整单被拒）
 *     - checkAccessToken：状态查询（tokenID 从 bundleManager.getBundleInfoForSelf 取）
 *
 * 事件（与 Android/iOS 原库负载结构逐字段一致）：
 *  - locationUpdated: Location[]（数组！）
 *  - headingUpdated: { heading: number }
 *  - authorizationStatusDidChange: string
 *  - onWarning: { message: string, type: string }（type 为错误码字符串，
 *    沿用 Android WarningUtils 语义：401 参数错 / 403 无权限 / 500-503 服务不可用）
 */

import { UITurboModule, UITurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from './generated/ts';
import { geoLocationManager } from '@kit.LocationKit';
import { sensor } from '@kit.SensorServiceKit';
import { abilityAccessCtrl, bundleManager, common, Permissions } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

/** 权限状态字符串（与 src/types.ts LocationPermissionStatus 对齐）。 */
type RNLocationPermissionStatus =
  'authorizedAlways' | 'authorizedWhenInUse' | 'authorizedFine' | 'authorizedCoarse'
  | 'denied' | 'restricted' | 'notDetermined';

/** desiredAccuracy 配置项（与 src/types.ts 对齐）。 */
interface RNLocationDesiredAccuracy {
  ios?: string;
  android?: string;   // highAccuracy | lowPower（鸿蒙消费）；balancedPowerAccuracy | noPower（Android 语义，静默忽略）
}

/**
 * JS configure(options) 传入的可识别字段（与 src/types.ts ConfigureOptions 对齐）。
 * iOS/Android 专属项（activityType/headingOrientation/androidProvider 等）在鸿蒙无
 * 对应能力，静默忽略（保持 configure 永远 resolve 的原库语义）。
 */
interface RNLocationConfigureOptions {
  distanceFilter?: number;
  interval?: number;          // 毫秒（Android 语义）
  fastestInterval?: number;   // 毫秒（Android 语义：最快间隔下限；鸿蒙静默忽略）
  maxWaitTime?: number;       // 毫秒（Android 语义：攒批延迟；鸿蒙静默忽略）
  desiredAccuracy?: RNLocationDesiredAccuracy;
  headingFilter?: number;     // 度（iOS 语义，鸿蒙端用于传感器阈值）
}

/** 运行期生效配置（configure 只改传入项：字段未传时保留当前值）。 */
interface RNLocationRuntimeOptions {
  distanceFilter: number;     // 米
  interval: number;           // 毫秒
  headingFilter: number;      // 度
  priority: geoLocationManager.LocationRequestPriority;
}

/** 发给 JS 的 Location 负载（与 Utils.locationToMap 逐字段对齐）。 */
interface RNLocationPayload {
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  altitudeAccuracy: number;
  course: number;
  courseAccuracy: number;
  speed: number;
  speedAccuracy: number;
}

const PERMISSION_LOCATION: Permissions = 'ohos.permission.LOCATION';
const PERMISSION_APPROX: Permissions = 'ohos.permission.APPROXIMATELY_LOCATION';
const PERMISSION_BACKGROUND: Permissions = 'ohos.permission.LOCATION_IN_BACKGROUND';

/** 毫秒 → 秒；鸿蒙 GNSS 最小 1s、网络定位最小 20s，设置小于最小值时系统按最小值生效。 */
function msToSeconds(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(ms / 1000));
}

export class RNLocationTurboModule extends UITurboModule implements TM.RNLocation.Spec {
  public static readonly NAME = TM.RNLocation.NAME;

  private options: RNLocationRuntimeOptions = {
    // Android RNStandardLocationProvider 默认：非高精度 + 100m 距离过滤。
    distanceFilter: 100,
    interval: 0,
    headingFilter: 0,
    priority: geoLocationManager.LocationRequestPriority.FIRST_FIX,
  };

  private locationCallback: ((location: geoLocationManager.Location) => void) | null = null;
  private significantCallback: ((location: geoLocationManager.Location) => void) | null = null;
  private isSignificantRunning = false;
  private isLocationRunning = false;

  private headingCallback: ((data: sensor.OrientationResponse) => void) | null = null;
  private isHeadingRunning = false;
  private lastHeadingAlpha = -1.0;

  private lastStatus: RNLocationPermissionStatus = 'notDetermined';

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
  }

  // ───────────────────────── configure ─────────────────────────

  configure(options: Object): Promise<void> {
    const opts = options as RNLocationConfigureOptions | undefined;
    if (opts !== undefined && opts !== null) {
      this.applyOptions(opts);
    }
    // 配置变更后在运行中的订阅按新参数重启（对齐 Android configure→setupListening）
    if (this.isLocationRunning) {
      this.stopLocationListening();
      this.startLocationListening();
    }
    return Promise.resolve();
  }

  private applyOptions(opts: RNLocationConfigureOptions): void {
    const distanceFilter = opts.distanceFilter;
    if (distanceFilter !== undefined) {
      if (Number.isFinite(distanceFilter) && distanceFilter >= 0) {
        this.options.distanceFilter = distanceFilter;
      } else {
        this.emitWarning('distanceFilter must be a non-negative number', '401');
      }
    }
    // interval 毫秒 → timeInterval 秒。fastestInterval/maxWaitTime 为 Android
    // 调度语义（最快间隔下限 / 后台攒批延迟），鸿蒙 timeInterval 单槽位、无对应
    // 机制，与 iOS 专属项一致静默忽略、不参与取值（避免"取最小"造成跨平台语义
    // 漂移：Android 上二者是限速器/延迟器，取最小会变成加速器）。时间下限由系统保证。
    if (this.isPositiveMillis(opts.interval)) {
      this.options.interval = opts.interval as number;
    }
    const headingFilter = opts.headingFilter;
    if (headingFilter !== undefined && Number.isFinite(headingFilter) && headingFilter >= 0) {
      this.options.headingFilter = headingFilter;
    }
    const desiredAccuracy = opts.desiredAccuracy;
    if (desiredAccuracy !== undefined && desiredAccuracy !== null) {
      const android = desiredAccuracy.android;
      if (android !== undefined && android !== null) {
        if (android === 'highAccuracy') {
          this.options.priority = geoLocationManager.LocationRequestPriority.ACCURACY;
        } else if (android === 'lowPower') {
          this.options.priority = geoLocationManager.LocationRequestPriority.LOW_POWER;
        }
        // balancedPowerAccuracy（平衡档）与 noPower（不主动定位）为 Android 调度语义，
        // 鸿蒙无对应机制，与 iOS 专属项一致静默忽略（优先级保持不变，不降级不告警）；
        // 其余未知值仍告警 401。
        else if (android !== 'balancedPowerAccuracy' && android !== 'noPower') {
          this.emitWarning(`desiredAccuracy.android was passed an unknown value: ${android}`, '401');
        }
      }
    }
    // 打印合并后真正生效的参数（priority 枚举:UNSET=512/ACCURACY=513/LOW_POWER=514/FIRST_FIX=515）
    hilog.info(0x0000, 'RNLocation',
      `configure effective: distanceFilter=${this.options.distanceFilter}m, ` +
      `interval=${this.options.interval}ms, headingFilter=${this.options.headingFilter}°, ` +
      `priority=${this.options.priority}`);
  }

  private isPositiveMillis(value: number | undefined): boolean {
    return value !== undefined && Number.isFinite(value) && value > 0;
  }

  // ───────────────────────── 权限 ─────────────────────────

  requestWhenInUseAuthorization(): Promise<boolean> {
    return this.requestPermissions(false);
  }

  requestAlwaysAuthorization(): Promise<boolean> {
    return this.requestPermissions(true);
  }

  getAuthorizationStatus(): Promise<string> {
    return this.queryAuthorizationStatus().then((status): string => {
      this.trackStatusChange(status);
      return status as string;
    });
  }

  // ───────────────────────── 持续定位 ─────────────────────────

  startUpdatingLocation(): void {
    if (this.isLocationRunning) {
      return;
    }
    this.isLocationRunning = true;
    this.startLocationListening();
    // 立即回报最后已知位置（对齐 Android getLastKnownLocation 立即 processLocation）
    this.emitLastLocation();
  }

  stopUpdatingLocation(): void {
    this.isLocationRunning = false;
    this.stopLocationListening();
  }

  // ───────────────────────── 航向 ─────────────────────────

  startUpdatingHeading(): void {
    if (this.isHeadingRunning) {
      return;
    }
    this.headingCallback = (data: sensor.OrientationResponse): void => {
      this.onOrientationChanged(data);
    };
    try {
      sensor.on(sensor.SensorId.ORIENTATION, this.headingCallback);
      this.isHeadingRunning = true;
    } catch (error) {
      this.headingCallback = null;
      const e = error as BusinessError;
      // 模拟器/无传感器设备：不可用降级为 onWarning，不崩溃（原库语义：heading 不可用仅告警）
      this.emitWarning(
        `Failed to start updating heading. Code: ${e.code}, message: ${e.message}`,
        '502',
      );
    }
  }

  stopUpdatingHeading(): void {
    if (!this.isHeadingRunning) {
      return;
    }
    this.isHeadingRunning = false;
    try {
      sensor.off(sensor.SensorId.ORIENTATION, this.headingCallback ?? undefined);
    } catch (error) {
      const e = error as BusinessError;
      this.ctx.logger.warn(`RNLocation off ORIENTATION failed: ${e.code} ${e.message}`);
    }
    this.headingCallback = null;
    this.lastHeadingAlpha = -1.0;
  }

  // ───────────────────── 显著位置变化（近似实现） ─────────────────────
  //
  // 鸿蒙无 startMonitoringSignificantLocationChanges 原生对应；按 01 分析方案以
  // 低功耗（LOW_POWER，纯网络定位）+ 大距离间隔（1000m）的独立 locationChange
  // 请求近似模拟。与普通订阅相互独立、共用 locationUpdated 事件（与原库一致，
  // significant 不受用户 configure 的 distanceFilter 影响）。

  startMonitoringSignificantLocationChanges(): void {
    if (this.isSignificantRunning) {
      return;
    }
    this.significantCallback = (location: geoLocationManager.Location): void => {
      this.emitLocation(location);
    };
    const request: geoLocationManager.LocationRequest = {
      priority: geoLocationManager.LocationRequestPriority.LOW_POWER,
      scenario: geoLocationManager.LocationRequestScenario.UNSET,
      timeInterval: 0,
      distanceInterval: 1000,
      maxAccuracy: 0,
    };
    hilog.info(0x0000, 'RNLocation',
      `startSignificant LocationRequest=${JSON.stringify(request)}`);
    try {
      geoLocationManager.on('locationChange', request, this.significantCallback);
      this.isSignificantRunning = true;
    } catch (error) {
      this.significantCallback = null;
      this.handleLocationError(error, 'significant location changes');
    }
  }

  stopMonitoringSignificantLocationChanges(): void {
    if (!this.isSignificantRunning) {
      return;
    }
    this.isSignificantRunning = false;
    try {
      geoLocationManager.off('locationChange', this.significantCallback ?? undefined);
    } catch (error) {
      this.handleLocationError(error, 'stop significant location changes');
    }
    this.significantCallback = null;
  }

  // ─────────────────── NativeEventEmitter 协议方法 ───────────────────
  // （RNOH 对 TurboModule 事件发送由 emitDeviceEvent 承担，这两个方法为
  // NativeEventEmitter 构造协议保留空实现。）

  addListener(eventName: string): void {
    this.ctx.logger.info(`RNLocation addListener: ${eventName}`);
  }

  removeListeners(count: number): void {
    this.ctx.logger.info(`RNLocation removeListeners: ${count}`);
  }

  // ───────────────────────── 内部实现 ─────────────────────────

  private startLocationListening(): void {
    this.locationCallback = (location: geoLocationManager.Location): void => {
      this.emitLocation(location);
    };
    const request: geoLocationManager.LocationRequest = {
      priority: this.options.priority,
      scenario: geoLocationManager.LocationRequestScenario.UNSET,
      timeInterval: msToSeconds(this.options.interval),
      distanceInterval: this.options.distanceFilter,
      maxAccuracy: 0,
    };
    hilog.info(0x0000, 'RNLocation',
      `startLocationListening LocationRequest=${JSON.stringify(request)} ` +
      `(timeInterval 单位:秒,由 interval 毫秒换算)`);
    try {
      geoLocationManager.on('locationChange', request, this.locationCallback);
    } catch (error) {
      this.isLocationRunning = false;
      this.locationCallback = null;
      this.handleLocationError(error, 'location updates');
    }
  }

  private stopLocationListening(): void {
    if (this.locationCallback !== null) {
      try {
        geoLocationManager.off('locationChange', this.locationCallback);
      } catch (error) {
        this.handleLocationError(error, 'stop location updates');
      }
      this.locationCallback = null;
    }
  }

  private emitLastLocation(): void {
    try {
      const last = geoLocationManager.getLastLocation();
      if (last) {
        this.emitLocation(last);
      }
    } catch (error) {
      // 3301200（无最后位置）等：静默——与 Android getLastKnownLocation 返回 null 行为一致
      this.ctx.logger.info('RNLocation getLastLocation unavailable');
    }
  }

  private emitLocation(location: geoLocationManager.Location): void {
    // 原库负载：locationUpdated 收到 Location[]（数组），JS 侧取 [0] 排序取最新
    const payload: RNLocationPayload = {
      timestamp: location.timeStamp,               // UTC 毫秒，与 RN timestamp 同单位
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      altitudeAccuracy: location.altitudeAccuracy ?? 0,   // API12+ 可选，缺省 0（对齐 Android <O）
      course: location.direction,                        // direction(度 0-360) → course
      courseAccuracy: location.directionAccuracy ?? 0,
      speed: location.speed,
      speedAccuracy: location.speedAccuracy ?? 0,
    };
    this.ctx.rnInstance.emitDeviceEvent('locationUpdated', [payload]);
  }

  private onOrientationChanged(data: sensor.OrientationResponse): void {
    const heading = data.alpha; // 绕 Z 轴旋转角（0-360），罗盘航向
    if (!Number.isFinite(heading)) {
      return;
    }
    // headingFilter 阈值过滤（对齐 iOS CLHeadingFilter 语义；0 = 不过滤）
    const filter = this.options.headingFilter;
    if (filter > 0 && this.lastHeadingAlpha >= 0) {
      let delta = Math.abs(heading - this.lastHeadingAlpha);
      if (delta > 180) {
        delta = 360 - delta;
      }
      if (delta < filter) {
        return;
      }
    }
    this.lastHeadingAlpha = heading;
    this.ctx.rnInstance.emitDeviceEvent('headingUpdated', { heading });
  }

  private async requestPermissions(includeBackground: boolean): Promise<boolean> {
    const context = this.ctx.uiAbilityContext as common.UIAbilityContext;
    const atManager = abilityAccessCtrl.createAtManager();
    // 鸿蒙限制：后台定位权限（LOCATION_IN_BACKGROUND）不能与前台定位权限合并到同一次
    // 申请（合并申请可能导致整单被拒）。必须先前台两项授权成功，再单独发起后台权限申请。
    try {
      const grantedStatus = abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
      // 第一步：前台组合（LOCATION + APPROXIMATELY_LOCATION）
      const foreground = await atManager.requestPermissionsFromUser(
        context, [PERMISSION_LOCATION, PERMISSION_APPROX]);
      hilog.info(0x0000, 'RNLocation',
        `request step1(foreground) result=${JSON.stringify(foreground)} ` +
        `(authResults: 0=granted, -1=denied)`);
      let foregroundGranted = false;
      const foregroundResults = foreground.authResults;
      for (let i = 0; i < foregroundResults.length; i++) {
        if (foregroundResults[i] === grantedStatus) {
          foregroundGranted = true;
        }
      }
      if (!includeBackground || !foregroundGranted) {
        // 前台未授权时不再申请后台（always 档语义 = 前台 + 后台全部授予）
        hilog.info(0x0000, 'RNLocation',
          `request result=${foregroundGranted} ` +
          `(includeBackground=${includeBackground}, foregroundGranted=${foregroundGranted})`);
        this.syncStatusAfterRequest();
        return foregroundGranted;
      }
      // 第二步：探测后台授权状态。LOCATION_IN_BACKGROUND 不支持弹窗授予（唯一授予路径
      // 是用户在设置中选「始终允许」），且 requestPermissionsFromUser 对该权限的返回值在
      // 部分系统版本上不反映真实 token 状态（手动授予后仍返回 -1/空），导致已开「始终
      // 允许」时 always 档误报 false。这里改为读 token 权威状态（与 getAuthorizationStatus
      // 同源）：authorizedAlways 即前台两项 + 后台全部就绪。
      const status = await this.getAuthorizationStatus();
      const backgroundGranted = status === 'authorizedAlways';
      hilog.info(0x0000, 'RNLocation',
        `request step2(background) status=${status} backgroundGranted=${backgroundGranted}`);
      this.syncStatusAfterRequest();
      return foregroundGranted && backgroundGranted;
    } catch (error) {
      const e = error as BusinessError;
      this.emitWarning(
        `Failed to request location permissions. Code: ${e.code}, message: ${e.message}`,
        '403',
      );
      return false;
    }
  }

  private syncStatusAfterRequest(): void {
    // 申请后同步一次最新状态给订阅方（对齐 iOS authorizationStatusDidChange）
    this.queryAuthorizationStatus().then((status): void => {
      this.trackStatusChange(status);
    }).catch((): void => {
    });
  }

  private async queryAuthorizationStatus(): Promise<RNLocationPermissionStatus> {
    try {
      const info = await bundleManager.getBundleInfoForSelf(
        bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION,
      );
      const tokenId = info.appInfo.accessTokenId;
      const atManager = abilityAccessCtrl.createAtManager();
      const results = await Promise.all([
        atManager.checkAccessToken(tokenId, PERMISSION_LOCATION),
        atManager.checkAccessToken(tokenId, PERMISSION_APPROX),
        atManager.checkAccessToken(tokenId, PERMISSION_BACKGROUND),
      ]);
      const granted = abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
      const hasFine = results[0] === granted && results[1] === granted;
      const hasApproxOnly = results[0] !== granted && results[1] === granted;
      const hasBackground = results[2] === granted;
      if (hasFine && hasBackground) {
        return 'authorizedAlways';
      }
      if (hasFine) {
        // 前台精确（LOCATION+APPROXIMATELY_LOCATION），对应 Android authorizedFine
        return 'authorizedFine';
      }
      if (hasApproxOnly) {
        return 'authorizedCoarse';
      }
      // 两项前台权限均未授：从未弹过为 notDetermined；用户拒绝过（拒绝后弹窗不可再
      // 拉）在 token 层无法直接区分，统一返回 denied（保守：denied 也可继续走申请
      // 流程由系统决定是否可再弹）。
      return 'denied';
    } catch (error) {
      const e = error as BusinessError;
      this.ctx.logger.error(`RNLocation queryAuthorizationStatus failed: ${e.code} ${e.message}`);
      return 'restricted';
    }
  }

  private trackStatusChange(status: RNLocationPermissionStatus): void {
    if (status !== this.lastStatus) {
      this.lastStatus = status;
      this.ctx.rnInstance.emitDeviceEvent('authorizationStatusDidChange', status);
    }
  }

  private handleLocationError(error: Object, what: string): void {
    const e = error as BusinessError;
    // 部分系统版本 e.code 不为数值 201（错误文本自带 "BussinessError 201: ..." 前缀，
    // SDK 原文拼写即为 Bussiness），导致 201→403 映射漏命中、误报 500。
    // 这里先取 code 属性，非有限数值时再从 message 前缀解析，保证映射稳定。
    let code = Number(e.code);
    if (!Number.isFinite(code)) {
      const parsed = /Error (\d+):/.exec(e.message ?? '');
      code = parsed ? Number(parsed[1]) : NaN;
    }
    let message = `Location error during ${what}: ${e.message ?? ''}`;
    if (code === 201) {
      // 201 权限未授 → 对齐 Android SecurityException → 403
      this.emitWarning(
        `Attempted to ${what} without location permissions. Detail: ${e.message}`,
        '403',
      );
      return;
    }
    if (code === 3301100) {
      message = `The location switch is off during ${what}.`;
    } else if (code === 3301000) {
      message = `The location service is unavailable during ${what}.`;
    } else if (code === 801) {
      message = `Device capability not supported for ${what}.`;
    }
    this.emitWarning(message, '500');
  }

  private emitWarning(message: string, type: string): void {
    // 负载与 Android Utils.emitWarning 一致：{ message, type }
    this.ctx.rnInstance.emitDeviceEvent('onWarning', { message, type });
    this.ctx.logger.warn(`RNLocation warning [${type}]: ${message}`);
  }
}
