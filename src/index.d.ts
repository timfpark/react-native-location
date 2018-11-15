declare module "react-native-location" {
  import { NativeEventEmitter, EmitterSubscription } from "react-native"

  export type AuthorizationStatus =
    | "authorizedAlways"
    | "authorizedWhenInUse"
    | "denied"
    | "notDetermined"
    | "restricted"
  type AuthorizationStatusCallback = (authorizationStatus: AuthorizationStatus) => void

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
  type LocationCallback = (location: Location) => void

  export interface Heading {
    heading: number,
  }
  type HeadingCallback = (heading: Heading) => void
  
  export type RNLocationEvent =
    | "authorizationStatusDidChange"
    | "locationUpdated"
    | "headingUpdated"
  

  interface RNLocationEventEmitter extends NativeEventEmitter {
    addListener(event: "authorizationStatusDidChange", listener: AuthorizationStatusCallback): EmitterSubscription
    addListener(event: "locationUpdated", listener: LocationCallback): EmitterSubscription
    addListener(event: "headingUpdated", listener: HeadingCallback): EmitterSubscription
  }

  export default interface RNLocation {
    // Native methods
    requestAlwaysAuthorization(): void,
    requestWhenInUseAuthorization(): void,
    getAuthorizationStatus(callback: AuthorizationStatusCallback): void,
    setDesiredAccuracy(accuracy: number): void,
    setDistanceFilter(distance: number): void,
    setAllowsBackgroundLocationUpdates(allowed: boolean): void,
    startMonitoringSignificantLocationChanges(): void,
    stopMonitoringSignificantLocationChanges(): void,
    startUpdatingLocation(): void,
    stopUpdatingLocation(): void,
    startUpdatingHeading(): void,
    stopUpdatingHeading(): void,
    // Events
    RNLocationEventEmitter: RNLocationEventEmitter,
  }
}
