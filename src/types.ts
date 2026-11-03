/**
 * The permission status for location services.
 *
 * HarmonyOS mapping (native `getAuthorizationStatus`):
 * - `LOCATION` + `APPROXIMATELY_LOCATION` both granted -> `authorizedFine`
 * - `APPROXIMATELY_LOCATION` granted only -> `authorizedCoarse`
 * - both foreground permissions granted + `LOCATION_IN_BACKGROUND` -> `authorizedAlways`
 * - neither foreground permission granted -> `denied` (the token layer cannot
 *   distinguish "never asked" from "user denied")
 * - status query failed -> `restricted`
 * @platform ios android harmony
 */
export type LocationPermissionStatus =
  // iOS
  | "authorizedAlways"
  | "authorizedWhenInUse"
  // Android
  | "authorizedFine"
  | "authorizedCoarse"
  // Shared
  | "denied"
  | "restricted"
  | "notDetermined";
/**
 * Constants indicating the type of activity associated with location updates.
 * @platform ios
 * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/clactivitytype?language=objc)
 */
export type LocationActivityType =
  | "other"
  | "automotiveNavigation"
  | "fitness"
  | "otherNavigation"
  | "airborne"; // iOS 12+
/**
 * The location provider to use for Android.
 * @platform android
 */
export type AndroidProvider = "auto" | "playServices" | "standard";
/**
 * The accuracy of the location responses for Android.
 * @platform android
 * @see [Apple Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest#setPriority(int))
 */
export type LocationPriorityAndroid =
  | "balancedPowerAccuracy"
  | "highAccuracy"
  | "lowPower"
  | "noPower";
/**
 * The accuracy of a geographical coordinate for iOS.
 * @platform ios
 * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationaccuracy?language=objc)
 */
export type LocationAccuracyIOS =
  | "bestForNavigation"
  | "best"
  | "nearestTenMeters"
  | "hundredMeters"
  | "threeKilometers";
/**
 * Constants indicating the physical orientation of the device.
 * @platform ios
 * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cldeviceorientation?language=objc)
 */
export type HeadingOrientation =
  | "portrait"
  | "portraitUpsideDown"
  | "landscapeLeft"
  | "landscapeRight";

/**
 * A single location fix delivered through the `locationUpdated` event
 * (payload is a `Location[]`, JS side sorts by `timestamp` and takes the latest)
 * or resolved by `getLatestLocation`.
 * @platform ios android harmony
 */
export interface Location {
  /**
   * The time that the device was at this location.
   * @platform android ios harmony
   * HarmonyOS: mapped from `geoLocationManager.Location.timeStamp` (UTC milliseconds).
   */
  timestamp: number;
  /**
   * The latitude of the location.
   * @platform android ios harmony
   */
  latitude: number;
  /**
   * The longitude of the location.
   * @platform android ios harmony
   */
  longitude: number;
  /**
   * The radius of uncertainty for the location, measured in meters.
   * @platform android ios harmony
   * HarmonyOS: mapped from `geoLocationManager.Location.accuracy`.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423599-horizontalaccuracy?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getAccuracy())
   */
  accuracy: number;
  /**
   * The altitude of the location in meters.
   * @platform android ios harmony
   * HarmonyOS: mapped from `geoLocationManager.Location.altitude`.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423820-altitude?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getAltitude())
   */
  altitude: number;
  /**
   * The accuracy of the altitude value, measured in meters.
   * @platform android ios harmony
   * HarmonyOS: mapped from `altitudeAccuracy` (API 12+ optional field, defaults to `0` when absent).
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423550-verticalaccuracy?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getVerticalAccuracyMeters())
   */
  altitudeAccuracy: number;
  /**
   * The direction in which the device is traveling, measured in degrees and relative to due north.
   * @platform android ios harmony
   * HarmonyOS: mapped from `geoLocationManager.Location.direction` (0-360, due north baseline).
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423832-course?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getBearing())
   */
  course: number;
  /**
   * Get the estimated course accuracy of this location, in degrees.
   * @platform android harmony
   * HarmonyOS: mapped from `directionAccuracy` (optional field, defaults to `0` when absent).
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getBearingAccuracyDegrees())
   */
  courseAccuracy?: number;
  /**
   * The instantaneous speed of the device, measured in meters per second.
   * @platform android ios harmony
   * HarmonyOS: mapped from `geoLocationManager.Location.speed`.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423798-speed?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getSpeed())
   */
  speed: number;
  /**
   * Get the estimated speed accuracy of this location, in meters per second.
   * @platform android harmony
   * HarmonyOS: mapped from `speedAccuracy` (optional field, defaults to `0` when absent).
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getSpeedAccuracyMetersPerSecond())
   */
  speedAccuracy?: number;
  /**
   * The logical floor of the building in which the user is located.
   * @platform ios
   * Not produced on HarmonyOS (no equivalent capability; the field is absent from the payload).
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1616762-floor?language=objc)
   */
  floor?: number;
  /**
   * If the location comes from a mock provider.
   * @platform android
   * Not produced on HarmonyOS (no equivalent semantics; the field is absent from the payload).
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#isFromMockProvider())
   */
  fromMockProvider?: boolean;
}
/**
 * A heading update delivered through the `headingUpdated` event.
 *
 * HarmonyOS: approximated with the orientation sensor
 * (`sensor.on(SensorId.ORIENTATION)`), where `alpha` (0-360 degrees, around
 * the Z axis) is used as the compass heading (north = 0, east = 90). There is
 * no `trueHeading` / `magneticHeading` distinction on HarmonyOS.
 * @platform ios harmony
 */
