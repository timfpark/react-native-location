> Template version: v0.4.2

<p align="center">
<h1 align="center"> <code>react-native-location</code> </h1>
 </p>

This project is based on [react-native-location](https://github.com/timfpark/react-native-location) and is adapted for React Native on OpenHarmony/HarmonyOS.

The adapted third-party library supports direct download from npm under the new package name: `@react-native-ohos/react-native-location`. The version mapping is as follows:

| Name | Version(Npm Address) | Release Information | Supported RN Version | Supported Autolink | Compile API Version | Community Baseline Version | Source code address |
| --------------| -------------- | ------------------------------ | ------------- | ------------- |------------------------ | ------------- | ------------- |
| @react-native-ohos/react-native-location | [~1.0.0(In development)](https://www.npmjs.com/package/@react-native-ohos/react-native-location) | See release notes | 0.72.*/ 0.77.*/ 0.82.*/ 0.84.*/ | Yes | API12+ | 2.5.0 | [master](https://github.com/timfpark/react-native-location) |

## Introduction

react-native-location provides native GPS location capabilities for React Native apps. It wraps iOS `CLLocationManager` and Android `FusedLocationProvider`/standard location services, and offers cross-platform permission management APIs.

The HarmonyOS adaptation is implemented on top of the following system capabilities, with the API surface aligned to the original library 2.5.0 (implemented as a TurboModule via RNOH codegen):

- Location: `geoLocationManager` from `@kit.LocationKit` (continuous location via `on/off('locationChange')`, last known location via `getLastLocation`)
- Heading: orientation sensor (`SensorId.ORIENTATION`) from `@kit.SensorServiceKit`
- Permissions: `abilityAccessCtrl` from `@kit.AbilityKit` (dynamic requests and status queries)

## Installation and Usage

Go to the project directory and execute the following instruction:

#### **npm**

```bash
npm install @react-native-ohos/react-native-location
```

#### **yarn**

```bash
yarn add @react-native-ohos/react-native-location
```

## Link

|  | Supported Autolink | Supported RN Version |
|--------------------------------------|-----------------|------------|
| ~1.0.0(In development) | Yes | 0.72/0.77/0.82/0.84 |

Projects using AutoLink need to be configured according to the Autolink framework guide: https://gitcode.com/CPF-RN/ohos_react_native/blob/master/docs/zh-cn/Autolinking.md

If the version you use supports Autolink and your project is already integrated with Autolink, you can skip the ManualLink configuration.

<details>
  <summary>ManualLink: Guidance for manually configuring native dependencies</summary>

First, open the HarmonyOS project `harmony` in the project directory with DevEco Studio.

### 1. Overrides RN SDK

To ensure the project depends on the same version of the RN SDK, add an `overrides` field to the `oh-package.json5` file in the project root directory, pointing to the RN SDK version the project needs to use. The replacement version can be a specific version number, a fuzzy version, a local HAR package, or a source code directory.

For details about this field, refer to the [official documentation](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-oh-package-json5-V5#zh-cn_topic_0000001792256137_overrides)

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony": "file:../node_modules/@react-native-oh/react-native-harmony/react_native_openharmony_release.har"
  }
}
```

### 2. Introducing Native Code

> [!TIP] The HAR package is located in the `harmony` folder of the third-party library installation path.

Open `entry/oh-package.json5` and add the following dependency:

```json
"dependencies": {
    "@react-native-ohos/react-native-location": "file:../../node_modules/@react-native-ohos/react-native-location/harmony/location.har"
  }
```

Click the `sync` button in the upper right corner,

or execute the following in the terminal:

```bash
cd entry
ohpm install
```

### 3. Configuring CMakeLists

Open `entry/src/main/cpp/CMakeLists.txt` and add:

```cmake
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-location/src/main/cpp" ./location)

target_link_libraries(rnoh_app PUBLIC location)
```

### 4. Register the Package (C++ side)

Open `entry/src/main/cpp/PackageProvider.cpp` and add:

```cpp
#include "LocationPackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<LocationPackage>(ctx),
    };
}
```

### 5. Register the Package (ETS side)

Open `entry/src/main/ets/RNPackagesFactory.ets` and add:

```typescript
import { LocationPackage } from '@react-native-ohos/react-native-location/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new LocationPackage(ctx),
  ];
}
```

</details>

### Permission Configuration (Required)

Declare the location permissions in the `module` section of `entry/src/main/module.json5` of the host project (user_grant; requested at runtime via `requestPermission`):

```json
"requestPermissions": [
  { "name": "ohos.permission.LOCATION", "reason": "$string:location_reason", "usedScene": { "abilities": ["EntryAbility"], "when": "inuse" } },
  { "name": "ohos.permission.APPROXIMATELY_LOCATION", "reason": "$string:location_reason", "usedScene": { "abilities": ["EntryAbility"], "when": "inuse" } },
  { "name": "ohos.permission.LOCATION_IN_BACKGROUND", "reason": "$string:location_reason", "usedScene": { "abilities": ["EntryAbility"], "when": "always" } }
]
```

> [!TIP] Foreground location requires both `LOCATION` and `APPROXIMATELY_LOCATION`; `LOCATION_IN_BACKGROUND` is only needed for background location scenarios. Also add the `location_reason` string to `string.json`.

### Running

Click the `sync` button in the upper right corner,

or execute the following in the terminal:

```bash
cd entry
ohpm install
```

Then build and run.

## Constraints

### Compatibility

The content of this document has been verified with the following versions:
1. RNOH: 0.72.139; SDK: HarmonyOS 5.0.1 Release SDK (API13, targetSdk 6.0.1(21)); IDE: DevEco Studio 6.0.1 Release; ROM: 6.0.0;
2. RNOH: 0.77.18; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
3. RNOH: 0.82.7; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112 SP12;
4. RNOH: 0.84.1; SDK: HarmonyOS 6.0.2 Release SDK; IDE: 6.0.2 Release; ROM:7.0.0.100 SP9;

### Usage Restrictions

- The system "Location" master switch must be enabled on real devices. When the switch is off, location requests report error 3301100, which is mapped to `onWarning` (type 500)
- `onWarning` is an internally subscribed warning channel (surfaced via `console.warn`; applications do not need to listen to it). Type values: 401 invalid argument / 403 no permission / 500 location service error (including the system location master switch being off) / 502 heading sensor unavailable
- On HarmonyOS, the minimum time interval is 1s for GNSS and 20s for network positioning. If `interval` is below the minimum, the system minimum takes effect; `fastestInterval`/`maxWaitTime` are Android scheduling semantics with no HarmonyOS equivalent and are silently ignored
- **Background permission request order** (HarmonyOS restriction): `LOCATION_IN_BACKGROUND` cannot be combined with foreground location permissions in a single request — the adaptation requests them in two sequential steps: first the foreground set (LOCATION + APPROXIMATELY_LOCATION), then the background permission separately after the foreground grant succeeds. The runtime dialog only offers "Allow this time / Allow while in use / Don't allow" — **"Always allow" can only be enabled manually by the user in system Settings** (the only path to grant background location)
- **Verifying whether background location is granted**: `getCurrentPermission()` returning `authorizedAlways` means background is granted; alternatively use `hdc shell atm dump -t -b <bundleName>` and check the `grantStatus` of `LOCATION_IN_BACKGROUND` (0=granted, -1=not granted)
- **Background location also requires a continuous task**: holding the background location permission alone does not guarantee background execution — the app process may be suspended when backgrounded. Apps needing background location should request a continuous task (`continuousTask`, location/navigation type) themselves; a persistent notification is shown once requested

## Example
The following code demonstrates the basic usage of this library:

> [!WARNING] Keep the original library name when importing (use `react-native-location`; it is automatically mapped to the HarmonyOS adapted package via the RNOH alias).

#### Basic usage (configure → permission → continuous subscription)

```tsx
import React from 'react';
import { Button, View } from 'react-native';
import RNLocation, { Location } from 'react-native-location';

