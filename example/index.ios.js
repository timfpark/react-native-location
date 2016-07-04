import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View, DeviceEventEmitter, Linking, Dimensions, TouchableHighlight } from 'react-native'
import { RNLocation as Location } from 'NativeModules'
import moment from 'moment'

const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('window').height

class example extends Component {

  constructor() {
    super()
    this.state = { location: {
        coords: {
          course:358.28,
          speed:0,
          longitude:-122.02322184,
          latitude:37.33743371,
          accuracy:5,
          altitude:0,
          altitudeAccuracy:-1
        },
        timestamp:0
      }
    }
  }

  componentWillMount() {
    Location.requestAlwaysAuthorization()
    Location.startUpdatingLocation()
    Location.setDistanceFilter(5.0)
    DeviceEventEmitter.addListener('locationUpdated', (location) => {
      this.setState({'location':location})
    })
  }

  render() {
    const repoUrl = 'https://github.com/timfpark/react-native-location'

    return (
      <View style={styles.container}>

        <View style={{alignItems:'center',marginTop:30}}>
          <Text style={[styles.text,{textAlign:'center',fontSize:30,fontWeight:'bold'}]}>
            react-native-location
          </Text>
          <TouchableHighlight onPress={() => { Linking.openURL(repoUrl).catch(err => console.error('An error occurred', err)); }}
            underlayColor='#CCC' activeOpacity={0.8}>
            <Text style={[styles.text,{textAlign:'center',fontSize:12,color:'#00C',textDecorationLine:'underline'}]}>
              {repoUrl}
            </Text>
          </TouchableHighlight>
        </View>

        <View style={styles.row}>
          <TouchableHighlight onPress={() => { Location.startUpdatingLocation() }} style={[styles.button,{backgroundColor:'#126312'}]}>
              <Text style={[styles.text,{fontSize:30,color:'#fff'}]}>Start</Text>
          </TouchableHighlight>

          <TouchableHighlight onPress={() => { Location.stopUpdatingLocation() }} style={[styles.button,{backgroundColor:'#881717'}]}>
              <Text style={[styles.text,{fontSize:30,color:'#fff'}]}>Stop</Text>
          </TouchableHighlight>
        </View>

        <View style={styles.row}>
          <View style={[styles.detailBox,{width:deviceWidth/3}]}>
            <Text style={styles.text}>
              Course
            </Text>
            <Text style={[styles.detail,{fontSize:25}]}>
              {this.state.location.coords.course}
            </Text>
          </View>

          <View style={[styles.detailBox,{width:deviceWidth/3}]}>
            <Text style={styles.text}>
              Speed
            </Text>
            <Text style={[styles.detail,{fontSize:25}]}>
              {this.state.location.coords.speed}
            </Text>
          </View>

          <View style={[styles.detailBox,{width:deviceWidth/3}]}>
            <Text style={styles.text}>
              Altitude
            </Text>
            <Text style={[styles.detail,{fontSize:25}]}>
              {this.state.location.coords.altitude}
            </Text>
          </View>
        </View>

        <View style={{alignItems:'flex-start'}}>
          <View style={styles.row}>
            <View style={[styles.detailBox,{width:deviceWidth/2}]}>
              <Text style={styles.text}>
                Latitude
              </Text>
              <Text style={[styles.detail,{fontSize:20}]}>
                {this.state.location.coords.latitude}
              </Text>
            </View>

            <View style={[styles.detailBox,{width:deviceWidth/2}]}>
              <Text style={styles.text}>
                Longitude
              </Text>
              <Text style={[styles.text,{fontSize:20}]}>
                {this.state.location.coords.longitude}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.detailBox,{width:deviceWidth/2}]}>
              <Text style={styles.text}>
                Accuracy
              </Text>
              <Text style={[styles.detail,{fontSize:20}]}>
                {this.state.location.coords.accuracy}
              </Text>
            </View>

            <View style={[styles.detailBox,{width:deviceWidth/2}]}>
              <Text style={styles.text}>
                Altitude Accuracy
              </Text>
              <Text style={[styles.detail,{fontSize:20}]}>
                {this.state.location.coords.altitudeAccuracy}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.detailBox,{width:deviceWidth/2}]}>
              <Text style={{fontFamily:'Futura',fontSize:12}}>
                Timestamp
              </Text>
              <Text style={[styles.detail,{fontSize:15}]}>
                {this.state.location.timestamp}
              </Text>
            </View>

            <View style={[styles.detailBox,{width:deviceWidth/2}]}>
              <Text style={styles.text}>
                Date / Time
              </Text>
              <Text style={[styles.detail,{fontSize:15}]}>
                {moment(this.state.location.timestamp).format("MM-DD-YYYY h:mm:ss")}
              </Text>
            </View>
          </View>

          <View style={[styles.row,{marginTop:10}]}>
            <View style={[styles.detailBox,{width:deviceWidth}]}>
              <Text style={styles.json}>
                {JSON.stringify(this.state.location)}
              </Text>
            </View>
          </View>

        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CCCCCC',
    height:deviceHeight,
  },
  row: {
    flex:1,
    width:deviceWidth,
    flexDirection:'row',
    alignItems:'flex-start',
    justifyContent:'space-between',
    marginTop:5,
    marginBottom:5,
  },
  detailBox: {
    padding:15,
    height:75,
    justifyContent:'center'
  },
  button: {
    marginLeft:10,
    marginRight:10,
    marginTop:15,
    backgroundColor:'#0C0',
    borderRadius:10,
    alignItems:'center',
    justifyContent:'center',
    padding:10,
    width:(deviceWidth/2)-40
  },
  text: {
    fontFamily:'Futura',
    fontSize:12
  },
  detail: {
    fontFamily:'Futura',
    fontSize:12,
    fontWeight:'bold'
  },
  json: {
    fontSize: 12,
    fontFamily: 'Courier',
    textAlign: 'center',
    fontWeight:'bold'
  }
});

AppRegistry.registerComponent('example', () => example);
