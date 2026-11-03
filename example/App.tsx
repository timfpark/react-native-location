/**
 * react-native-location 鸿蒙 Example
 *
 * Demo 按接口组织测试：每张卡片对应一个公开 API，按钮 =「接口(入参)」，现象就地展示。
 * 覆盖全部 9 个公开 API（对照 react-native-location 2.5.0 接口面）：
 *  ① requestPermission        四种传参（whenInUse / always / android fine / coarse），返回值实时显示
 *  ② getCurrentPermission     状态查询
 *  ③ checkPermission          四档校验（ios whenInUse/always + android fine/coarse）
 *  ④ subscribeToPermissionUpdates  订阅/退订 + 事件实时显示
 *  ⑤ configure                鸿蒙端消费项：distanceFilter / interval / desiredAccuracy
 *                             .android 的 highAccuracy 与 lowPower 两档 / headingFilter，
 *                             另含非法入参 401 告警。iOS 专属 6 项、androidProvider、
 *                             fastestInterval/maxWaitTime 与 desiredAccuracy 的
 *                             balancedPowerAccuracy/noPower 在鸿蒙静默忽略、无效果，
 *                             不设按钮（支持矩阵见 README）
 *  ⑥ subscribeToLocationUpdates    持续定位（订阅/退订/回调计数/回调间隔）
 *  ⑦ getLatestLocation        {timeout:15000} / {timeout:null} / 不传参 三种超时形态
 *  ⑧ subscribeToHeadingUpdates     航向（方向传感器）
 *  ⑨ subscribeToSignificantLocationUpdates  显著位置变化（低功耗近似实现）
 *  + onWarning 事件展示卡片（错误码 401/403/500/502，原生侧透出）
 *
 * 运行前提（真机）：系统「位置信息」开关开启；先在 ① 申请权限并允许。
 * 后台持续定位需 app 侧另接长时任务（本 demo 未接，退后台回调停止属系统行为）。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNLocation, {
  Location,
  LocationPermissionStatus,
  Heading,
} from 'react-native-location';
import { DeviceEventEmitter } from 'react-native';

function formatTimestamp(ts: number): string {
  // Hermes/ArkJS 无 Intl，用 Date getter 手拼（lessons: intl-own-code）
  const d = new Date(ts);
  const pad = (n: number): string => (n < 10 ? '0' + n : '' + n);
  return (
    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  );
}

function locationText(loc: Location | null): string {
  if (!loc) {
    return 'null（超时未获取到位置）';
  }
  return [
    '定位时间 timestamp       : ' + formatTimestamp(loc.timestamp),
    '纬度 latitude            : ' + loc.latitude,
    '经度 longitude           : ' + loc.longitude,
    '水平精度 accuracy        : ' + loc.accuracy + ' m（定位误差半径，值越小越准）',
    '海拔 altitude            : ' + loc.altitude + ' m',
    '垂直精度 altitudeAccuracy: ±' + loc.altitudeAccuracy + ' m',
    '方向 course              : ' + loc.course + '°（0-360 正北基准顺时针；静止时可能为 0）',
    '方向精度 courseAccuracy  : ±' + (loc.courseAccuracy ?? 0) + '°',
    '速度 speed               : ' + loc.speed + ' m/s',
    '速度精度 speedAccuracy   : ±' + (loc.speedAccuracy ?? 0) + ' m/s',
  ].join('\n');
}

// 两位置球面距离（米）——⑨ 卡用于可视化 1000m 显著位置门槛
function haversineMeters(a: Location, b: Location): number {
  const R = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.pow(Math.sin(dLon / 2), 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function App(): JSX.Element {
  // ② getCurrentPermission 查询结果
  const [currentPermissionResult, setCurrentPermissionResult] = useState<string>('未查询');
  // ③ checkPermission 最近一次校验结果
  const [lastCheckResult, setLastCheckResult] = useState<string>('未点击');
  // ① requestPermission 最近一次返回值（实时刷新）
  const [lastRequestResult, setLastRequestResult] = useState<string>('未点击');
  // ④ subscribeToPermissionUpdates 订阅态与最新事件
  const [permSubRunning, setPermSubRunning] = useState(false);
  const [lastPermissionEvent, setLastPermissionEvent] = useState<string>('暂无');
  const [permEventCount, setPermEventCount] = useState(0);
  // （⑧ 当前 headingFilter 改由 ⑤ 的 currentConfig.headingFilter 派生显示）
  // ⑨ 与上一事件的球面距离（可视化 1000m 门槛：隔离状态下相邻事件应 ≥1000m）
  const [sigLastDistance, setSigLastDistance] = useState<string>('－');
  // ⑤ 当前生效参数（demo 侧镜像；null = 未设置 = 原生默认）
  const [currentConfig, setCurrentConfig] = useState<{
    distanceFilter: number | null;
    interval: number | null;
    priority: 'highAccuracy' | 'lowPower' | null;
    headingFilter: number | null;
  }>({ distanceFilter: null, interval: null, priority: null, headingFilter: null });
  const [location, setLocation] = useState<Location | null>(null);
  const [locationCount, setLocationCount] = useState(0);
  const [locIntervals, setLocIntervals] = useState('-');
  const [latestResult, setLatestResult] = useState<string>('-');
  const [latestBusy, setLatestBusy] = useState(false);
  // onWarning effect 依赖为空数组读不到最新 state，用 ref 镜像 busy 供其判定
  const latestBusyRef = useRef(false);

  // busy 双写（state 驱动渲染 + ref 供 onWarning 自动终止判定）
  const setLatestBusyTracked = (busy: boolean): void => {
    latestBusyRef.current = busy;
    setLatestBusy(busy);
  };
  const [heading, setHeading] = useState<Heading | null>(null);
  const [headingCount, setHeadingCount] = useState(0);
  const [significant, setSignificant] = useState<Location | null>(null);
  const [significantCount, setSignificantCount] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [configSummary, setConfigSummary] = useState<string>('默认配置');
  // 订阅开关镜像到 state（ref 变化不触发渲染，按钮文案/强调态读这里）
  const [locRunning, setLocRunning] = useState(false);
  const [headingRunning, setHeadingRunning] = useState(false);
  const [sigRunning, setSigRunning] = useState(false);

  const unsubLocation = useRef<(() => void) | null>(null);
  const unsubHeading = useRef<(() => void) | null>(null);
  const unsubSignificant = useRef<(() => void) | null>(null);
  const unsubPermission = useRef<(() => void) | null>(null);
  const sigLastLocRef = useRef<Location | null>(null);

  // onWarning 监听（库内部也监听并 console.warn；这里在 UI 上展示原生告警）
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'onWarning',
      (opts: { message?: string; type?: string }) => {
        setWarnings(prev =>
          ['[' + (opts?.type ?? '?') + '] ' + (opts?.message ?? '')].concat(prev).slice(0, 8),
        );
        // getLatestLocation 等待期间收到原生告警（如定位开关关闭 3301100）：
        // 自动终止等待并复位按钮，避免 timeout:null 永久 pending 锁死操作。
        // 注意：库语义不变（promise 仍挂在 pending），这里只是放开 example 的 UI。
        if (latestBusyRef.current) {
          setLatestBusyTracked(false);
          setLatestResult('等待已终止（原生告警）：' + (opts?.message ?? ''));
        }
      },
    );
    return () => {
      sub.remove();
    };
  }, []);

  // 组件卸载：解除所有订阅（触发原生 stop*，释放定位/传感器资源）
  useEffect(() => {
    return () => {
      unsubLocation.current?.();
      unsubHeading.current?.();
      unsubSignificant.current?.();
      unsubPermission.current?.();
    };
  }, []);

  const doConfigure = useCallback(async (label: string, options: object) => {
    await RNLocation.configure(options);
    setConfigSummary(label + ' ✓ ' + JSON.stringify(options));
    const o = options as {
      distanceFilter?: number;
      interval?: number;
      headingFilter?: number;
      desiredAccuracy?: { android?: string };
    };
    if (o.distanceFilter !== undefined) {
      setCurrentConfig(c => ({ ...c, distanceFilter: o.distanceFilter ?? null }));
    }
    if (o.interval !== undefined) {
      setCurrentConfig(c => ({ ...c, interval: o.interval ?? null }));
    }
    if (o.headingFilter !== undefined) {
      setCurrentConfig(c => ({ ...c, headingFilter: o.headingFilter ?? null }));
    }
    const da = o.desiredAccuracy?.android;
    if (da === 'highAccuracy' || da === 'lowPower') {
      setCurrentConfig(c => ({ ...c, priority: da }));
    }
  }, []);

  // ── ① requestPermission ──
  // 记录最近一次 requestPermission 的返回值（入参 + 结果，实时刷新）
  const recordRequest = useCallback((label: string, granted: boolean): void => {
    setLastRequestResult(label + ' → ' + granted);
  }, []);

  const doRequestWhenInUse = useCallback(async () => {
    const granted = await RNLocation.requestPermission({ ios: 'whenInUse' });
    recordRequest("requestPermission({ios:'whenInUse'})", granted);
  }, [recordRequest]);

  const doRequestAlways = useCallback(async () => {
    // always 返回值 = 前台已授 && 后台已授（后台仅能设置页手动开启）
    const granted = await RNLocation.requestPermission({ ios: 'always' });
    recordRequest("requestPermission({ios:'always'})", granted);
  }, [recordRequest]);

  const doRequestAndroidStyle = useCallback(async () => {
    // harmony 分支：options.android 亦映射到前台组合权限申请（与 whenInUse 同一原生方法、同返回值）
    const granted = await RNLocation.requestPermission({
      android: { detail: 'fine' },
    });
    recordRequest("requestPermission({android:{detail:'fine'}})", granted);
  }, [recordRequest]);

  const doRequestAndroidCoarse = useCallback(async () => {
    const granted = await RNLocation.requestPermission({
      android: { detail: 'coarse' },
    });
    recordRequest("requestPermission({android:{detail:'coarse'}})", granted);
  }, [recordRequest]);

  // ── ② getCurrentPermission ──
  const doGetCurrentPermission = useCallback(async () => {
    const status = await RNLocation.getCurrentPermission();
    setCurrentPermissionResult(status);
  }, []);

  // ── ③ checkPermission ──
  const doCheckWhenInUse = useCallback(async () => {
    const r = await RNLocation.checkPermission({ ios: 'whenInUse' });
    setLastCheckResult("checkPermission({ios:'whenInUse'}) → " + r);
  }, []);

  const doCheckAlways = useCallback(async () => {
    const r = await RNLocation.checkPermission({ ios: 'always' });
    setLastCheckResult("checkPermission({ios:'always'}) → " + r);
  }, []);

  const doCheckFine = useCallback(async () => {
    const r = await RNLocation.checkPermission({ android: { detail: 'fine' } });
    setLastCheckResult("checkPermission({android:{detail:'fine'}}) → " + r);
  }, []);

  const doCheckCoarse = useCallback(async () => {
    const r = await RNLocation.checkPermission({ android: { detail: 'coarse' } });
    setLastCheckResult("checkPermission({android:{detail:'coarse'}}) → " + r);
  }, []);

  // ── ④ subscribeToPermissionUpdates ──
  const togglePermissionUpdates = useCallback(() => {
    if (unsubPermission.current) {
      unsubPermission.current();
      unsubPermission.current = null;
      setPermSubRunning(false);
    } else {
      const unsub = RNLocation.subscribeToPermissionUpdates((status: LocationPermissionStatus) => {
        setPermEventCount(c => c + 1);
        setLastPermissionEvent(status + ' @ ' + formatTimestamp(Date.now()));
      });
      unsubPermission.current = unsub;
      setPermSubRunning(true);
    }
  }, []);

  // 非法入参：distanceFilter < 0 触发原生 401 参数告警（见 onWarning 卡片），非法值不生效
  const doConfigureInvalid = useCallback(async () => {
    await RNLocation.configure({ distanceFilter: -1 });
    setConfigSummary('已提交非法入参（应在告警区见 [401]，原配置保持不变）');
  }, []);

  const doGetLatestLocation = useCallback(async () => {
    setLatestBusyTracked(true);
    setLatestResult('获取中…');
    const loc = await RNLocation.getLatestLocation({ timeout: 15000 });
    setLatestResult(locationText(loc));
    setLatestBusyTracked(false);
  }, []);

  // timeout: null = 不设超时，一直等到首个位置（由订阅退订结束）
  const doGetLatestLocationNoTimeout = useCallback(async () => {
    setLatestBusyTracked(true);
    setLatestResult('获取中…（timeout:null，取到首个位置即返回）');
    const loc = await RNLocation.getLatestLocation({ timeout: null });
    setLatestResult(locationText(loc));
    setLatestBusyTracked(false);
  }, []);

  // 缺省 timeout = 库默认 10s
  const doGetLatestLocationDefaultTimeout = useCallback(async () => {
    setLatestBusyTracked(true);
    setLatestResult('获取中…（缺省 timeout，库默认 10s）');
    const loc = await RNLocation.getLatestLocation();
    setLatestResult(locationText(loc));
    setLatestBusyTracked(false);
  }, []);

  const toggleLocationUpdates = useCallback(() => {
    if (unsubLocation.current) {
      unsubLocation.current();
      unsubLocation.current = null;
      setLocRunning(false);
    } else {
      let lastCbAt = 0;
      let intervals: string[] = [];
      const unsub = RNLocation.subscribeToLocationUpdates((locations: Location[]) => {
        if (locations.length === 0) {
          return;
        }
        // 记录最近 5 次回调间隔,用于验证 configure 的 interval/distanceFilter 实际生效
        const now = Date.now();
        if (lastCbAt > 0) {
          intervals = [String(now - lastCbAt) + 'ms'].concat(intervals).slice(0, 5);
          setLocIntervals(intervals.join(' / '));
        }
        lastCbAt = now;
        const sorted = locations.slice().sort((a, b) => b.timestamp - a.timestamp);
        setLocation(sorted[0]);
        setLocationCount(c => c + 1);
      });
      unsubLocation.current = unsub;
      setLocRunning(true);
    }
  }, []);

  const toggleHeadingUpdates = useCallback(() => {
    if (unsubHeading.current) {
      unsubHeading.current();
      unsubHeading.current = null;
      setHeadingRunning(false);
    } else {
      const unsub = RNLocation.subscribeToHeadingUpdates((h: Heading) => {
        setHeading(h);
        setHeadingCount(c => c + 1);
      });
      unsubHeading.current = unsub;
      setHeadingRunning(true);
    }
  }, []);

  const toggleSignificantUpdates = useCallback(() => {
    if (unsubSignificant.current) {
      unsubSignificant.current();
      unsubSignificant.current = null;
      setSigRunning(false);
      sigLastLocRef.current = null;
      setSigLastDistance('－');
    } else {
      const unsub = RNLocation.subscribeToSignificantLocationUpdates((locations: Location[]) => {
        if (locations.length === 0) {
          return;
        }
        const sorted = locations.slice().sort((a, b) => b.timestamp - a.timestamp);
        const cur = sorted[0];
        const prev = sigLastLocRef.current;
        if (prev) {
          // 与上一帧的球面距离:隔离状态下应 ≥1000m(1000m 门槛的直接可视化)
          setSigLastDistance(haversineMeters(prev, cur).toFixed(0) + ' m');
        } else {
          setSigLastDistance('首帧（无参照点）');
        }
        sigLastLocRef.current = cur;
        setSignificant(cur);
        setSignificantCount(c => c + 1);
      });
      unsubSignificant.current = unsub;
      setSigRunning(true);
    }
  }, []);

  // ⑨ 卡计数性质提示：⑥/⑦ 是否在跑（共享事件通道的干扰源）
  const sigInterferers = [locRunning ? '⑥' : null, latestBusy ? '⑦' : null]
    .filter(Boolean)
    .join('、');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>react-native-location（HarmonyOS）</Text>

        {/* 使用说明：鸿蒙端已知边界（后台长时任务 / 默认过滤 / GNSS / timeout:null 语义） */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>使用说明（鸿蒙端已知边界）</Text>
          <Text style={styles.dim}>
            1. 后台持续定位 = 后台定位权限 + 长时任务（backgroundTaskManager，LOCATION
            类型），两者缺一不可。本 demo 未接长时任务：退后台/锁屏后回调会停止，属系统
            行为，非 bug；需后台定位请在 app 侧自行接入长时任务。
          </Text>
          <Text style={styles.dim}>
            2. 定位 fix 来源二选一：GNSS（室外/窗边见天）或 网络定位（WLAN/基站，需联网）。
            室内且断网时两者皆无→注册成功但永不回调、无任何告警（真机实测：联网后恢复）。
            可用「distanceFilter=0(实时)」验证回调链路是否正常。
          </Text>
          <Text style={styles.dim}>
            3. timeout:null 为源库语义（等到首个位置为止）：定位开关关闭时原生立刻告警，
            本 demo 会自动终止等待并复位按钮；但该次调用不会自动恢复，需重新触发订阅。
          </Text>
          <Text style={styles.dim}>
            4. 排查顺序：先看「onWarning 原生告警」卡片，再看持续定位回调计数；真机日志：
            hdc shell hilog | findstr RNLocation。
          </Text>
        </View>

        {/* ① requestPermission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>① requestPermission（申请定位权限）</Text>
          <Text style={styles.mono}>返回值: {lastRequestResult}</Text>
          <View style={styles.row}>
            <Btn title="requestPermission({ios:'whenInUse'})" onPress={doRequestWhenInUse} />
            <Btn title="requestPermission({ios:'always'})" onPress={doRequestAlways} />
          </View>
          <View style={styles.row}>
            <Btn title="requestPermission({android:{detail:'fine'}})" onPress={doRequestAndroidStyle} />
            <Btn title="requestPermission({android:{detail:'coarse'}})" onPress={doRequestAndroidCoarse} />
          </View>
          <Text style={styles.dim}>
            {"{ios:'whenInUse'}:首次点击弹系统权限弹窗(本次使用允许/仅使用期间允许/不允许);允许后返回 true、getCurrentPermission 变 authorizedFine;被拒绝过一次后不再弹窗、恒 false,需到设置中恢复。"}
          </Text>
          <Text style={styles.dim}>
            {"{ios:'always'}:先弹前台弹窗;后台权限不弹窗也不会自动授予,需到 设置→应用→权限→位置信息 手动选「始终允许」;前台已授且已开「始终允许」时才返回 true,否则 false。"}
          </Text>
          <Text style={styles.dim}>
            {"{android:{detail:'fine'}}:与 whenInUse 是同一个前台组合申请;已授权后点击不再弹窗、直接返回 true。"}
          </Text>
          <Text style={styles.dim}>
            {"{android:{detail:'coarse'}}:同为前台组合申请,现象与 fine 完全相同;档位差异属对齐原库 Android 语义的保留项(仅模糊定位 authorizedCoarse 时也判通过,鸿蒙正常申请流程产生不了该状态)。"}
          </Text>
        </View>

        {/* ② getCurrentPermission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>② getCurrentPermission（查询当前权限状态）</Text>
          <Text style={styles.mono}>结果: {currentPermissionResult}</Text>
          <View style={styles.row}>
            <Btn title="getCurrentPermission()" onPress={doGetCurrentPermission} />
          </View>
          <Text style={styles.dim}>
            取值对照: authorizedAlways=含后台(始终允许) / authorizedFine=仅前台精确 / authorizedCoarse=仅模糊定位 / denied=未授权 / restricted=查询异常。
          </Text>
        </View>

        {/* ③ checkPermission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>③ checkPermission（校验权限档位）</Text>
          <Text style={styles.mono}>结果: {lastCheckResult}</Text>
          <View style={styles.row}>
            <Btn title="checkPermission({ios:'whenInUse'})" onPress={doCheckWhenInUse} />
            <Btn title="checkPermission({ios:'always'})" onPress={doCheckAlways} />
          </View>
          <View style={styles.row}>
            <Btn title="checkPermission({android:{detail:'fine'}})" onPress={doCheckFine} />
            <Btn title="checkPermission({android:{detail:'coarse'}})" onPress={doCheckCoarse} />
          </View>
          <Text style={styles.dim}>
            档位判定: whenInUse=authorizedFine/authorizedAlways 均过; always 仅 authorizedAlways; fine 仅 authorizedFine; coarse 接受 authorizedFine/authorizedCoarse。
          </Text>
        </View>

        {/* ④ subscribeToPermissionUpdates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>④ subscribeToPermissionUpdates（订阅权限状态变化）</Text>
          <View style={styles.row}>
            <Btn
              title={permSubRunning ? 'unsubscribe() 退订' : 'subscribeToPermissionUpdates()'}
              emphasized={!permSubRunning}
              onPress={togglePermissionUpdates}
            />
            <Text style={styles.counter}>事件 {permEventCount} 次</Text>
          </View>
          <Text style={styles.mono}>最新事件: {lastPermissionEvent}</Text>
          <Text style={styles.dim}>
            触发条件:鸿蒙无系统级权限变更推送(iOS 为系统实时推送),事件仅在权限查询/申请时到达——
            点 ② getCurrentPermission、③ checkPermission 或 ① requestPermission 后,状态相对上次有变化才触发(去重)。
          </Text>
          <Text style={styles.dim}>
            去设置改权限后,需回 Demo 点任一查询/申请按钮才能感知变更;订阅后的首次查询必触发一次(初始状态上报,等价 iOS 首次回调)。
          </Text>
        </View>

        {/* ⑤ configure */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⑤ configure（定位参数，单参数逐项设置，多次点击自动合并）</Text>
          <Text style={styles.mono}>当前生效：{configSummary}（原生默认 interval=0 即系统最小间隔）</Text>
          <Text style={styles.dim}>
            单参数设计：每个按钮只改一个参数，便于单变量对比；多次点击自动合并（只改传入项）——
            例如"高精度+实时"= 依次点 highAccuracy 与 distanceFilter:0。订阅运行中点击会按
            新参数自动重启，无需退订重订；headingFilter 的快捷按钮在 ⑧ 航向卡；⑨ 显著位置
            变化为独立通道、不受本接口影响。
          </Text>
          <Text style={styles.label}>
            distanceFilter 距离过滤（米，触发回调的最小位移变化）—— 当前：
            {currentConfig.distanceFilter === null ? '原生默认' : currentConfig.distanceFilter + ' m'}：
          </Text>
          <View style={styles.row}>
            <Btn title="configure({distanceFilter:0})" selected={currentConfig.distanceFilter === 0} onPress={() =>
              doConfigure('distanceFilter=0', { distanceFilter: 0 })} />
            <Btn title="configure({distanceFilter:5})" selected={currentConfig.distanceFilter === 5} onPress={() =>
              doConfigure('distanceFilter=5', { distanceFilter: 5 })} />
          </View>
          <Text style={styles.dim}>
            0=不做距离过滤（每个间隔周期必回调，验证回调链路）；5=移动超 5m 才回调。
          </Text>
          <Text style={styles.label}>
            interval 时间间隔（毫秒，系统下限 GNSS 1s / 网络定位 20s）—— 当前：
            {currentConfig.interval === null ? '0（原生默认=系统最小间隔）' : currentConfig.interval + ' ms'}：
          </Text>
          <View style={styles.row}>
            <Btn title="configure({interval:1000})" selected={currentConfig.interval === 1000} onPress={() =>
              doConfigure('interval=1000', { interval: 1000 })} />
            <Btn title="configure({interval:10000})" selected={currentConfig.interval === 10000} onPress={() =>
              doConfigure('interval=10000', { interval: 10000 })} />
          </View>
          <Text style={styles.dim}>
            在 ⑥ 卡「回调间隔(近5次)」直接观察生效效果；低于系统下限时按系统下限。
          </Text>
          <Text style={styles.label}>
            desiredAccuracy.android 精度优先级 —— 当前：
            {currentConfig.priority ?? '系统默认（FIRST_FIX，未设置）'}：
          </Text>
          <View style={styles.row}>
            <Btn title="configure({desiredAccuracy:{android:'highAccuracy'}})" selected={currentConfig.priority === 'highAccuracy'} onPress={() =>
              doConfigure('highAccuracy', { desiredAccuracy: { android: 'highAccuracy' } })} />
            <Btn title="configure({desiredAccuracy:{android:'lowPower'}})" selected={currentConfig.priority === 'lowPower'} onPress={() =>
              doConfigure('lowPower', { desiredAccuracy: { android: 'lowPower' } })} />
          </View>
          <Text style={styles.dim}>
            能力关系：highAccuracy 的数据源覆盖网络定位（室内 GNSS 不可用会自动回退），
            即包含 lowPower 的定位能力且更准，代价是功耗高；lowPower 的价值在省电与强制
            纯网络通道。
          </Text>
          <Text style={styles.dim}>
            highAccuracy=GNSS 精度优先；lowPower=低功耗纯网络定位（室内可用，
            必须联网）。balancedPowerAccuracy/noPower 鸿蒙不支持（静默忽略）。
          </Text>
          <View style={styles.row}>
            {/* 非法入参：distanceFilter<0 触发原生 401 参数告警，非法值不生效（原配置保持） */}
            <Btn title="configure({distanceFilter:-1}) → 401" onPress={doConfigureInvalid} />
            <Btn title="configure({}) 空入参" onPress={() => doConfigure('空入参（不改变参数）', {})} />
          </View>
          <Text style={styles.dim}>
            特殊按钮说明：configure({'{distanceFilter:-1}'}) 为非法入参——原生校验拒绝该值、
            发 401 告警（onWarning 卡可见 [401] distanceFilter must be a non-negative number），
            原配置保持不变（非法值不写入，「当前生效」JSON 不变）；configure({'{}'}) 传空对象=
            不修改任何参数，已配置的值全部保留；用于触发原生回读当前生效配置（hilog
            "configure effective" 行）。注意：若 ⑥ 订阅运行中，点击会重启一轮订阅——新会话
            立即回报一次缓存位置，⑥⑨ 卡计数会 +1。
          </Text>
        </View>

        {/* ⑥ subscribeToLocationUpdates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⑥ subscribeToLocationUpdates（持续定位）</Text>
          <View style={styles.row}>
            <Btn
              title={locRunning ? 'unsubscribe() 退订' : 'subscribeToLocationUpdates()'}
              emphasized={!locRunning}
              onPress={toggleLocationUpdates}
            />
            <Text style={styles.counter}>事件 {locationCount} 次（与⑨共用通道）</Text>
          </View>
          <Text style={styles.counter}>
            回调间隔(近5次):{locIntervals}
            {locRunning ? '' : '(未订阅)'}
          </Text>
          <Text style={styles.mono}>{locationText(location)}</Text>
          <Text style={styles.dim}>
            网络要求：室内测试必须联网（室内无 GNSS，只能靠 WLAN/基站网络定位）；
            lowPower 档为纯网络定位，任何场景都必须联网（balancedPowerAccuracy/noPower
            已静默忽略、不改变优先级）；
            户外见天 GNSS 可离线定位，但无辅助数据首帧很慢。
          </Text>
          <Text style={styles.dim}>
            现象速查：订阅后 1~2 秒内的首帧是系统缓存的历史位置（getLastLocation 立即回报，
            对齐 Android），时间戳偏旧属预期；配合 ⑤ configure 调参观察（订阅中改配置立即按
            新参数重启）；无权限订阅收 403、
            总开关关闭收 500（onWarning 卡可见）；退订后计数停止、原生 off 释放资源。
          </Text>
        </View>

        {/* ⑦ getLatestLocation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⑦ getLatestLocation（单次最新定位）</Text>
          <View style={styles.row}>
            <Btn title={latestBusy ? '获取中…' : 'getLatestLocation({timeout:15000})'} onPress={doGetLatestLocation} disabled={latestBusy} />
            <Btn title="getLatestLocation({timeout:null})" onPress={doGetLatestLocationNoTimeout} disabled={latestBusy} />
            <Btn title="getLatestLocation()" onPress={doGetLatestLocationDefaultTimeout} disabled={latestBusy} />
          </View>
          <Text style={styles.mono}>{latestResult}</Text>
          <Text style={styles.dim}>
            结果判读：若返回位置的 timestamp 是几分钟前的旧值，说明命中了缓存快路径（订阅建立时
            原生立即回报系统历史位置 getLastLocation，未等新定位）——这是"取最新已知位置"的
            语义（接口名为 getLatest 而非 getCurrent 即此原因），非 bug；timestamp 为当前时间
            才代表实时新定位。
          </Text>
          <Text style={styles.dim}>
            timeout:null 为源库语义：不设超时、一直等到首个位置；定位开关关闭时原生会立刻
            告警并自动终止等待、复位按钮（但需重新触发订阅才能恢复取位）。
          </Text>
          <Text style={styles.dim}>
            timeout:null 注意：取不到位置时内部订阅会持续存活（源库语义），期间主通道保持
            运行——此时退订 ⑥ 也不会停止原生定位，且无任何 UI 提示（告警自动终止只复位
            按钮、不取消订阅）。测完建议重启 App 清理残留订阅。
          </Text>
          <Text style={styles.dim}>
            网络要求：与 ⑥ 相同——室内取位必须联网；断网+室内时超时后返回 null
          </Text>
        </View>

        {/* ⑧ subscribeToHeadingUpdates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⑧ subscribeToHeadingUpdates（航向，方向传感器）</Text>
          <View style={styles.row}>
            <Btn
              title={headingRunning ? 'unsubscribe() 退订' : 'subscribeToHeadingUpdates()'}
              emphasized={!headingRunning}
              onPress={toggleHeadingUpdates}
            />
            <Text style={styles.counter}>回调 {headingCount} 次</Text>
          </View>
          <Text style={styles.mono}>
            {heading ? 'heading: ' + heading.heading.toFixed(1) + '°（0-360，绕 Z 轴）' : '未订阅'}
          </Text>
          <Text style={styles.mono}>
            当前 headingFilter: {currentConfig.headingFilter === null ? '0（原生默认，不过滤）' : currentConfig.headingFilter + '°'}
          </Text>
          <View style={styles.row}>
            <Btn title="configure({headingFilter:0})" selected={currentConfig.headingFilter === 0} onPress={() =>
              doConfigure('headingFilter=0', { headingFilter: 0 })} />
            <Btn title="configure({headingFilter:10})" selected={currentConfig.headingFilter === 10} onPress={() =>
              doConfigure('headingFilter=10°', { headingFilter: 10 })} />
            <Btn title="configure({headingFilter:45})" selected={currentConfig.headingFilter === 45} onPress={() =>
              doConfigure('headingFilter=45°', { headingFilter: 45 })} />
          </View>
          <Text style={styles.dim}>
            阈值实时生效（无需重启订阅）：0=转一点就回调；10=转超 10° 才回调；45=转超 45° 才回调。
            与上方订阅配合：先点订阅，再切阈值，转动手机观察计数变化节奏。
          </Text>
          <Text style={styles.dim}>
            测试姿势：手机平放桌面（屏幕朝上），像转指南针一样水平旋转——此为标准绕 Z 轴旋转
            （Z 轴=垂直于屏幕指向屏幕外的轴），heading 以手机顶部（12 点钟方向）所指为准：
            北 0°/东 90°/南 180°/西 270°。竖持原地转身也可测（数值会叠加姿态影响）；
            勿用抬头/低头、翻面等绕 X/Y 轴动作（alpha 不变或异常跳变）；
            强磁场（磁吸支架/音箱）会导致偏差，必要时手持画"8"字校准罗盘。
          </Text>
          <Text style={styles.dim}>说明：鸿蒙无 CLHeading，以方向传感器 alpha 角近似；模拟器可能无传感器（会收到 onWarning 502）。</Text>
        </View>

        {/* ⑨ subscribeToSignificantLocationUpdates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⑨ subscribeToSignificantLocationUpdates（显著位置变化，独立通道）</Text>
          <View style={styles.row}>
            <Btn
              title={sigRunning ? 'unsubscribe() 退订' : 'subscribeToSignificantLocationUpdates()'}
              emphasized={!sigRunning}
              onPress={toggleSignificantUpdates}
            />
            <Text style={styles.counter}>事件 {significantCount} 次（与⑥⑦共用通道）</Text>
          </View>
          <Text style={styles.mono}>与上一事件距离: {sigLastDistance}</Text>
          <Text style={styles.mono}>{significant ? locationText(significant) : '未订阅'}</Text>
          <Text style={styles.dim}>
            计数性质:{sigInterferers ? '共享计数（当前含 ' + sigInterferers + ' 的事件）' : '⑨ 专属计数（当前隔离）'}。
            locationUpdated 事件被 ⑥⑦⑨ 共用（与原库一致，负载不带通道标识）——⑥ 的事件与
            ⑦ 的多帧（缓存帧+新定位帧）都会进入本计数，属设计行为而非串数据。
          </Text>
          <Text style={styles.dim}>
            1000m 门槛：约束同一会话内相对上一帧的距离差。反复退订/重订会开启新会话，
            会话首帧不受 1000m 约束、直接回调（不移动也出数据的原因）。首帧到达后原地不动，
            「与上一事件距离」应保持 ≥1000m、计数不涨。
          </Text>
          <Text style={styles.dim}>
            最可靠的测试方式：卸载重装本 demo（清空残留订阅、timeout:null 隐形订阅等全部
            状态），在 ① 重新申请权限后，只订阅本卡测试——彻底排除 ⑥/⑦ 共享事件与残留
            状态的干扰。注意重装会同时清空权限与系统缓存位置：需重新授权，且首帧只能靠
            真实定位（比平时稍慢属预期）。
          </Text>
          <Text style={styles.dim}>
            不重装时的快速隔离法：第1步 退订⑥、不点⑦；第2步 点本按钮一次，联网等首帧
            （几十秒，无需移动）；第3步 原地不动→距离行与计数均不变=门槛生效，移动 ≥1km→
            距离跳到公里级、计数 +1。
            必须联网（纯网络定位，断网通道静默）；粒度粗于 iOS（基站级 ~500m）。
          </Text>
        </View>

        {/* 告警 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>onWarning 原生告警（最近 8 条）</Text>
          {warnings.length === 0
            ? <Text style={styles.dim}>暂无（位置开关关闭/无权限时会收到 403/3301100 映射告警）</Text>
            : warnings.map((w, i) => (
              <Text key={i} style={styles.warn}>{w}</Text>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface BtnProps {
  title: string;
  onPress: () => void;
  emphasized?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

function Btn({ title, onPress, emphasized, disabled, selected }: BtnProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.btn, emphasized && styles.btnEmph, selected && styles.btnSelected, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}>
      <Text style={[styles.btnText, emphasized && styles.btnTextEmph]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f3f5',
  },
  scroll: {
    padding: 12,
    paddingBottom: 40,
  },
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 4,
    gap: 8,
  },
  btn: {
    backgroundColor: '#e8eaed',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  btnEmph: {
    backgroundColor: '#2f6fed',
  },
  btnSelected: {
    borderWidth: 2,
    borderColor: '#2f6fed',
    backgroundColor: '#e7f0ff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#333',
    fontSize: 13,
  },
  btnTextEmph: {
    color: '#ffffff',
  },
  mono: {
    fontFamily: 'Courier New',
    fontSize: 12,
    color: '#222',
    marginTop: 4,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    color: '#555',
    marginTop: 8,
  },
  dim: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  warn: {
    fontSize: 11,
    color: '#b3261e',
    marginTop: 4,
  },
  counter: {
    fontSize: 12,
    color: '#555',
  },
});

export default App;