export function locationTest() {
  let unsub: (() => void) | null = null;

  async function start() {
    // 1. Configure location options (callable multiple times; only provided options are changed)
    await RNLocation.configure({
      distanceFilter: 5,                                // meters
      interval: 10000,                                  // milliseconds
      desiredAccuracy: { android: 'highAccuracy' },     // mapped to accuracy-first priority on HarmonyOS
    });

    // 2. Request permission (whenInUse = foreground permission set; always also requests background location)
    const granted = await RNLocation.requestPermission({
      ios: 'whenInUse',
      android: { detail: 'fine' },
    });

    // 3. Subscribe to location updates (payload is a Location[] array; take the latest entry)
    if (granted) {
      unsub = RNLocation.subscribeToLocationUpdates((locations: Location[]) => {
        const latest = locations[0];
        console.log(latest.latitude, latest.longitude, latest.accuracy);
      });
    }
  }

  function stop() {
    unsub?.(); // Unsubscribe and release native location resources
  }

  return (
    <View>
      <Button title="start location" onPress={start} />
      <Button title="stop location" onPress={stop} />
    </View>
  );
}
```

#### Get the latest location once

```js
import RNLocation from 'react-native-location';

// Resolves to null if no location is obtained within the timeout (default 10s)
const location = await RNLocation.getLatestLocation({ timeout: 15000 });
if (location) {
  console.log(location.timestamp, location.latitude, location.longitude);
}
```

#### Permission status query and subscription

```js
import RNLocation from 'react-native-location';

