import { EventEmitter } from "react-native";

export interface ConfigureOptions {
  distanceFilter?: number | void,
  // iOS
  activityType?:
    | "other"
    | "automotiveNavigation"
    | "fitness"
    | "otherNavigation"
    | "airborne"
    | void,
  allowsBackgroundLocationUpdates?: boolean | void,
  desiredAccuracy?:
    | "bestForNavigation"
    | "best"
    | "nearestTenMeters"
    | "hundredMeters"
    | "threeKilometers"
    | void,
  pausesLocationUpdatesAutomatically?: boolean | void,
  showsBackgroundLocationIndicator?: boolean | void,
}

export default (nativeInterface: any) => {
  return {
    configure: (options: ConfigureOptions) => {
      nativeInterface.configure(options)
    }
  }
}