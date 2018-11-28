export interface ConfigureOptions {
  distanceFilter?: number | void;
  // iOS
  activityType?:
    | "other"
    | "automotiveNavigation"
    | "fitness"
    | "otherNavigation"
    | "airborne" // iOS 12+
    | void;
  allowsBackgroundLocationUpdates?: boolean | void;
  desiredAccuracy?:
    | "bestForNavigation"
    | "best"
    | "nearestTenMeters"
    | "hundredMeters"
    | "threeKilometers"
    | void;
  headingFilter?: number | void;
  headingOrientation?:
    | "portrait"
    | "portraitUpsideDown"
    | "landscapeLeft"
    | "landscapeRight"
    | void;
  pausesLocationUpdatesAutomatically?: boolean | void;
  showsBackgroundLocationIndicator?: boolean | void; // iOS 11+
}

export default (nativeInterface: any) => {
  return {
    configure: (options: ConfigureOptions) => {
      nativeInterface.configure(options);
    }
  };
};