export interface Heading {
  /**
   * The heading in degrees (0-360, around the Z axis).
   * @platform ios harmony
   */
  heading: number;
}

/**
 * The configuration options for the location provider, passed to `configure`.
 *
 * `configure` can be called multiple times and only changes the settings which
 * are present in the given options; running subscriptions are restarted with
 * the new settings on HarmonyOS.
 */
export interface ConfigureOptions {
  /**
   * The minimum distance in meters that the device location needs to change before the location update callback in your app is called. Defaults to `0` for no filtering.
   * @platform android ios harmony
   * HarmonyOS: mapped to `distanceInterval`. The native default is `100`m on
   * HarmonyOS (aligned with the Android `RNStandardLocationProvider`), not `0`.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1423500-distancefilter)
   * @see [Android Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#setSmallestDisplacement(float))
   */
  distanceFilter?: number | void;
  /**
   * The type of user activity associated with the location updates. Defaults to `other`.
   * @platform ios
   * Not supported on HarmonyOS; silently ignored.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620567-activitytype)
   */
  activityType?: LocationActivityType | void;

  /**
   * The provider which is used on Android to get the location. Your app must include the Google Play services dependencies to use the `playServices` location provider. By default it will choose the `playServices` location provider if it detects that the dependencies are installed, otherwise, it will use the `standard` Android version which does not require Google Play Services to be installed. Note that `auto` only checks that the dependencies are installed, not that the user has the Google Play services APK installed and set up correctly.
   * @platform android
   * Not supported on HarmonyOS (single system location service via LocationKit); silently ignored.
   */
  androidProvider?: AndroidProvider | void;
  /**
   * The desired interval for active location updates, in milliseconds.
   * @platform android harmony
   * HarmonyOS: converted to `timeInterval` in seconds; the smallest positive
   * value of `interval` / `fastestInterval` / `maxWaitTime` takes effect. The
   * system enforces minimums of 1s (GNSS) and 20s (network positioning).
   * @see [Android Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#setInterval(long))
   */
  interval?: number | void;
  /**
   * Explicitly set the fastest interval for location updates, in milliseconds.
   *
   * This controls the fastest rate at which your application will receive location updates, which might be faster than `interval` in some situations (for example, if other applications are triggering location updates).
   *
   * This allows your application to passively acquire locations at a rate faster than it actively acquires locations, saving power.
   * @platform android harmony
   * HarmonyOS: no standalone equivalent; merged into `timeInterval` with `interval` (smallest positive value wins).
   * @see [Android Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#setFastestInterval(long))
   */
  fastestInterval?: number | void;
  /**
   * Sets the maximum wait time in milliseconds for location updates.
   *
   * If you pass a value at least 2x larger than the interval specified with setInterval(long), then location delivery may be delayed and multiple locations can be delivered at once.
   * @platform android harmony
   * HarmonyOS: no standalone equivalent; merged into `timeInterval` with `interval` (smallest positive value wins).
   * @see [Android Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#setMaxWaitTime(long))
   */
  maxWaitTime?: number | void;

