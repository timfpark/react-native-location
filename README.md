# `react-native-location`

![MIT License](https://img.shields.io/npm/l/react-native-location.svg) ![Supports Android and iOS](https://img.shields.io/badge/platforms-android%20|%20ios-lightgrey.svg) ![Supports React Native >= 0.46](https://img.shields.io/badge/react%20native-%3E%3D%200.46-lightgrey.svg) [![CircleCI Status](https://img.shields.io/circleci/project/github/timfpark/react-native-location/develop.svg)](https://circleci.com/gh/timfpark/workflows/react-native-location/tree/develop)

Native GPS location support for React Native.

You might decide to use this library over the [built-in geolocation](https://facebook.github.io/react-native/docs/geolocation.html) because it includes some additional features:

* Allows you choose what type of permission to ask for ("when in use" or "always"). The built-in geolocation library will look at your plist file and choose "always" if you have the `NSLocationAlwaysUsageDescription` property, however, you might have a usecase where you want to start by asking the user for "while in use" permission and later upgrade the permission to "always" when they turn on a feature which requires background location.
* Ability to check the current permission status (`RNLocation.getCurrentPermission`).
* Allows you to monitor the device heading.

**This is a prerelease version of the library which changes the API and adds Android support. For the previous version, please see the [master branch](https://github.com/timfpark/react-native-location/tree/master).**

## Installation
Install the library using either Yarn:

```
yarn add react-native-location
```

or using npm:

```
npm install --save react-native-location
```

You then need to link the native parts of the library:

```
react-native link react-native-location
```

You then need to open XCode, go to the project settings and ensure that `CoreLocation.framework` is added to the *Link Binary With Libraries* section.

Alternatively, you can do a manual installation with XCode. First, drag `node_modules/react-native-location/ios/RNLocation.xcodeproj` into your XCode project. Click on the your project in XCode (the name of your project at the top of the left panel), go to `Build Phases` then `Link Binary With Libraries` and add `libRNLocation.a` and `CoreLocation.framework`.

Finally, you then need to make sure you have the correct permissions inside your `info.plist` file. React Native automatically sets up the PList config key for `NSLocationWhenInUseUsageDescription`. However, to use always permission you will need to add `NSLocationAlwaysAndWhenInUseUsageDescription` and `NSLocationAlwaysUsageDescription` into your PList file. The string message in the key will show in the Alert box when your app requests permissions. To start, you can simply add these to your file and edit them (or remove them) later. Remember to only request the permissions you NEED within your app. See the detail on Background Mode later on.

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This is the plist item for NSLocationWhenInUseUsageDescription</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This is the plist item for NSLocationAlwaysAndWhenInUseUsageDescription</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>This is the plist item for NSLocationAlwaysUsageDescription</string>
```

For Android, you need to ensure that your `AndroidManifest.xml` contains this line:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

If you want to access fine location then you should also include:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

If you would like to use the Google Play Services Fused Location provider, then you need to add these dependencies to your `android/app/build.gradle` file:

```groovy
implementation "com.google.android.gms:play-services-base:16.0.1"
implementation "com.google.android.gms:play-services-location:16.0.0"
```

### Background mode setup (optional)
For background mode to work, a few things need to be configured:

1. In the Xcode project, go to Capabilities, switch on "Background Modes" and check "Location updates".
2. Set `NSLocationAlwaysAndWhenInUseUsageDescription` and `NSLocationAlwaysUsageDescription` in your `Info.plist` file.
3. For iOS 9+, set [`allowsBackgroundLocationUpdates`](https://developer.apple.com/reference/corelocation/cllocationmanager/1620568-allowsbackgroundlocationupdates) to true, like this:
```javascript
RNLocation.configure({ allowsBackgroundLocationUpdates: true });
```

## Example application
In the [example](https://github.com/timfpark/react-native-location/example) folder is a React Native sample app which simply allows you to test out whether the library is working for you. You can also use this as a sample implementation to start from. The app requests always on permissions, takes reading every 5 distance and starts immediately. To utilize in the simulator, look on the `Debug -> Location` menu for optional sample trips that will show you updating location such as City Bicicle Ride, City Run and Freeway Drive.

![Example App](./screenshots/example.gif)

## Usage
```javascript
import RNLocation from 'react-native-location';

RNLocation.configure({
  distanceFilter: 5.0
})

RNLocation.requestPermission({
  ios: "whenInUse",
  android: {
    detail: "coarse"
  }
}).then(granted => {
    if (granted) {
      this.locationSubscription = RNLocation.subscribeToLocationUpdates(locations => {
        /* Example location returned
        {
          speed: -1,
          longitude: -0.1337,
          latitude: 51.50998,
          accuracy: 5,
          heading: -1,
          altitude: 0,
          altitudeAccuracy: -1
          floor: 0
          timestamp: 1446007304457.029
        }
        */
      })
    }
  })
```

## Methods
To access the methods, you need import the `react-native-location` module. This is done through `import RNLocation from 'react-native-location'`.

### Configuration
#### `RNLocation.configure`
This is used to configure the location provider. You can use this to enable background mode, filter location updates to a certain distance change, and ensure you have the power settings set correctly for your use case.

You can call `configure` multiple times at it will only change the setting which you pass to it. For example if you only want to change `activityType`, you can call `configure` with just that property present.

```javascript
RNLocation.configure({
    distanceFilter: 100, // Meters
    desiredAccuracy: {
      ios: "best",
      android: "balancedPowerAccuracy"
    },
    // iOS Only
    activityType: "other",
    allowsBackgroundLocationUpdates: false,
    headingFilter: 1, // Degrees
    headingOrientation: "portrait",
    pausesLocationUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: false,
})
```

### Permissions
Correctly managing permissions is key to working with the users location in mobile apps.

* Ask for the lowest level of permissions you can. You'll almost always only need `whenInUse` (foreground) permission rather than background.
* On iOS you only get one chance to ask for permission. If the user requests it the first time this method will always resolves to `false`.
* If you ask for `always` permission then the user gets the chance to accept, but only give you `whenInUse` permission. The Promise will still resolve to `false`, however, if you call `RNLocation.getCurrentPermission` you can check if they actually accepted the lesser permission.
* You should monitor the permissions and respond to it correctly. The user is able to go to their phone setting and revoke or downgrade permissions at any time.

#### `RNLocation.requestPermission`
This method should be called before subscribing to location updates. You need to pass in the type of permission you want for each platform. You can choose not to ignore a platform and it will be ignored. The method returns a promise which resolves to `true` if the permission was granted and `false` if not. For Android you can optionally provide a `rationale` which will be displayed if you ask the user for permission a 2nd time after they have denied permission once.

```javascript
RNLocation.requestPermission({
  ios: 'whenInUse', // or 'always'
  android: {
    detail: 'coarse', // or 'fine'
    rationale: {
      title: "We need to access your location",
      message: "We use your location to show where you are on the map",
      buttonPositive: "OK",
      buttonNegative: "Cancel"
    }
  }
});
```

#### `RNLocation.checkPermission`
Checks if the currently granted permissions match the given options. You can call this before `requestPermission` to check if you already have the permission level you would like. This is especially useful if you want to display a message to the user about not having the correct permissions before actually requesting them.

```javascript
RNLocation.checkPermission({
  ios: 'whenInUse', // or 'always'
  android: {
    detail: 'coarse' // or 'fine'
  }
});
```

#### `RNLocation.getCurrentPermission`
Gets the current permission status.

```javascript
RNLocation.getCurrentPermission()
  .then(currentPermission => {
    ...
  })
```

#### `RNLocation.subscribeToPermissionUpdates`
Monitor the permission status for changes.

```javascript
// Subscribe
const unsubscribe = RNLocation.subscribeToPermissionUpdates(currentPermission => {
  ...
})

// Unsubscribe
unsubscribe();
```

### `RNLocation.subscribeToLocationUpdates`
Subscribe to location changes with the given listener. Ensure you have the correct permission before calling this method. The location provider will respect the settings you have given it. Each event may return an array with more than one location. This is because the OS might batch location updates together and deliver them all at once. Take a look at the `timestamp` to find the latest.

```javascript
// Subscribe
const unsubscribe = RNLocation.subscribeToLocationUpdates(locations => {
  ...
})

// Unsubscribe
unsubscribe();
```

### `RNLocation.subscribeToSignificantLocationUpdates` (iOS only)
Subscribe to significant updates to the users location with the given listener. *This method does not take into account the `distanceFilter` which you configured RNLocation with.* In most cases, you should call `RNLocation.configure` with the correct settings and then use `RNLocation.subscribeToLocationUpdates` to subscribe to the location updates. This will allow you to support both Android and iOS with the same code. For more details, take a look at [Apple's documentation](https://developer.apple.com/documentation/corelocation/cllocationmanager/1423531-startmonitoringsignificantlocati?language=objc). 

```javascript
// Subscribe
const unsubscribe = RNLocation.subscribeToSignificantLocationUpdates(locations => {
  ...
})

// Unsubscribe
unsubscribe();
```

### `RNLocation.subscribeToHeadingUpdates` (iOS only)
Subscribe to heading changes with the given listener. Ensure you have the correct permission before calling this method. The location provider will respect the settings you have given it.

```javascript
// Subscribe
const unsubscribe = RNLocation.subscribeToHeadingUpdates(heading => {
  ...
})

// Unsubscribe
unsubscribe();
```

## License
The library is released under the MIT licence. For more information see `LICENSE`.
