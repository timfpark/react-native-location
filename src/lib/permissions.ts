import { EventEmitter, Platform } from "react-native";
import {
  LocationPermissionStatus,
  Subscription,
  RNLocationNativeInterface,
  RequestPermissionOptions
} from "../types";

/**
 * Internal helper class for managing permissions
 * @ignore
 */
export default class Permissions {
  private nativeInterface: RNLocationNativeInterface;
  private eventEmitter: EventEmitter;

  public constructor(
    nativeInterface: RNLocationNativeInterface,
    eventEmitter: EventEmitter
  ) {
    this.nativeInterface = nativeInterface;
    this.eventEmitter = eventEmitter;
  }

  public async requestPermission(
    options: RequestPermissionOptions
  ): Promise<boolean> {
    // iOS Permissions
    switch (Platform.OS) {
      case "ios": {
        if (options.ios === "always") {
          return await this.nativeInterface.requestAlwaysAuthorization();
        } else if (options.ios === "whenInUse") {
          return await this.nativeInterface.requestWhenInUseAuthorization();
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
  }

  public async getCurrentPermission(): Promise<LocationPermissionStatus> {
    switch (Platform.OS) {
      case "ios":
        return await this.nativeInterface.getAuthorizationStatus();
      case "android":
        // TODO: Implement Android
        return "notDetermined";
      default:
        // Platform not supported, so return "restricted" to signal that there's nothing
        return "restricted";
    }
  }

  public subscribeToPermissionUpdates(
    listener: (status: LocationPermissionStatus) => void
  ): Subscription {
    const emitterSubscription = this.eventEmitter.addListener(
      "authorizationStatusDidChange",
      listener
    );

    return () => {
      emitterSubscription.remove();
    };
  }
}
