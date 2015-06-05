/**
 * React Native iBeacon example
 * https://github.com/geniuxconsulting/react-native-ibeacon
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  DeviceEventEmitter,
} = React;

// Require react-native-ibeacon module
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

// Range for beacons inside the region
Beacons.startRangingBeaconsInRegion(region);

Beacons.startUpdatingLocation();

// Create our dataSource which will be displayed in the data list
var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

// The BeaconView 
var BeaconView = React.createClass({
  render: function() {
    return (
      <View style={styles.row}>
        <Text style={styles.smallText}>UUID: {this.props.uuid}</Text>
        <Text style={styles.smallText}>Major: {this.props.major}</Text>
        <Text style={styles.smallText}>Minor: {this.props.minor}</Text>
        <Text>RSSI: {this.props.rssi}</Text>
        <Text>Proximity: {this.props.proximity}</Text>
        <Text>Distance: {this.props.accuracy.toFixed(2)}m</Text>
      </View>
    );
  }
});

// The BeaconList component listens for changes and re-renders the 
// rows (BeaconView components) in that case
var BeaconList = React.createClass({
  getInitialState: function() {
    return {
      dataSource: ds.cloneWithRows([]),
    };
  },

  componentWillMount: function() {
    // Listen for beacon changes
    var subscription = DeviceEventEmitter.addListener(
      'beaconsDidRange',
      (data) => {
        // Set the dataSource state with the whole beacon data
        // We will be rendering all of it throug <BeaconView />
        this.setState({
          dataSource: ds.cloneWithRows(data.beacons)
        });
      }
    );
  },

  renderRow: function(rowData) {
    return <BeaconView {...rowData} style={styles.row} />
  },

  render: function() {
    return (
      <View style={styles.container}>
        <Text style={styles.headline}>All beacons in the area</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
        />
      </View>
    );
  },
});


var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  headline: {
    fontSize: 20,
    paddingTop: 20
  },
  row: {
    padding: 8,
    paddingBottom: 16
  },
  smallText: {
    fontSize: 11
  }
});

AppRegistry.registerComponent('BeaconList', () => BeaconList);
