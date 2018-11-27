export type AuthorizationStatus =
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

export type AuthorizationStatusCallback = (authorizationStatus: AuthorizationStatus) => void
export type LocationCallback = (location: Location) => void
export type HeadingCallback = (heading: Heading) => void
