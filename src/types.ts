export type LocationPermissionStatus =
  | "authorizedAlways"
  | "authorizedWhenInUse"
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
export type AndroidProvider = "auto" | "fused" | "builtin";
/**
 * The accuracy of the location responses for Android.
 * @platform android
 * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationaccuracy?language=objc)
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

export interface Location {
  /**
   * The time that the device was at this location.
   * @platform android ios
   */
  timestamp: Date;
  /**
   * The latitude of the location.
   * @platform android ios
   */
  latitude: number;
  /**
   * The longitude of the location.
   * @platform android ios
   */
  longitude: number;
  /**
   * The radius of uncertainty for the location, measured in meters.
   * @platform android ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423599-horizontalaccuracy?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getAccuracy())
   */
  accuracy: number;
  /**
   * The altitude of the location in meters.
   * @platform android ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423820-altitude?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getAltitude())
   */
  altitude: number;
  /**
   * The accuracy of the altitude value, measured in meters.
   * @platform android ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423550-verticalaccuracy?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getVerticalAccuracyMeters())
   */
  altitudeAccuracy: number;
  /**
   * The direction in which the device is traveling, measured in degrees and relative to due north.
   * @platform android ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423832-course?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getBearing())
   */
  course: number;
  /**
   * Get the estimated course accuracy of this location, in degrees.
   * @platform android
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getBearingAccuracyDegrees())
   */
  courseAccuracy?: number;
  /**
   * The instantaneous speed of the device, measured in meters per second.
   * @platform android ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1423798-speed?language=objc)
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getSpeed())
   */
  speed: number;
  /**
   * Get the estimated speed accuracy of this location, in meters per second.
   * @platform android
   * @see [Android Docs](https://developer.android.com/reference/android/location/Location.html#getSpeedAccuracyMetersPerSecond())
   */
  speedAccuracy?: number;
  /**
   * The logical floor of the building in which the user is located.
   * @platform ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocation/1616762-floor?language=objc)
   */
  floor?: number;
}
export interface Heading {
  heading: number;
}

export interface ConfigureOptions {
  /**
   * The minimum distance in meters that the device location needs to change before the location update callback in your app is called. Defaults to `0` for no filtering.
   * @platform android ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1423500-distancefilter)
   * @see [Android Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#setSmallestDisplacement(float))
   */
  distanceFilter?: number | void;
  /**
   * The type of user activity associated with the location updates. Defaults to `other`.
   * @platform ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620567-activitytype)
   */
  activityType?: LocationActivityType | void;

  /**
   * The provider which is used on Android to get the location. Your app must include the Google Play services dependencies to use the `playServices` location provider. By default it will choose the `playServices` location provider if it detects that the dependencies are installed, otherwise, it will use the `standard` Android version which does not require Google Play Services to be installed. Note that `auto` only checks that the dependencies are installed, not that the user has the Google Play services APK installed and set up correctly.
   * @platform android
   */
  androidProvider?: AndroidProvider | void;
  /**
   * A Boolean value indicating whether the app should receive location updates when suspended. Requires permissions to always access the users location. Defaults to `false`.
   * @platform ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620568-allowsbackgroundlocationupdates)
   */
  allowsBackgroundLocationUpdates?: boolean | void;
  /**
   * The accuracy of the location data. Defaults to `best` on iOS and `balancedPowerAccuracy` on Android.
   * @platform android ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1423836-desiredaccuracy)
   * @see [Android Docs](https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#setPriority(int))
   */
  desiredAccuracy?: {
    ios?: LocationAccuracyIOS | void;
    android?: LocationPriorityAndroid | void;
  } | void;
  /**
   * The minimum angle in degrees that the device heading needs to change before the heading update callback in your app is called. Defaults to `0` for no filtering.
   * @platform ios
   */
  headingFilter?: number | void;
  /**
   * The device orientation to use when computing heading values. Defaults to `portrait`.
   * @platform ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620556-headingorientation)
   */
  headingOrientation?: HeadingOrientation | void;
  /**
   * A Boolean value indicating whether the location manager object may pause location updates. Defaults to `true`.
   * @platform ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620553-pauseslocationupdatesautomatical)
   */
  pausesLocationUpdatesAutomatically?: boolean | void;
  /**
   * A Boolean indicating whether the status bar changes its appearance when location services are used in the background. Defaults to `false`. Only works on iOS 11+ and is ignored for earlier versions of iOS.
   * @platform ios
   * @see [Apple Docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/2923541-showsbackgroundlocationindicator)
   */
  showsBackgroundLocationIndicator?: boolean | void; // iOS 11+
}

export interface RequestPermissionOptions {
  ios?: "whenInUse" | "always" | void;
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

export type Subscription = () => void;

export type RNLocationNativeInterface = any;
