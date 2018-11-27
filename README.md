# `react-native-location`

Native GPS location support for React Native. Currently only supports iOS.

You might decide to use this library over the [built-in geolocation](https://facebook.github.io/react-native/docs/geolocation.html) because it includes some additional features:

* Allows you choose what type of permission to ask for ("when in use" or "always"). The built-in geolocation library will look at your plist file and choose "always" if you have the `NSLocationAlwaysUsageDescription` property, however, you might have a usecase where you want to start by asking the user for "while in use" permission and later upgrade the permission to "always" when they turn on a feature which requires background location.
* Ability to check the current permission status (`RNLocation.getAuthorizationStatus`).
* Allows you to monitor the device heading.

## Installation
Install the library using either npm:

```
npm install --save react-native-location
```

or using Yarn:

```
yarn add react-native-location
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
### Location
```javascript
import RNLocation from 'react-native-location';

RNLocation.configure({
  distanceFilter: 5.0
})

RNLocation.requestPermission({
  ios: "whenInUse",
  android: "course"
}).then(granted => {
    if (granted) {
      this.locationSubscription = RNLocation.subscribeToLocationUpdates(location => {
        /* Example location returned
        {
          coords: {
            speed: -1,
            longitude: -0.1337,
            latitude: 51.50998,
            accuracy: 5,
            heading: -1,
            altitude: 0,
            altitudeAccuracy: -1
          },
          timestamp: 1446007304457.029
        }
        */
      })
    }
  })
```

### Heading
```javascript
import RNLocation from 'react-native-location';

RNLocation.configure({
  distanceFilter: 5.0
})

RNLocation.requestPermission({
  ios: "whenInUse",
  android: "course"
}).then(granted => {
    if (granted) {
      this.locationSubscription = RNLocation.subscribeToHeadingUpdates(heading => {
        /* Example heading returned
        {
          heading: 12
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
This is used to configure the location provide. You can use this to enable background mode, filter location updates to a certain distance change, and ensure you have the power settings set correctly for your use case.

You can call `configure` multiple times at it will only change the setting which you pass to it. For example if you only want to change `activityType`, you can call `configure` with just that property present.

```javascript
RNLocation.configure({
    activityType: "other",
    allowsBackgroundLocationUpdates: false,
    desiredAccuracy: "best",
    distanceFilter: 0,
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
This method should be called before subscribing to location updates. You need to pass in the type of permission you want for each platform. You can choose not to ignore a platform and it will be ignored. The method returns a promise which resolves to `true` if the permission was granted and `false` if not.

```javascript
RNLocation.requestPermission({
  ios: 'whenInUse', // or 'always'
  android: 'course', // or 'fine'
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
Subscribe to location changes with the given listener. Ensure you have the correct permission before calling this method. The location provider will respect the settings you have given it.

```javascript
// Subscribe
const unsubscribe = RNLocation.subscribeToLocationUpdates(location => {
  ...
})

// Unsubscribe
unsubscribe();
```

### `RNLocation.subscribeToHeadingUpdates`
Subscribe to heading changes with the given listener. Ensure you have the correct permission before calling this method. The location provider will respect the settings you have given it.

```javascript
// Subscribe
const unsubscribe = RNLocation.subscribeToHeadingUpdates(location => {
  ...
})

// Unsubscribe
unsubscribe();
```

## License
The library is released under the MIT licence. For more information see `LICENSE`.
