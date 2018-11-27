import { NativeModules, NativeEventEmitter } from 'react-native';
import setupLibrary from './lib';

const { RNLocation } = NativeModules;

if (!RNLocation) {
  console.warn("Could not find the RNLocation native module. Have you correctly linked react-native-location and rebuilt your app?");
}
export const eventEmitter = new NativeEventEmitter(RNLocation);

export default setupLibrary(RNLocation, eventEmitter)
