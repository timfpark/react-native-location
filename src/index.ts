import { NativeModules, NativeEventEmitter } from "react-native";
import {
  ConfigureOptions,
  RNLocationNativeInterface,
  RequestPermissionOptions,
  LocationPermissionStatus,
  Subscription,
  Location,
  Heading
} from "./types";
import permissions from "./lib/permissions";
import subscriptions from "./lib/subscriptions";

const RNLocation: RNLocationNativeInterface = NativeModules.RNLocation;
if (!RNLocation) {
  console.warn(
    "Could not find the RNLocation native module. Have you correctly linked react-native-location and rebuilt your app?"
  );
}
const eventEmitter = new NativeEventEmitter(RNLocation);

export const configure = (options: ConfigureOptions): void => {
  RNLocation.configure(options);
};

export const requestPermission = (
  options: RequestPermissionOptions
): Promise<boolean> => {
  return permissions.requestPermission(RNLocation, options);
};

export const getCurrentPermission = (): Promise<LocationPermissionStatus> => {
  return permissions.getCurrentPermission(RNLocation);
};

export const subscribeToPermissionUpdates = (
  listener: (status: LocationPermissionStatus) => void
): Subscription => {
  return permissions.subscribeToPermissionUpdates(eventEmitter, listener);
};

export const subscribeToLocationUpdates = (
  listener: (location: Location) => void
): Subscription => {
  return subscriptions.subscribeToLocationUpdates(
    RNLocation,
    eventEmitter,
    listener
  );
};

export const subscribeToHeadingUpdates = (
  listener: (heading: Heading) => void
): Subscription => {
  return subscriptions.subscribeToHeadingUpdates(
    RNLocation,
    eventEmitter,
    listener
  );
};

export const subscribeToSignificantLocationUpdates = (
  listener: (location: Location) => void
): Subscription => {
  return subscriptions.subscribeToSignificantLocationUpdates(
    RNLocation,
    eventEmitter,
    listener
  );
};

export default {
  configure,
  requestPermission,
  getCurrentPermission,
  subscribeToPermissionUpdates,
  subscribeToLocationUpdates,
  subscribeToHeadingUpdates,
  subscribeToSignificantLocationUpdates
};
