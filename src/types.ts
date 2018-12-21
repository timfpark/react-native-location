export type DistanceMeters = number;
export type HeadingDegrees = number;

export type LocationPermissionStatus =
  | "authorizedAlways"
  | "authorizedWhenInUse"
  | "denied"
  | "restricted"
  | "notDetermined";
export type LocationActivityType =
  | "other"
  | "automotiveNavigation"
  | "fitness"
  | "otherNavigation"
  | "airborne"; // iOS 12+
export type LocationAccuracy =
  | "bestForNavigation"
  | "best"
  | "nearestTenMeters"
  | "hundredMeters"
  | "threeKilometers";
export type HeadingOrientation =
  | "portrait"
  | "portraitUpsideDown"
  | "landscapeLeft"
  | "landscapeRight";
export type Location = LocationShared & LocationAndroid & LocationIOS;
export interface LocationShared {
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  altitudeAccuracy: number;
  course: number;
  speed: number;
}
export interface LocationAndroid {
  courseAccuracy?: number;
  speedAccuracy?: number;
}
export interface LocationIOS {
  floor?: number;
}
export interface Heading {
  heading: number;
}

export interface ConfigureOptions {
  distanceFilter?: DistanceMeters | void;
  // iOS only
  activityType?: LocationActivityType | void;
  allowsBackgroundLocationUpdates?: boolean | void;
  desiredAccuracy?: LocationAccuracy | void;
  headingFilter?: HeadingDegrees | void;
  headingOrientation?: HeadingOrientation | void;
  pausesLocationUpdatesAutomatically?: boolean | void;
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
