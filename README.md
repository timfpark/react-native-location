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
2. Using `requestAlwaysAuthorization` in place of `requestWhenInUseAuthorization`, like this:
```javascript
Location.requestAlwaysAuthorization();
```
3. Set `NSLocationAlwaysUsageDescription` in your `Info.plist` file.
4. For iOS9+, set [`allowsBackgroundLocationUpdates`](https://developer.apple.com/reference/corelocation/cllocationmanager/1620568-allowsbackgroundlocationupdates) to true, like this:
```javascript
Location.setAllowsBackgroundLocationUpdates(true);
```

## Example application
In the [example](https://github.com/timfpark/react-native-location/example) folder is a React Native sample app which simply allows you to test out whether the library is working for you. You can also use this as a sample implementation to start from. The app requests always on permissions, takes reading every 5 distance and starts immediately. To utilize in the simulator, look on the `Debug -> Location` menu for optional sample trips that will show you updating location such as City Bicicle Ride, City Run and Freeway Drive.

![Example App](./screenshots/example.gif)

## Usage
### Location
```javascript
import RNLocation, { RNLocationEventEmitter } from 'react-native-location';

RNLocation.requestAlwaysAuthorization();
RNLocation.startUpdatingLocation();
RNLocation.setDistanceFilter(5.0);

var subscription = RNLocationEventEmitter.addListener(
    'locationUpdated',
    (location) => {
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
    }
);
```

### Heading
```javascript
import RNLocation, { RNLocationEventEmitter } from 'react-native-location';

RNLocation.requestAlwaysAuthorization();
RNLocation.startUpdatingHeading();

RNLocationEventEmitter.addListener(
    'headingUpdated',
    (data) => {
        /* Example data returned
        {
          heading: 57.2839832
        }
        */
    }
);
```

## Methods

To access the methods, you need import the `react-native-location` module. This is done through `import RNLocation from 'react-native-location'`.

### RNLocation.requestWhenInUseAuthorization
```javascript
RNLocation.requestWhenInUseAuthorization();
```

This method should be called before anything else. It requests location updates while the application is open. If the application is in the background, you will not get location updates. Either this method or `RNLocation.requestAlwaysAuthorization` (but not both) needs to be called to receive updates.

### RNLocation.requestAlwaysAuthorization
```javascript
RNLocation.requestAlwaysAuthorization();
```

This method should be called before anything else is called.  It requests location updates while the application is open or in the background. Either this method or `RNLocation.requestWhenInUseAuthorization` (but not both) needs to be called to receive updates.

### RNLocation.getAuthorizationStatus
```javascript
RNLocation.getAuthorizationStatus(function(authorization) {
  // authorization is a string which is either "authorizedAlways",
  // "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
});
```

This methods gets the current authorization status. While this methods provides a callback, it is not executed asynchronously. The values `authorizedAlways` and `authorizedWhenInUse` correspond to the methods `requestWhenInUseAuthorization` and `requestAlwaysAuthorization` respectively.

### RNLocation.setDesiredAccuracy
```javascript
RNLocation.setDesiredAccuracy(distanceInMeters);
```

Set the desired accuracy of location updates in meters.  Determines the method used to obtain location updates.  Low values will trigger using GPS.

### RNLocation.setDistanceFilter
```javascript
RNLocation.setDistanceFilter(distanceInMeters);
```

Set the desired minimum distance between location updates in meters.

### RNLocation.startMonitoringSignificantLocationChanges
```javascript
RNLocation.startMonitoringSignificantLocationChanges();
```

### RNLocation.startUpdatingLocation
```javascript
RNLocation.startUpdatingLocation();
const subscription = RNLocationEventEmitter.addListener(
    'locationUpdated',
    (location) => {
        // do something with the location
    }
);
```

Start location updates.  Your application will be called back with location updates that meet any mininum distance requirements that you specify via the DeviceEventEmitter event 'locationUpdated'.

### RNLocation.startUpdatingHeading
```javascript
RNLocation.startUpdatingHeading();
const subscription = RNLocationEventEmitter.addListener(
    'headingUpdated',
    (data) => {
        // do something with the heading
    }
);
```

Start heading updates.  Your application will be called back with heading updates.

### RNLocation.stopUpdatingLocation
```javascript
RNLocation.stopUpdatingLocation();
```

Stop receiving location events.

### RNLocation.stopUpdatingHeading
```javascript
RNLocation.stopUpdatingHeading();
```

Stop receiving heading events.

### RNLocation.stopMonitoringSignificantLocationChanges
```javascript
RNLocation.stopMonitoringSignificantLocationChanges();
```

Stop receiving sigificant location change events.

## Events
To listen to events you need to import the `RNLocationEventEmitter` from the library:

```javascript
import RNLocation, { RNLocationEventEmitter } from 'react-native-location';
```

You can then call `RNLocationEventEmitter.addListener` with the first parameter as the name of the event and the second parameter as a function which will be called when the event fires.

### `authorizationStatusDidChange`
Received when the location authorization status changes.

### `locationUpdated`
Received when a location update has been sensed by the system. The event delivers one parameter, location, that is an object with location, elevation, and accuracy data.

### `headingUpdated`
Received when the heading changes. The event delivers one parameter: an object with the current heading in degrees.

## License
The library is released under the MIT licence. For more information see `LICENSE`.
