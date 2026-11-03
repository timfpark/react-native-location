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
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * RNLocation TurboModule Spec（旧架构 NativeModules.RNLocation → 新架构）。
 *
 * 原生模块名保持 'RNLocation' 不变（与 Android/iOS 原生实现一致）。
 * configure 选项结构见 ../types（ConfigureOptions），这里以 Object 透传，
 * 由鸿蒙 ArkTS 侧按需解析（与 Android ReadableMap 行为一致）。
 */
export interface Spec extends TurboModule {
  /**
   * 配置定位参数（只改变传入的项）。
   * 鸿蒙映射：distanceFilter→distanceInterval；interval/fastestInterval/maxWaitTime(毫秒)→timeInterval(秒)；
   * desiredAccuracy.android→LocationRequestPriority；iOS 专属项在鸿蒙忽略。
   */
  configure(options: Object): Promise<void>;

  /** iOS 语义；鸿蒙端映射为申请 LOCATION+APPROXIMATELY_LOCATION（前台组合）。 */
  requestWhenInUseAuthorization(): Promise<boolean>;

  /** iOS 语义；鸿蒙端映射为前台组合 + ohos.permission.LOCATION_IN_BACKGROUND。 */
  requestAlwaysAuthorization(): Promise<boolean>;

  /** iOS 语义；鸿蒙端返回映射后的权限状态字符串（见 types.LocationPermissionStatus）。 */
  getAuthorizationStatus(): Promise<string>;

  /**
   * 开始持续定位：注册 geoLocationManager.on('locationChange')（普通定位请求），
   * 并经 geoLocationManager.getLastLocation() 立即回报最后已知位置
   * （对齐 Android getLastKnownLocation 行为）。由 JS 侧 subscribeToLocationUpdates 触发。
   */
  startUpdatingLocation(): void;

  /**
   * 停止持续定位：geoLocationManager.off('locationChange')，释放定位资源。
   * 由最后一个位置订阅退订触发。
   */
  stopUpdatingLocation(): void;

  /**
   * 开始航向订阅：sensor.on(SensorId.ORIENTATION)，方向传感器 alpha 角
   * （0-360，绕 Z 轴）经 headingFilter 阈值过滤后发送 headingUpdated 事件。
   * 由 JS 侧 subscribeToHeadingUpdates 触发。
   */
  startUpdatingHeading(): void;

  /**
   * 停止航向订阅：sensor.off(SensorId.ORIENTATION)。
   * 传感器不可用时（如模拟器）以 onWarning(502) 降级告警，不崩溃。
   */
  stopUpdatingHeading(): void;

  /**
   * 开始显著位置变化监听：鸿蒙无原生对应 API，以低功耗
   * （LocationRequestPriority.LOW_POWER）+ 1000m 距离间隔的独立
   * locationChange 请求近似实现，不受 configure 的 distanceFilter 影响。
   * 由 JS 侧 subscribeToSignificantLocationUpdates 触发。
   */
  startMonitoringSignificantLocationChanges(): void;

  /**
   * 停止显著位置变化监听：注销显著位置的独立 locationChange 请求。
   * 由最后一个显著位置订阅退订触发。
   */
  stopMonitoringSignificantLocationChanges(): void;

  // NativeEventEmitter 事件注册（事件经 rnInstance.emitDeviceEvent 发送：
  // locationUpdated / headingUpdated / authorizationStatusDidChange / onWarning）
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('RNLocation') as Spec | null;
