/* eslint-disable valid-jsdoc */

import { NativeModules, NativeEventEmitter, EventEmitter } from "react-native";
import { RNLocationNativeInterface } from "../types";

/**
 * @ignore
 */
export const get = (): {
  nativeInterface: RNLocationNativeInterface;
  eventEmitter: EventEmitter;
} => {
  const nativeInterface: RNLocationNativeInterface = NativeModules.RNLocation;
  if (!nativeInterface) {
    console.warn(
      "Could not find the RNLocation native module. Have you correctly linked react-native-location and rebuilt your app?"
    );
  }
  const eventEmitter = new NativeEventEmitter(nativeInterface);
  return { nativeInterface, eventEmitter };
};

export default {
  get
};
