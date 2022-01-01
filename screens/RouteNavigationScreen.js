import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import getDirections from 'react-native-google-maps-directions';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteNavigation extends React.Component {
  calculateDiffrence(lat, lng){
    return (
      Math.acos( 
        Math.sin(
          ( lat * Math.PI / 180 ) 
        ) * Math.sin(
          ( this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat * Math.PI / 180 )
        ) + Math.cos(
          ( lat * Math.PI / 180 ) 
        ) * Math.cos( ( this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat * Math.PI / 180 ) 
        ) *  Math.cos( 
          ( ( lng - this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng ) * Math.PI / 180 )
        ) 
      ) * 180 / Math.PI 
    ) * 60 * 1.1515 * 1.609344 * 1000;
  }

  async startLocationWatch(){
    this.watchPosition = await Location.watchPositionAsync({
      accuracy: 4,
      distanceInterval: 1,
      //timeInterval: 5000
    }, location => {
      if(this.state.currentStopIndex != null){
        if(this.state.currentStopIndex != -1){
          var metersToDestination = this.calculateDiffrence(location.coords.latitude, location.coords.longitude);
          
          this.setState({
            metersToDestination: metersToDestination,
            speedToDestination: location.coords.speed
          });
        }
      }
    });
  }

  openGoogleMaps(){
    const data = {
      source: null,
      destination: {
        latitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat,
        longitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng
      },
      params: [
        {
          key: "travelmode",
          value: "driving"
        },
        {
          key: "dir_action",
          value: "navigate"
        }
      ]
    }

    getDirections(data)
  }

  componentDidMount(){
    activateKeepAwake();

    // Sets Authorization header for all axios requests
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });

    // Ask for location permissions
    (async () => {
      let { granted } = await Location.getForegroundPermissionsAsync();
      if(!granted){
        Location.requestForegroundPermissionsAsync().then(async ({ status, granted }) => {
          if(granted)
            this.startLocationWatch();
          else
            this.setState({errorMsg: 'Appen virker ikke uden adgang til Lokalition tjenesten'});
        });
      }else
        this.startLocationWatch();
    })();

    // Sets navigation bars title
    this.props.navigation.setOptions({ title: this.props.route.params.route.name + ' rutevejledning' });

    this.navigationListener = this.props.navigation.addListener('focus', () => {
      // Find current stop on route
      this.setState({arrivedAtStop: false, currentStopIndex: this.props.route.params.stops.findIndex(s => s.delivered == 0), startTimeStamp: Date.now()});
    });
  }

  componentDidUpdate(prop, state){
    if(this.state.currentStopIndex != null){
      if(this.state.currentStopIndex != -1){
        // Check distance to destination
        if((this.state.metersToDestination < 50 || (this.state.metersToDestination < 100 && this.state.speedToDestination <= 1.39)) && this.state.metersToDestination != -1 && !this.state.arrivedAtStop){
          if(Math.floor((Date.now() - this.state.startTimeStamp) / 1000) > 9){
            this.props.navigation.navigate("RouteDestination", {data: this.props.route.params, currentStopIndex: this.state.currentStopIndex});
            this.setState({arrivedAtStop: true});
          }
        }
      }else{
        // Route finished
        this.props.navigation.navigate("RouteCompleted");
      }
    }
  }

  componentWillUnmount(){
    deactivateKeepAwake();

    if(this.watchPosition != null)
      this.watchPosition.remove();

    this.navigationListener();
  }

  state = {
    errorMsg: '',
    arrivedAtStop: false,
    currentStopIndex: null,
    startTimeStamp: -1,
    metersToDestination: -1,
    speedToDestination: -1
  }

  render(){
    return (
      <SafeAreaView style={{ flex: 1 }}>
        {this.state.currentStopIndex != null && this.state.currentStopIndex != -1 && <MapView mapType="hybrid" provider={PROVIDER_GOOGLE} showsUserLocation={true} userLocationPriority="high" showsTraffic={true} initialRegion={{ latitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat, longitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng, latitudeDelta: 0.002, longitudeDelta: 0.002 }} style={styles.map}>
          <Marker coordinate={{ latitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat, longitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng }} title={this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.formatted} />
        </MapView>}
        {this.state.errorMsg != '' && <View style={{position: 'absolute', width: '100%', top: 0}}>
            <View style={{backgroundColor: 'red', padding: 12}}>
              <Text style={{color: 'white', textAlign: 'center', fontSize: 18}}>{this.state.errorMsg}</Text>
            </View>
          </View>}
          {this.state.currentStopIndex != null && this.state.currentStopIndex != -1 && <View style={{ margin: 10 }}>
          {/*<TouchableOpacity style={styles.startNaviButton} onPress={() => this.openGoogleMaps()}>
            <Text style={styles.startNaviButtonText}>Åben rutevejledning i Google Maps</Text>
          </TouchableOpacity>*/}
          <View style={styles.hrLine}>
            <Text style={{position: 'absolute', top: 0, right: 0, fontSize: 10}}>{this.state.metersToDestination > 1000 ? (Math.round(this.state.metersToDestination / 100) / 10) + ' KM' : (Math.round(this.state.metersToDestination * 10) / 10) + ' M'}</Text>
          </View>
          <View style={styles.stopView}>
            <Text style={styles.stopTextName}>{this.state.currentStopIndex + 1}. {this.props.route.params.stops[this.state.currentStopIndex].customer.name} {this.props.route.params.stops[this.state.currentStopIndex].customer.diabetes ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11 }}>Sukkersyg</Text></View>: null }</Text>
            <Text style={styles.stopTextAddress}>{this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address != null ? this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.formatted : "Ingen adresse"}</Text>
            <View style={styles.hrLine}></View>
            <Text style={styles.stopTextAddress}>{this.props.route.params.stops[this.state.currentStopIndex].dish != null ? {normal: this.props.route.params.stops[this.state.currentStopIndex].dish.amount + ' ⨉ Normal ret', alternative: this.props.route.params.stops[this.state.currentStopIndex].dish.amount + ' ⨉ Alternativ ret'}[this.props.route.params.stops[this.state.currentStopIndex].dish.type] : 'Ingen ret'}</Text>
            <Text style={styles.stopTextAddress}>{this.props.route.params.stops[this.state.currentStopIndex].sandwiches.amount != 0 ? this.props.route.params.stops[this.state.currentStopIndex].sandwiches.amount + ' ⨉ Håndmadder' : 'Ingen håndmadder'} {this.props.route.params.stops[this.state.currentStopIndex].sandwiches.special ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11}}>Special af 18,-</Text></View>: null }</Text>
          </View>
        </View>}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  hrLine:{
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 5
  },
  topText: {
    fontSize: 25,
    marginBottom: 0,
    marginTop: Platform.OS === "android" ? statusBarHeight + 25 : 7,
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: '50%'
  },
  startNaviButton: {
    marginBottom: 5,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 20,
    width: '100%',
  },
  startNaviButtonText: {
    fontSize: 18,
    textAlign: 'center'
  },
  stopInfo: {
    fontSize: 18
  },
  stopView: {
    backgroundColor: '#fff',
    marginVertical: 5,
    minHeight: 85,
    paddingHorizontal: 15,
    paddingVertical: 20
  },
  stopTextName: {
    fontSize: 20
  },
  stopTextAddress: {
    fontSize: 18
  },
  badge: {
    backgroundColor: '#0f94d1',
    padding: 2
  }
});