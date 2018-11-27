import { EventEmitter, Platform } from "react-native";
import { LocationPermissionStatus, Subscription } from "../types";

let nativeInterface: any;
let eventEmitter: EventEmitter;

export interface RequestPermissionOptions {
  ios?: "whenInUse" | "always" | void,
  android?: "course" | "fine" | void,
}
const requestPermission = async (options: RequestPermissionOptions): Promise<boolean> => {
  // iOS Permissions
  switch (Platform.OS) {
    case "ios": {
      if (options.ios === 'always') {
        return await nativeInterface.requestAlwaysAuthorization();
      } else if (options.ios === 'whenInUse') {
        return await nativeInterface.requestWhenInUseAuthorization();
      } else {
        return true;
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

const getCurrentPermission = async (): Promise<LocationPermissionStatus> => {
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

const subscribeToPermissionUpdates = (listener: (status: LocationPermissionStatus) => void): Subscription => {
  const emitterSubscription = eventEmitter.addListener("authorizationStatusDidChange", listener);

  return () => {
    emitterSubscription.remove();
  }
}

export default (ni: any, em: EventEmitter) => {
  nativeInterface = ni
  eventEmitter = em

  return {
    requestPermission,
    getCurrentPermission,
    subscribeToPermissionUpdates,
  }
}