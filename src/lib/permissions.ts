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
    switch (Platform.OS) {
      // iOS Permissions
      case "ios": {
        if (options.ios === "always") {
          return await this.nativeInterface.requestAlwaysAuthorization();
        } else if (options.ios === "whenInUse") {
          return await this.nativeInterface.requestWhenInUseAuthorization();
        }
        return false;
      }
      // Android permissions
      case "android": {
        if (!options.android) {
          return false;
        }

        const permissionType =
          options.android.detail === "fine"
            ? PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            : PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
        const granted = await PermissionsAndroid.request(
          permissionType,
          options.android.rationale || undefined
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      // Unsupported
      default:
        return false;
    }
  }

  public async getCurrentPermission(): Promise<LocationPermissionStatus> {
    switch (Platform.OS) {
      // iOS permissions
      case "ios":
        return await this.nativeInterface.getAuthorizationStatus();
      // Android permissions
      case "android": {
        const results = await Promise.all([
          PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ),
          PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
          )
        ]);
        if (results[0]) {
          return "authorizedFine";
        } else if (results[1]) {
          return "authorizedCoarse";
        } else {
          return "notDetermined";
        }
      }
      // Unsupported
      default:
        // Platform not supported, so return "restricted" to signal that there's nothing
        return "restricted";
    }
  }

  public async checkPermission(
    options: RequestPermissionOptions
  ): Promise<boolean> {
    switch (Platform.OS) {
      // iOS Permissions
      case "ios": {
        if (!options.ios) {
          return false;
        }
        const currentPermission = await this.nativeInterface.getAuthorizationStatus();
        if (options.ios === "always") {
          return currentPermission === "authorizedAlways";
        } else if (options.ios === "whenInUse") {
          return (
            currentPermission === "authorizedAlways" ||
            currentPermission === "authorizedWhenInUse"
          );
        }
        return false;
      }
      // Android permissions
      case "android": {
        if (!options.android) {
          return false;
        }

        const currentPermission = await this.getCurrentPermission();

        if (options.android.detail === "fine") {
          return currentPermission === "authorizedFine";
        } else if (options.android.detail === "coarse") {
          return (
            currentPermission === "authorizedFine" ||
            currentPermission === "authorizedCoarse"
          );
        } else {
          return false;
        }
      }
      // Unsupported
      default:
        return false;
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