const status = await RNLocation.getCurrentPermission();          // e.g. 'authorizedFine'
const ok = await RNLocation.checkPermission({ ios: 'always' }); // Check permission tier

const unsubscribe = RNLocation.subscribeToPermissionUpdates((status) => {
  console.log('permission changed:', status); // fired when the permission status changes
});
// unsubscribe() to cancel
```

#### Heading and significant location changes

```js
import RNLocation from 'react-native-location';

// Heading: orientation sensor alpha angle (0-360, around the Z axis); headingFilter is the angle threshold
await RNLocation.configure({ headingFilter: 10 });
const unsubHeading = RNLocation.subscribeToHeadingUpdates((h) => {
  console.log('heading:', h.heading);
});

// Significant location changes: approximated on HarmonyOS with a low-power network-positioning
// request using a 1000m distance interval
const unsubSig = RNLocation.subscribeToSignificantLocationUpdates((locations) => {
  console.log('significant:', locations[0]);
});
```

## Available APIs

> [!TIP] The "Platform" column indicates the platforms supported by the original third-party library.

> [!TIP] In the "HarmonyOS Support" column, "Yes" means the property is supported on HarmonyOS; "No" means unsupported (silently ignored or not emitted); "Partially" means partially supported. The usage is consistent across platforms, with behavior benchmarked against iOS or Android.

> [!TIP] Items marked "No" / "Partially" in the "HarmonyOS Support" column are explained in detail in the "Known Issues" section below.

### API
| Name | Type | Parameter Type | Return Value | Required | Platform | HarmonyOS Support | Description |
|--------|---------|-----|-------|-------|--------|-----|-----------------|
| configure | function | options: ConfigureOptions | Promise\<void\> | Yes | iOS/Android | Yes | Configures location options; callable multiple times and only provided options are changed. Running subscriptions restart with the new options |
| requestPermission | function | options: RequestPermissionOptions | Promise\<boolean\> | Yes | iOS/Android | Partially | Requests location permission. On HarmonyOS the foreground tier is a combined request for LOCATION + APPROXIMATELY_LOCATION; the `always` tier additionally covers background location, which can only be enabled manually by the user in system Settings — returning `false` when it is not enabled is expected (see "Usage Restrictions") |
| checkPermission | function | options: RequestPermissionOptions | Promise\<boolean\> | No | iOS/Android | Yes | Checks whether the current permission satisfies the given tier (fine/coarse/whenInUse/always) |
| getCurrentPermission | function | / | Promise\<LocationPermissionStatus\> | No | iOS/Android | Partially | Returns the current permission status. On HarmonyOS "never requested" and "denied by user" cannot be distinguished; unauthorized always returns `denied` |
| subscribeToPermissionUpdates | function | listener: (status: LocationPermissionStatus) => void | Subscription | No | iOS | Partially | Subscribes to permission status changes (on HarmonyOS, triggered after each permission query/request) |
| subscribeToLocationUpdates | function | listener: (locations: Location[]) => void | Subscription | Yes | iOS/Android | Yes | Subscribes to continuous location updates. The last known location is emitted once immediately upon subscribing |
| getLatestLocation | function | options?: GetLatestLocationOptions | Promise\<Location \| null\> | No | iOS/Android | Yes | Gets the latest location once; resolves to `null` on timeout (default 10s; `timeout: null` means no timeout) |
| subscribeToHeadingUpdates | function | listener: (heading: Heading) => void | Subscription | No | iOS | Partially | Subscribes to heading updates. On HarmonyOS the value is the orientation sensor heading angle (0-360°); no trueHeading/magneticHeading variants |
| subscribeToSignificantLocationUpdates | function | listener: (locations: Location[]) => void | Subscription | No | iOS | Partially | Subscribes to significant location changes. Approximated on HarmonyOS with a low-power implementation; coarser granularity than iOS, unaffected by the configured distanceFilter |

> The return value `Subscription` is an unsubscribe function `() => void`; calling it removes the subscription and releases native resources.

---

### ConfigureOptions
| Name | Type | Default | Required | Platform | HarmonyOS Support | Description |
|---|---|---|---|---|---|---|
| distanceFilter | number \| void | 100 | No | iOS, Android | Yes | Minimum distance change (meters) before a location callback fires. Mapped to HarmonyOS `distanceInterval` |
| interval | number \| void | / | No | Android | Yes | Desired active update interval (ms). Mapped to HarmonyOS `timeInterval` (seconds); clamped to the system minimum (GNSS 1s / network positioning 20s) when lower |
| fastestInterval | number \| void | / | No | Android | No | Fastest update interval (ms, Android "rate-limit" semantics). HarmonyOS `timeInterval` is a single slot with no equivalent scheduling mechanism; silently ignored (only interval applies) |
| maxWaitTime | number \| void | / | No | Android | No | Maximum batching wait time (ms, Android "delay" semantics). No batching mechanism on HarmonyOS; silently ignored (only interval applies) |
| desiredAccuracy.ios | LocationAccuracyIOS \| void | / | No | iOS | No | iOS accuracy tier; no HarmonyOS equivalent, silently ignored |
| desiredAccuracy.android | LocationPriorityAndroid \| void | / | No | Android | Partially | Android power priority. On HarmonyOS only `highAccuracy` (accuracy-first) and `lowPower` (low-power network positioning) map semantically; `balancedPowerAccuracy` (balanced) and `noPower` (no active positioning) are Android scheduling semantics with no HarmonyOS equivalent and are silently ignored (priority stays unchanged). System default applies when not provided |
| activityType | LocationActivityType \| void | 'other' | No | iOS | No | User activity type; no HarmonyOS equivalent, silently ignored |
| androidProvider | AndroidProvider \| void | 'auto' | No | Android | No | Android provider selection (auto/playServices/standard); HarmonyOS has a single system location service, silently ignored |
| allowsBackgroundLocationUpdates | boolean \| void | false | No | iOS | No | iOS background location toggle. On HarmonyOS, background location is controlled by the LOCATION_IN_BACKGROUND permission; this option is silently ignored |
| pausesLocationUpdatesAutomatically | boolean \| void | true | No | iOS | No | iOS automatic pause; no HarmonyOS equivalent, silently ignored |
| showsBackgroundLocationIndicator | boolean \| void | false | No | iOS | No | iOS background location indicator; no HarmonyOS equivalent, silently ignored |
| headingFilter | number \| void | 0 | No | iOS | Yes | Heading change threshold (degrees); callbacks are suppressed when the change is below it; 0 means no filtering |
| headingOrientation | HeadingOrientation \| void | 'portrait' | No | iOS | No | Reference device orientation for heading; no HarmonyOS equivalent, silently ignored |

---

### RequestPermissionOptions
| Name | Type | Default | Required | Platform | HarmonyOS Support | Description |
|---|---|---|---|---|---|---|
| ios | `'whenInUse' \| 'always' \| void` | / | No | iOS | Yes | iOS permission tier. On HarmonyOS: whenInUse → foreground permission set; always → foreground set + background location |
| android | `{ detail: 'fine' \| 'coarse', rationale?: {...} } \| void` | / | No | Android | Partially | Android permission tier and rationale dialog text. On HarmonyOS, detail participates in tier checking; rationale is silently ignored |

---

### GetLatestLocationOptions
| Name | Type | Default | Required | Platform | HarmonyOS Support | Description |
|---|---|---|---|---|---|---|
| timeout | number \| null \| void | 10000 | No | iOS, Android | Yes | Timeout in ms; resolves to `null` on timeout; `null` means no timeout and waits until the first location arrives |

---

### Location
| Name | Type | Platform | HarmonyOS Support | Description |
|---|---|---|---|---|
| timestamp | number | iOS, Android | Yes | Location timestamp (UTC milliseconds) |
| latitude | number | iOS, Android | Yes | Latitude |
| longitude | number | iOS, Android | Yes | Longitude |
| accuracy | number | iOS, Android | Yes | Horizontal accuracy radius (meters), mapped from HarmonyOS `accuracy` |
| altitude | number | iOS, Android | Yes | Altitude (meters), mapped from HarmonyOS `altitude` |
| altitudeAccuracy | number | iOS, Android | Yes | Vertical accuracy (meters), mapped from HarmonyOS `altitudeAccuracy` (optional since API12+, defaults to 0) |
| course | number | iOS, Android | Yes | Direction of travel (degrees, 0-360, true north baseline), mapped from HarmonyOS `direction` |
| courseAccuracy | number | iOS, Android | Yes | Course accuracy, mapped from HarmonyOS `directionAccuracy` (optional, defaults to 0) |
| speed | number | iOS, Android | Yes | Instantaneous speed (m/s), mapped from HarmonyOS `speed` |
| speedAccuracy | number | iOS, Android | Yes | Speed accuracy (m/s), mapped from HarmonyOS `speedAccuracy` (optional, defaults to 0) |
| floor | number | iOS | No | Indoor floor level; no HarmonyOS equivalent, not emitted in the payload |
| fromMockProvider | boolean | Android | No | Whether from a mock provider; no HarmonyOS equivalent, not emitted in the payload |

---

### Heading
| Name | Type | Platform | HarmonyOS Support | Description |
|---|---|---|---|---|
| heading | number | iOS | Yes | Heading angle (degrees, 0-360, around the Z axis). Approximated on HarmonyOS with the orientation sensor `OrientationResponse.alpha`, consistent with compass direction (north 0 / east 90) |

---

### LocationPermissionStatus
| Value | Platform | HarmonyOS Support | Description |
|---|---|---|---|
| authorizedAlways | iOS, Android | Yes | Fine + coarse + background location all granted (LOCATION + APPROXIMATELY_LOCATION + LOCATION_IN_BACKGROUND) |
| authorizedWhenInUse | iOS | No | No equivalent intermediate state on HarmonyOS: foreground fine permission returns `authorizedFine` |
| authorizedFine | Android | Yes | Foreground fine permission (both LOCATION and APPROXIMATELY_LOCATION granted) |
| authorizedCoarse | Android | Yes | Coarse permission only (only APPROXIMATELY_LOCATION granted) |
| denied | iOS, Android | Partially | Not granted. On HarmonyOS "never requested" and "denied by user" cannot be distinguished; always returns this value |
| restricted | iOS, Android | Yes | Returned when the permission status query fails |
| notDetermined | iOS | No | Cannot be distinguished on HarmonyOS (merged with denied); never returned |

## Known Issues

The following summarizes the items marked No / Partially in "Available APIs", with the reasons (mostly differences between HarmonyOS capabilities and iOS/Android mechanisms, not defects):

1. The `AndroidProvider` type values differ from the official npm 2.5.0 package (`"auto" | "fused" | "builtin"`); this package uses `"auto" | "playServices" | "standard"` (naming taken from the upstream GitHub master branch). This option is Android-only and ignored at runtime on HarmonyOS, so functionality is unaffected. If business code follows the official npm 2.5.0 types and passes `fused`/`builtin`, a TS compile error occurs — this is a known type-level difference.
2. **Limited permission status granularity** (why `getCurrentPermission` / `LocationPermissionStatus` are Partially / No): the HarmonyOS permission layer cannot distinguish "never requested", "denied by user", and "undetermined"; unauthorized always returns `denied`. The `notDetermined` and `authorizedWhenInUse` values are never returned on HarmonyOS.
3. **`requestPermission` behavior differences** (why it is Partially): under the `always` tier, the background location permission (`LOCATION_IN_BACKGROUND`) cannot be granted by code due to HarmonyOS restrictions — it can only be enabled manually by the user in system Settings. The code request neither shows a dialog nor grants anything; returning `false` when the user has not enabled it is expected (see "Usage Restrictions"). The `android.rationale` dialog text is silently ignored on HarmonyOS.
4. **Different permission-change subscription timing** (why `subscribeToPermissionUpdates` is Partially): the original library on iOS callbacks on system authorization status changes; HarmonyOS has no system-level change notification, so the listener fires once after each permission query/request call.
5. **Some ConfigureOptions are silently ignored** (No items): `fastestInterval`, `maxWaitTime` (Android scheduling/batching semantics; HarmonyOS `timeInterval` is a single slot, so only `interval` applies), `desiredAccuracy.ios` (iOS accuracy tiers), `activityType`, `androidProvider`, `allowsBackgroundLocationUpdates` (background location on HarmonyOS is controlled by the `LOCATION_IN_BACKGROUND` permission), `pausesLocationUpdatesAutomatically`, `showsBackgroundLocationIndicator`, and `headingOrientation` — none of these take effect, and no error is reported.
6. **Some `desiredAccuracy.android` tiers have no equivalent** (why it is Partially): only `highAccuracy` (→ `ACCURACY`) and `lowPower` (→ `LOW_POWER`) map semantically; `balancedPowerAccuracy` and `noPower` are Android scheduling semantics and are silently ignored (priority unchanged). The system default `FIRST_FIX` applies when not provided.
7. **2 fields missing from the Location payload** (No items): `floor` (iOS indoor floor) and `fromMockProvider` (Android mock-location flag) have no HarmonyOS equivalent and are not emitted; business code should not depend on them.
8. **Heading approximated by the orientation sensor** (why `subscribeToHeadingUpdates` is Partially): HarmonyOS approximates the compass heading with the orientation sensor `OrientationResponse.alpha`; there is no `trueHeading`/`magneticHeading` distinction (`headingOrientation` has no effect, see item 5).
9. **Significant location changes are approximated** (why `subscribeToSignificantLocationUpdates` is Partially): approximated on HarmonyOS with a low-power network-positioning request using a 1000m distance interval; coarser granularity than iOS and unaffected by the configured `distanceFilter`.

## Others
1. Emulators without an orientation sensor/GNSS: subscribing to heading triggers a graceful `onWarning` (502) degradation instead of a crash; when no location can be obtained, `getLatestLocation` returns `null` on timeout. Location-related cases should be verified on real devices first.
2. The first callback after starting location updates may be a historical location from `getLastLocation()` (aligned with the Android `getLastKnownLocation` immediate-report behavior) — this is not a defect.

## Directory Structure
```
/ohos-location              # Project root directory
├── src/                    # RN JS code
│    └─ index.ts            # Entry file (9 public APIs)
│    └─ types.ts            # Type definitions (ConfigureOptions/Location, etc.)
│    └─ utils.ts            # Utility functions
│    └─ lib/                # nativeInterface / permissions / subscriptions
│    └─ specs/v1/           # TurboModule codegen spec (NativeRNLocation.ts)
├── harmony/                # HarmonyOS adaptation code
│    └─ location.har        # HAR package
│    └─ location/           # HarmonyOS adaptation core code
│         └─ index.ets      # HarmonyOS adaptation entry
│         └─ src/main/ets/  # ArkTS implementation
│              └─ RNLocationTurboModule.ets        # Location/heading/permission TurboModule implementation
│              └─ LocationTurboModulesFactory.ets  # Package registration
│              └─ generated/                       # codegen generated code
│         └─ src/main/cpp/  # C++ side registration
│              └─ LocationPackage.h
│              └─ generated/
├── dist/                   # JS build output (commonjs/module/typescript)
├── example/                # Example project
│    └─ App.tsx             # Demo (covers all APIs and options)
│    └─ harmony/            # HarmonyOS example project
├── package.json
├── README.md               # Chinese installation and usage guide
└── README_en.md            # English installation and usage guide
```

## How to Contribute

If you find any issues during use, feel free to submit an [Issue](https://github.com/cbd1020819393/react-native-location/issues); PRs are of course also welcome ([Pull Requests](https://github.com/cbd1020819393/react-native-location/pulls)).

## License

This project is licensed under the [MIT License (MIT)](https://github.com/cbd1020819393/react-native-location/blob/master/LICENSE). Enjoy and participate in open source freely.
