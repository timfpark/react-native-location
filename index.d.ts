declare module "react-native-location" {
  import { NativeEventEmitter } from 'react-native';

  export type AuthorizationStatus =
    | "authorizedAlways"
    | "authorizedWhenInUse"
    | "denied"
    | "notDetermined"
    | "restricted"
  
  type AuthorizationStatusCallback = (authorizationStatus: AuthorizationStatus) => void

  export default interface RNLocation extends NativeEventEmitter {
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
  }
}
