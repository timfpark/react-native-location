import { EventEmitter, Platform } from "react-native";
import {
  LocationPermissionStatus,
  Subscription,
  RNLocationNativeInterface,
  RequestPermissionOptions
} from "../types";

export const requestPermission = async (
  nativeInterface: RNLocationNativeInterface,
  options: RequestPermissionOptions
): Promise<boolean> => {
  // iOS Permissions
  switch (Platform.OS) {
    case "ios": {
      if (options.ios === "always") {
        return await nativeInterface.requestAlwaysAuthorization();
      } else if (options.ios === "whenInUse") {
        return await nativeInterface.requestWhenInUseAuthorization();
      } else {
        return false;
      }
    }
    case "android":
      // TODO: Android Permissions
      return false;
    default:
      // Unsupported
      return false;
  }
};

export const getCurrentPermission = async (
  nativeInterface: RNLocationNativeInterface
): Promise<LocationPermissionStatus> => {
  switch (Platform.OS) {
    case "ios":
      return await nativeInterface.getAuthorizationStatus();
    case "android":
      // TODO: Implement Android
      return "notDetermined";
    default:
      // Platform not supported, so return "restricted" to signal that there's nothing
      return "restricted";
  }
};

export const subscribeToPermissionUpdates = (
  eventEmitter: EventEmitter,
  listener: (status: LocationPermissionStatus) => void
): Subscription => {
  const emitterSubscription = eventEmitter.addListener(
    "authorizationStatusDidChange",
    listener
  );

  return () => {
    emitterSubscription.remove();
  };
};

export default {
  requestPermission,
  getCurrentPermission,
  subscribeToPermissionUpdates
};
