import {
  ConfigureOptions,
  RequestPermissionOptions,
  LocationPermissionStatus,
  Subscription,
  Location,
  Heading
} from "./types";
import NativeInterface from "./lib/nativeInterface";
import Subscriptions from "./lib/subscriptions";
import Permissions from "./lib/permissions";

const {
  /**
   * @ignore
   */
  nativeInterface,
  /**
   * @ignore
   */
  eventEmitter
} = NativeInterface.get();

/**
 * The subscription helper. Only for internal use.
 * @ignore
 */
const subscriptions = new Subscriptions(nativeInterface, eventEmitter);
/**
 * The permissions helper. Only for internal use.
 * @ignore
 */
const permissions = new Permissions(nativeInterface, eventEmitter);

/**
 * This is used to configure the location provider. You can use this to enable background mode, filter location updates to a certain distance change, and ensure you have the power settings set correctly for your use case.
 *
 * You can call `configure` multiple times at it will only change the setting which you pass to it. For example, if you only want to change `activityType`, you can call `configure` with just that property present.
 *
 * @param {ConfigureOptions} options The configuration options.
 * @returns {void}
 */
export const configure = (options: ConfigureOptions): void => {
  nativeInterface.configure(options);
};

/**
 * Correctly managing permissions is key to working with the users location in mobile apps.
 *
 * * Ask for the lowest level of permissions you can. You'll almost always only need `whenInUse` (foreground) permission rather than background.
 * * On iOS you only get one chance to ask for permission. If the user requests it the first time this method will always resolves to `false`.
 * * If you ask for `always` permission then the user gets the chance to accept, but only give you `whenInUse` permission. The Promise will still resolve to `false`, however, if you call `RNLocation.getCurrentPermission` you can check if they actually accepted the lesser permission.
 * * You should monitor the permissions and respond to it correctly. The user is able to go to their phone setting and revoke or downgrade permissions at any time.
 *
 * This method should be called before subscribing to location updates. You need to pass in the type of permission you want for each platform. You can choose not to ignore a platform and it will be ignored. The method returns a promise which resolves to `true` if the permission was granted and `false` if not.
 *
 * @param {RequestPermissionOptions} options The permissions which you are requesting.
 * @returns {Promise<boolean>} A Promise which resolves to `true` if the permission was accepted.
 */
export const requestPermission = (
  options: RequestPermissionOptions
): Promise<boolean> => {
  return permissions.requestPermission(options);
};

/**
 * Gets the current permission status.
 *
 * @returns {Promise<LocationPermissionStatus>} The current permission status.
 */
export const getCurrentPermission = (): Promise<LocationPermissionStatus> => {
  return permissions.getCurrentPermission();
};

/**
 * Monitor the permission status for changes.
 *
 * @param {LocationPermissionStatusCallback} listener The listener which will be called when the permission status changes.
 * @returns {Subscription} The subscription function which can be used to unsubscribe.
 */
export const subscribeToPermissionUpdates = (
  listener: (status: LocationPermissionStatus) => void
): Subscription => {
  return permissions.subscribeToPermissionUpdates(listener);
};

/**
 * Subscribe to location changes with the given listener. Ensure you have the correct permission before calling this method. The location provider will respect the settings you have given it.
 *
 * @param  {LocationCallback} listener The listener which will be called when the user location changes.
 * @returns {Subscription} The subscription function which can be used to unsubscribe.
 */
export const subscribeToLocationUpdates = (
  listener: (location: Location) => void
): Subscription => {
  return subscriptions.subscribeToLocationUpdates(listener);
};

/**
 * Subscribe to heading changes with the given listener. Ensure you have the correct permission before calling this method. The location provider will respect the settings you have given it.
 *
 * @param  {LocationCallback} listener The listener which will be called when the heading changes.
 * @returns {Subscription} The subscription function which can be used to unsubscribe.
 */
export const subscribeToHeadingUpdates = (
  listener: (heading: Heading) => void
): Subscription => {
  return subscriptions.subscribeToHeadingUpdates(listener);
};

/**
 * Subscribe to significant updates to the users location with the given listener.
 *
 * **This method does not take into account the {@link distanceFilter} which you configured RNLocation with**.
 *
 * In most cases, you should call {@link configure} with the correct settings and then use {@link subscribeToLocationUpdates} to subscribe to the location updates. For more details, take a look at [Apple's documentation](https://developer.apple.com/documentation/corelocation/cllocationmanager/1423531-startmonitoringsignificantlocati?language=objc).
 *
 * @param  {LocationCallback} listener The listener which will be called when the user location significantly changes.
 * @returns {Subscription} The subscription function which can be used to unsubscribe.
 */
export const subscribeToSignificantLocationUpdates = (
  listener: (location: Location) => void
): Subscription => {
  return subscriptions.subscribeToSignificantLocationUpdates(listener);
};

export default {
  configure,
  requestPermission,
  getCurrentPermission,
  subscribeToPermissionUpdates,
  subscribeToLocationUpdates,
  subscribeToHeadingUpdates,
  subscribeToSignificantLocationUpdates
};

/**
 * @callback LocationPermissionStatusCallback
 * @param {LocationPermissionStatus} status The new permission status.
 */
/**
 * @callback LocationCallback
 * @param {Location} location The new user location.
 */
