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
      // HarmonyOS permissions
      //
      // 鸿蒙无 iOS 的两段式（whenInUse/always）权限申请，也不同于 Android 的
      // fine/coarse 单项申请；映射规则：
      //   whenInUse / android fine|coarse → 前台组合申请
      //     （ohos.permission.LOCATION + ohos.permission.APPROXIMATELY_LOCATION）
      //   always → 前台组合 + ohos.permission.LOCATION_IN_BACKGROUND（后台定位）
      // 授权结果按组合判定返回 boolean（详见原生实现 RNLocationTurboModule）。
      case "harmony": {
        if (options.ios === "always") {
          return await this.nativeInterface.requestAlwaysAuthorization();
        }
        if (options.ios === "whenInUse" || options.android) {
          return await this.nativeInterface.requestWhenInUseAuthorization();
        }
        return false;
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
      // HarmonyOS permissions
      //
      // 鸿蒙端状态映射（原生 getAuthorizationStatus 返回）：
      //   LOCATION+APPROXIMATELY_LOCATION 均授 → "authorizedFine"（精确，米级）
      //   仅 APPROXIMATELY_LOCATION          → "authorizedCoarse"（模糊，约 5 公里）
      //   前台两权限均未授                   → "denied"（token 层无法区分
      //     notDetermined 与用户拒绝，保守统一返回 denied）
      //   查询异常                           → "restricted"
      //   后台定位另需 LOCATION_IN_BACKGROUND → checkPermission 的 always 档校验
      case "harmony":
        return await this.nativeInterface.getAuthorizationStatus();
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
      // HarmonyOS permissions
      //
      // always 档 = authorizedFine（前台两权限）+ 原生侧校验
      // LOCATION_IN_BACKGROUND；whenInUse / android fine|coarse 档 =
      // authorizedFine；coarse 也接受 authorizedCoarse（与 android 分支同语义）。
      case "harmony": {
        if (options.ios === "always") {
          const status = await this.getCurrentPermission();
          return status === "authorizedAlways";
        }
        const wantsFine =
          options.ios === "whenInUse" ||
          (options.android && options.android.detail === "fine");
        const wantsCoarse =
          !!options.android && options.android.detail === "coarse";
        if (!wantsFine && !wantsCoarse) {
          return false;
        }
        const currentPermission = await this.getCurrentPermission();
        if (wantsFine && currentPermission === "authorizedFine") {
          return true;
        }
        if (
          wantsCoarse &&
          (currentPermission === "authorizedFine" ||
            currentPermission === "authorizedCoarse")
        ) {
          return true;
        }
        return false;
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