  /**
   * A Boolean value indicating whether the app should receive location updates when suspended. Requires permissions to always access the users location. Defaults to `false`.
   * @platform ios
   * Not supported on HarmonyOS; background location is controlled by the
   * `ohos.permission.LOCATION_IN_BACKGROUND` permission instead. Silently ignored.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620568-allowsbackgroundlocationupdates)
   */
  allowsBackgroundLocationUpdates?: boolean | void;
  /**
   * The accuracy of the location data. Defaults to `best` on iOS and `balancedPowerAccuracy` on Android.
   * @platform android ios harmony
   * HarmonyOS: `android` is consumed - `highAccuracy` maps to
   * `LocationRequestPriority.ACCURACY`, `balancedPowerAccuracy` / `lowPower` /
   * `noPower` map to `LocationRequestPriority.LOW_POWER`; when absent the
   * native default is `FIRST_FIX`. `ios` is silently ignored.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1423836-desiredaccuracy)
   * @see [Android Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#setPriority(int))
   */
  desiredAccuracy?: {
    ios?: LocationAccuracyIOS | void;
    android?: LocationPriorityAndroid | void;
  } | void;
  /**
   * The minimum angle in degrees that the device heading needs to change before the heading update callback in your app is called. Defaults to `0` for no filtering.
   * @platform ios harmony
   * HarmonyOS: implemented with circular difference handling around the 0/360 boundary.
   */
  headingFilter?: number | void;
  /**
   * The device orientation to use when computing heading values. Defaults to `portrait`.
   * @platform ios
   * Not supported on HarmonyOS; silently ignored.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620556-headingorientation)
   */
  headingOrientation?: HeadingOrientation | void;
  /**
   * A Boolean value indicating whether the location manager object may pause location updates. Defaults to `true`.
   * @platform ios
   * Not supported on HarmonyOS; silently ignored.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620553-pauseslocationupdatesautomatical)
   */
  pausesLocationUpdatesAutomatically?: boolean | void;
  /**
   * A Boolean indicating whether the status bar changes its appearance when location services are used in the background. Defaults to `false`. Only works on iOS 11+ and is ignored for earlier versions of iOS.
   * @platform ios
   * Not supported on HarmonyOS; silently ignored.
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/2923541-showsbackgroundlocationindicator)
   */
  showsBackgroundLocationIndicator?: boolean | void; // iOS 11+
}

/**
 * The options for `getLatestLocation`.
 */
export interface GetLatestLocationOptions {
  /**
   * The amount of time in milliseconds which the `getLatestLocation` method should wait before giving up and returning `null`. To turn off the timeout behaviour, give this option a `null` value. If not specified it will default to 10000ms (10 seconds).
   * @platform ios android harmony
   */
  timeout?: number | null;
}

/**
 * The options for `requestPermission` / `checkPermission`.
 *
 * HarmonyOS mapping (no two-stage iOS dialog, differs from Android per-item requests):
 * - `ios: "whenInUse"` and `android: { detail: "fine" | "coarse" }` both map to
 *   the foreground combination request (`ohos.permission.LOCATION` +
 *   `ohos.permission.APPROXIMATELY_LOCATION`)
 * - `ios: "always"` maps to the foreground combination plus
 *   `ohos.permission.LOCATION_IN_BACKGROUND` (requested in a separate second
 *   step, since HarmonyOS forbids merging background location into the same request)
 * - for `checkPermission`, `detail: "fine"` requires `authorizedFine` while
 *   `detail: "coarse"` accepts `authorizedFine` or `authorizedCoarse`;
 *   `rationale` is passed through but ignored on HarmonyOS
 */
export interface RequestPermissionOptions {
  /**
   * The iOS (and HarmonyOS) permission tier: `"whenInUse"` for the foreground
   * combination, `"always"` for foreground plus background location.
   * @platform ios harmony
   */
  ios?: "whenInUse" | "always" | void;
  /**
   * The Android permission tier with an optional rationale dialog. On HarmonyOS
   * only `detail` participates in tier checks; `rationale` is ignored.
   * @platform android harmony
   */
  android?: {
    detail: "coarse" | "fine";
    rationale?: {
      title: string;
      message: string;
      buttonPositive: string;
      buttonNegative: string;
    } | void;
  } | void;
}

/**
 * A function which unsubscribes the associated listener and releases the
 * underlying native resources (location updates, heading sensor or
 * significant-location monitoring) once the last subscription is removed.
 */
export type Subscription = () => void;

/**
 * The native module interface used by the JS layer.
 *
 * On HarmonyOS (and the new architecture) this is the codegen TurboModule
 * resolved via `TurboModuleRegistry.get('RNLocation')`; on the legacy
 * architecture it falls back to `NativeModules.RNLocation`.
 */
export type RNLocationNativeInterface = any;
