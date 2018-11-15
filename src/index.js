/**
 * @providesModule RNLocation
 * @flow
 */
'use strict';

import { NativeModules, NativeEventEmitter } from 'react-native';

const { RNLocation } = NativeModules;

if (!RNLocation) {
  console.warn("Could not find the RNLocation native module. Have you correctly linked react-native-location and rebuilt your app?");
}

export const RNLocationEventEmitter = new NativeEventEmitter(RNLocation);

export default {
  requestAlwaysAuthorization: RNLocation.requestAlwaysAuthorization,
  requestWhenInUseAuthorization: RNLocation.requestWhenInUseAuthorization,
  getAuthorizationStatus: RNLocation.getAuthorizationStatus,
  setDesiredAccuracy: RNLocation.setDesiredAccuracy,
  setDistanceFilter: RNLocation.setDistanceFilter,
  setAllowsBackgroundLocationUpdates: RNLocation.setAllowsBackgroundLocationUpdates,
  startMonitoringSignificantLocationChanges: RNLocation.startMonitoringSignificantLocationChanges,
  stopMonitoringSignificantLocationChanges: RNLocation.stopMonitoringSignificantLocationChanges,
  startUpdatingLocation: RNLocation.startUpdatingLocation,
  stopUpdatingLocation: RNLocation.stopUpdatingLocation,
  startUpdatingHeading: RNLocation.startUpdatingHeading,
  stopUpdatingHeading: RNLocation.stopUpdatingHeading,
  // Events
  RNLocationEventEmitter: RNLocationEventEmitter,
};
