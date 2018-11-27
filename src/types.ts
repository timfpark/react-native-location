export type LocationPermissionStatus =
  | "authorizedAlways"
  | "authorizedWhenInUse"
  | "denied"
  | "restricted"
  | "notDetermined"

export interface Location {
  coords: LocationCoords,
  timestamp: number,
}

export interface LocationCoords {
  latitude: number,
  longitude: number,
  altitude: number,
  accuracy: number,
  altitudeAccuracy: number,
  course: number,
  speed: number,
  floor: number,
}

export interface Heading {
  heading: number,
}

export type Subscription = () => void;
