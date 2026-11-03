# Changelog

## [1.0.0-beta.1] - 2026-09-12

The first OpenHarmony / HarmonyOS adaptation release, based on the upstream community version [react-native-location 2.5.0](https://github.com/timfpark/react-native-location) (master branch).

### Added

- HarmonyOS adaptation package `@react-native-ohos/react-native-location`, supporting RN 0.72.*, compiled against API 12+, with AutoLink support.
- New-architecture TurboModule implementation (codegen):
  - Added the TurboModule spec `src/specs/v1/NativeRNLocation.ts` (12 native methods; the module name remains `RNLocation`);
  - Added the HarmonyOS ArkTS native implementation `harmony/location/` (`RNLocationTurboModule` / `LocationPackage`), released as a har package and integrated via autolinking.
- Location capability (`@kit.LocationKit` geoLocationManager):
  - Continuous location updates via `on/off('locationChange')`; the `locationUpdated` event payload is `Location[]` (consistent with the upstream library);
  - The last known location is reported immediately via `getLastLocation()` when a subscription starts (aligned with the Android `getLastKnownLocation` behavior).
- Heading capability (`@kit.SensorServiceKit` orientation sensor `ORIENTATION`): the alpha angle (0-360, around the Z axis) approximates CLHeading; the `headingFilter` threshold handles the 0/360 circular boundary.
- Permission capability (`@kit.AbilityKit` abilityAccessCtrl):
  - Permission mapping: `whenInUse` / android `fine|coarse` → foreground combination (`ohos.permission.LOCATION` + `ohos.permission.APPROXIMATELY_LOCATION`); `always` → foreground combination + `ohos.permission.LOCATION_IN_BACKGROUND`;
  - The background location permission is requested in a two-step serial flow per HarmonyOS restrictions (it cannot be merged into the same request as the foreground permissions);
  - Permission status mapping: `authorizedAlways` / `authorizedFine` / `authorizedCoarse` / `denied` / `restricted`.
- Event channel: on harmony, events are sent via `rnInstance.emitDeviceEvent` and received on the JS side through `DeviceEventEmitter`; `onWarning` error codes follow the Android semantics (401 invalid argument / 403 no permission (mapped from HarmonyOS 201) / 500 location service error (including master switch off 3301100) / 502 heading sensor unavailable).
- HarmonyOS example project `example/` (demo covering all 9 public APIs) and real-device test document `example/TESTING.md` (26 cases).
- JS-layer white-box unit test project `jtest/` (5 suites / 74 cases, 100% statement/branch/function/line coverage).
- Bilingual README (installation, linking, constraints, API reference, directory structure, etc.) and delivery documents (API documentation, design specification, self-test report).

### Changed

- Running subscriptions are automatically restarted with the new settings after `configure` changes (aligned with Android behavior); `interval` / `fastestInterval` / `maxWaitTime` (milliseconds) take the smallest positive value and are converted to the HarmonyOS `timeInterval` (seconds).

### Known Platform Differences

- Heading is approximated with the orientation sensor alpha angle; there is no `trueHeading` / `magneticHeading` distinction;
- The significant location change subscription is approximated with an independent low-power (`LOW_POWER`) + 1000m distance-interval location request; the granularity differs from iOS;
- iOS-only configure options (`activityType` / `headingOrientation` / `allowsBackgroundLocationUpdates` / `pausesLocationUpdatesAutomatically` / `showsBackgroundLocationIndicator` / `desiredAccuracy.ios`) and `androidProvider` are silently ignored on HarmonyOS;
- `Location.floor` / `Location.fromMockProvider` are not produced in the HarmonyOS payload;
- The HarmonyOS native default `distanceFilter` is 100m (aligned with the Android standard provider; the upstream iOS default is 0);
- The `AndroidProvider` type values differ in naming from the official npm 2.5.0 package (see "Legacy Issues" in the README).

[1.0.0-beta.1]: https://github.com/cbd1020819393/react-native-location/releases/tag/v1.0.0-beta.1
