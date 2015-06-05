# react-native-ibeacon
[![Dependency Status](https://david-dm.org/geniuxconsulting/react-native-ibeacon.svg)](https://david-dm.org/geniuxconsulting/react-native-ibeacon)

iBeacon support for React Native. The API is very similar to the CoreLocation Objective-C one with the only major difference that regions are plain JavaScript objects.
Beacons don't work in the iOS simulator.

## Installation
Install using npm with `npm install --save react-native-ibeacon`

You then need to add the Objective C part to your XCode project. Drag `RNBeacon.xcodeproj` from the `node_modules/react-native-ibeacon` folder into your XCode project. Click on the your project in XCode, goto Build Phases then Link Binary With Libraries and add `libRNBeacon.a` and `CoreLocation.framework`.

NOTE: Make sure you don't have the `RNBeacon` project open separately in XCode otherwise it won't work.

## Usage
```javascript
var React = require('react-native');
var {DeviceEventEmitter} = React;

var Beacons = require('react-native-ibeacon');

// Define a region which can be identifier + uuid, 
// identifier + uuid + major or identifier + uuid + major + minor
// (minor and major properties are numbers)
var region = {
	identifier: 'Estimotes',
	uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'	
};

// Request for authorization while the app is open
Beacons.requestWhenInUseAuthorization();

Beacons.startMonitoringForRegion(region);
Beacons.startRangingBeaconsInRegion(region);

Beacons.startUpdatingLocation();

// Listen for beacon changes
var subscription = DeviceEventEmitter.addListener(
  'beaconsDidRange',
  (data) => {
  	// data.region - The current region
  	// data.region.identifier
  	// data.region.uuid

  	// data.beacons - Array of all beacons inside a region
  	//	in the following structure:
  	//	  .uuid
  	//	  .major - The major version of a beacon
  	//	  .minor - The minor version of a beacon
  	//	  .rssi - Signal strength: RSSI value (between -100 and 0)
  	// 	  .proximity - Proximity value, can either be "unknown", "far", "near" or "immediate"
  	//	  .accuracy - The accuracy of a beacon
  }
);
```

It is recommended to set `NSWhenInUseUsageDescription` in your `Info.plist` file.

## Background mode
For background mode to work, a few things need to be configured:
In the Xcode project, go to Capabilities, switch on "Background Modes" and check both "Location updates" and "Uses Bluetooth LE accessories".


Then, instead of using `requestWhenInUseAuthorization` the method `requestAlwaysAuthorization`.
```javascript
Beacons.requestAlwaysAuthorization();
```

Here, it's also recommended to set `NSLocationAlwaysUsageDescription` in your `Info.plist` file.

## Methods

To access the methods, you need import the `react-native-ibeacon` module. This is done through `var Beacons = require('react-native-ibeacon')`.

### Beacons.requestWhenInUseAuthorization
```javascript
Beacons.requestWhenInUseAuthorization();
```

This method should be called before anything else is called. It handles to request the use of beacons while the application is open. If the application is in the background, you will not get a signal from beacons. Either this method or `Beacons.requestAlwaysAuthorization` needs to be called to receive data from beacons.

### Beacons.requestAlwaysAuthorization
```javascript
Beacons.requestAlwaysAuthorization();
```

This method should be called before anything else is called. It handles to request the use of beacons while the application is open or in the background. Either this method or `Beacons.requestWhenInUseAuthorization` needs to be called to receive data from beacons.

### Beacons.getAuthorizationStatus
```javascript
Beacons.getAuthorizationStatus(function(authorization) {
  // authorization is a string which is either "authorizedAlways", 
  // "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
});
```

This methods gets the current authorization status. While this methods provides a callback, it is not executed asynchronously. The values `authorizedAlways` and `authorizedWhenInUse` correspond to the methods `requestWhenInUseAuthorization` and `requestAlwaysAuthorization` respectively.

### Beacons.startMonitoringForRegion
```javascript
var region = {
  identifier: 'Estimotes',
  uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'	
};

Beacons.startMonitoringForRegion(region);
```
When starting monitoring for beacons, we need to define a region as the parameter. The region is an object, which needs to have at least two values: `identifier` and `uuid`. Additionally, it can also have a `major`, `minor` version or both. Make sure to not re-use the same identifier. In that case, we won't get the data for the beacons. The corresponding events are `regionDidEnter` and `regionDidExit`.

### Beacons.startRangingBeaconsInRegion
```javascript
var region = {
  identifier: 'Estimotes',
  uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'	
};

Beacons.startRangingBeaconsInRegion(region);
```
When ranging for beacons, we need to define a region as the parameter. The region is an object, which needs to have at least two values: `identifier` and `uuid`. Additionally, it can also have a `major`, `minor` version or both. Make sure to not re-use the same identifier. In that case, we won't get the data for the beacons. The corresponding events are `beaconsDidRange`. The event will fire in every interval the beacon sends a signal, which is one second in most cases.
If we are monitoring and ranging for beacons, it is best to first call `startMonitoringForRegion` and then call `startRangingBeaconsInRegion`.

### Beacons.startUpdatingLocation
```javascript
Beacons.startUpdatingLocation();
```

This call is needed for monitoring beacons and gets the initial position of the device.

### Beacons.stopUpdatingLocation
```javascript
Beacons.stopUpdatingLocation();
```

This method should be called when you don't need to receive location-based information and want to save battery power.

## Events
To listen to events we need to call `DeviceEventEmitter.addListener` (`var {DeviceEventEmitter} = require('react-native')`) where the first parameter is the event we want to listen to and the second is a callback function that will be called once the event is triggered.

### beaconsDidRange
This event will be called for every region in every beacon interval. If you have three regions you get three events every second (which is the default interval beacons send their signal).
When we take a closer look at the parameter of the callback, we get information on both the region and the beacons.
```javascript
{
  region: {
    identifier: String,
    uuid: String
  },
  beacons: Array<Beacon>
}
```

A `Beacon` is an object that follows this structure:
```javascript
{
  uuid: String, // The uuid for the beacon
  major: Number, // A beacon's major value
  minor: Number, // A beacon's minor value
  rssi: Number, // The signal strength, where -100 is the maximum value and 0 the minium. 
                // If the value is 0, this corresponds to not being able to get a precise value
  proximity: String, // Fuzzy value representation of the signal strength.
  		     // Can either be "far", "near", "immediate" or "unknown"
  accuracy: Number // One sigma horizontal accuracy in meters, see: http://stackoverflow.com/questions/20416218/understanding-ibeacon-distancing/30174335#30174335
}
```
By default, the array is sorted by the `rssi` value of the beacons.

### regionDidEnter
If the device entered a region, `regionDidEnter` is being called.

Inside the callback the paramter we can use returns an object with a property `region` that contains the region identifier value as a string. Additionally, we get the UUID of the region through its `uuid` property.
```javascript
{
  region: String,
  uuid: String
}
```

### regionDidExit
In the same `regionDidEnter` is called if the device entered a region, `regionDidExit` will be called if the device exited a region and we can't get any signal from any of the beacons inside the region.

As for the payload, we get a property called `region` that represents the region identifier and is a string as well as the `uuid`.
```javascript
{
  region: String,
  uuid: String
}
```

###authorizationDidChange
When the user permissions change, for example the user allows to always use beacons, this event will be called. The same applies when the user revokes the permission to use beacons.
```javascript
// The payload is a string which can either be:
// "authorizedAlways", "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
```

## Troubleshooting

### In the `beaconsDidRange` event, the `beacons` property is just an empty array.
There are several things that trigger that behavior, so it's best to follow these steps:

1. Don't use the same identifier for multiple regions
2. Check if your beacon batteries aren't empty
3. If monitoring and ranging for beacons, make sure to first monitor and then range

## Style guide
This repository uses the Geniux code style guide (based on the AirBnB style guide), for more information see: https://github.com/geniuxconsulting/javascript

For commit messages, we are following the commit guide from https://github.com/geniuxconsulting/guideline

## License
MIT, for more information see `LICENSE`
