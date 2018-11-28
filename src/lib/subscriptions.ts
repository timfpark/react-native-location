import { EventEmitter } from "react-native";
import {
  Location,
  Subscription,
  Heading,
  RNLocationNativeInterface
} from "../types";

let locationListenerCount = 0;
let headingListenerCount = 0;
let significantLocationListenerCount = 0;

export const subscribeToLocationUpdates = (
  nativeInterface: RNLocationNativeInterface,
  eventEmitter: EventEmitter,
  listener: (location: Location) => void
): Subscription => {
  const emitterSubscription = eventEmitter.addListener(
    "locationUpdated",
    listener
  );
  nativeInterface.startUpdatingLocation();
  locationListenerCount += 1;

  return () => {
    emitterSubscription.remove();
    locationListenerCount -= 1;

    if (locationListenerCount === 0) {
      nativeInterface.stopUpdatingLocation();
    }
  };
};

export const subscribeToHeadingUpdates = (
  nativeInterface: RNLocationNativeInterface,
  eventEmitter: EventEmitter,
  listener: (heading: Heading) => void
): Subscription => {
  const emitterSubscription = eventEmitter.addListener(
    "headingUpdated",
    listener
  );
  nativeInterface.startUpdatingHeading();
  headingListenerCount += 1;

  return () => {
    emitterSubscription.remove();
    headingListenerCount -= 1;

    if (headingListenerCount === 0) {
      nativeInterface.stopUpdatingHeading();
    }
  };
};

export const subscribeToSignificantLocationUpdates = (
  nativeInterface: RNLocationNativeInterface,
  eventEmitter: EventEmitter,
  listener: (location: Location) => void
): Subscription => {
  const emitterSubscription = eventEmitter.addListener(
    "locationUpdated",
    listener
  );
  nativeInterface.startMonitoringSignificantLocationChanges();
  significantLocationListenerCount += 1;

  return () => {
    emitterSubscription.remove();
    significantLocationListenerCount -= 1;

    if (significantLocationListenerCount === 0) {
      nativeInterface.stopMonitoringSignificantLocationChanges();
    }
  };
};

export default {
  subscribeToLocationUpdates,
  subscribeToHeadingUpdates,
  subscribeToSignificantLocationUpdates
};
