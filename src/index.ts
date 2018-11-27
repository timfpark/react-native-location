import { NativeModules, NativeEventEmitter } from 'react-native';
import setupLibrary from './lib';
import { AuthorizationStatusCallback } from './types';

const { RNLocation } = NativeModules;

if (!RNLocation) {
  console.warn("Could not find the RNLocation native module. Have you correctly linked react-native-location and rebuilt your app?");
}
export const eventEmitter = new NativeEventEmitter(RNLocation);

const libraryMethods = setupLibrary(RNLocation, eventEmitter)

const deprecatedMethods = {
  requestAlwaysAuthorization: () => {
    console.warn("RNLocation.requestAlwaysAuthorization is deprecated. Please use RNLocation.requestPermission({ ios: \"always\" }) instead")
    libraryMethods.requestPermission({ ios: "always" })
  },
  requestWhenInUseAuthorization: () => {
    console.warn("RNLocation.requestWhenInUseAuthorization is deprecated. Please use RNLocation.requestPermission({ ios: \"whenInUse\" }) instead")
    libraryMethods.requestPermission({ ios: "whenInUse" })
  },
  getAuthorizationStatus: async (callback: AuthorizationStatusCallback) => {
    console.warn("RNLocation.getAuthorizationStatus is deprecated. Please use RNLocation.getCurrentPermission() instead")
    const result = await libraryMethods.getCurrentPermission();
    callback(result);
  },
  setDesiredAccuracy: (_desiredAccuracy: number) => {
    console.warn("RNLocation.setDesiredAccuracy is deprecated. This method call is ignored as it was previously implemented incorrectly. Please use RNLocation.configure({ desiredAccuracy: \"best\" }) instead")
  },
  setDistanceFilter: (distanceFilter: number) => {
    console.warn("RNLocation.setDistanceFilter is deprecated. Please use RNLocation.configure({ distanceFilter: 100 }) instead")
    return libraryMethods.configure({ distanceFilter });
  },
  setAllowsBackgroundLocationUpdates: (allowsBackgroundLocationUpdates: boolean) => {
    console.warn("RNLocation.setAllowsBackgroundLocationUpdates is deprecated. Please use RNLocation.configure({ allowsBackgroundLocationUpdates: false }) instead")
    return libraryMethods.configure({ allowsBackgroundLocationUpdates });
  },
  // Events
  RNLocationEventEmitter: eventEmitter,
  // TODO: Implement deprecated methods
  // startMonitoringSignificantLocationChanges: RNLocation.startMonitoringSignificantLocationChanges,
  // stopMonitoringSignificantLocationChanges: RNLocation.stopMonitoringSignificantLocationChanges,
  // startUpdatingLocation: RNLocation.startUpdatingLocation,
  // stopUpdatingLocation: RNLocation.stopUpdatingLocation,
  // startUpdatingHeading: RNLocation.startUpdatingHeading,
  // stopUpdatingHeading: RNLocation.stopUpdatingHeading,
}

export default {
  ...libraryMethods,
  ...deprecatedMethods,
};
