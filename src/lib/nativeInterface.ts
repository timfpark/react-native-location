/* eslint-disable valid-jsdoc */

import {
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
  EventEmitter,
  Platform
} from "react-native";
import { RNLocationNativeInterface } from "../types";
import NativeRNLocation from "../specs/v1/NativeRNLocation";

/**
 * TurboModule（新架构）优先：RNOH 鸿蒙端经 codegen 注册 'RNLocation'；
 * 旧架构 RN（android/ios，react-native < 0.60 新架构）回落 NativeModules.RNLocation。
 * 两端模块名保持 'RNLocation' 不变。
 */
const resolveNativeInterface = (): RNLocationNativeInterface => {
  const turbo = NativeRNLocation as RNLocationNativeInterface | null;
  if (turbo && typeof turbo.configure === "function") {
    return turbo;
  }
  return NativeModules.RNLocation as RNLocationNativeInterface;
};

/**
 * 事件通道：
 * - android/ios：NativeEventEmitter(nativeInterface)（原生模块事件表）。
 * - harmony：ArkTS 侧经 rnInstance.emitDeviceEvent 发送（全局 RCTDeviceEventEmitter），
 *   NativeEventEmitter(nativeInterface) 在 RNOH 上无法订阅 TurboModule 事件，
 *   改用 DeviceEventEmitter（RNOH 运行时已实现，等价 RN 的 RCTDeviceEventEmitter）。
 */
const resolveEventEmitter = (
  nativeInterface: RNLocationNativeInterface
): EventEmitter => {
  if (Platform.OS === "harmony") {
    return DeviceEventEmitter as unknown as EventEmitter;
  }
  return new NativeEventEmitter(nativeInterface) as unknown as EventEmitter;
};

/**
 * @ignore
 */
export const get = (): {
  nativeInterface: RNLocationNativeInterface;
  eventEmitter: EventEmitter;
} => {
  const nativeInterface: RNLocationNativeInterface = resolveNativeInterface();
  if (!nativeInterface) {
    console.warn(
      "Could not find the RNLocation native module. Have you correctly linked react-native-location and rebuilt your app?"
    );
  }
  const eventEmitter = resolveEventEmitter(nativeInterface);
  return { nativeInterface, eventEmitter };
};

export default {
  get
};
