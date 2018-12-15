import { EventEmitter, Platform, PermissionsAndroid } from "react-native";
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
        }
        return false;
      }
      case "android": {
        if (!options.android) {
          return false;
        }

        const granted = await PermissionsAndroid.request(
          options.android.detail === "fine"
            ? PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            : PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          options.android.rationale || undefined
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      default:
        // Unsupported
        return false;
    }
  }

  public async getCurrentPermission(): Promise<LocationPermissionStatus> {
    switch (Platform.OS) {
      case "ios":
        return await this.nativeInterface.getAuthorizationStatus();
      case "android": {
        const fine = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarse = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );

        return fine || coarse ? "authorizedAlways" : "notDetermined";
      }
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
