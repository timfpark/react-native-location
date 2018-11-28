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

export interface Location {
  coords: LocationCoords;
  timestamp: number;
}
export interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  altitudeAccuracy: number;
  course: number;
  speed: number;
  floor: number;
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
  android?: "course" | "fine" | void;
}

export type Subscription = () => void;

export type RNLocationNativeInterface = any;
