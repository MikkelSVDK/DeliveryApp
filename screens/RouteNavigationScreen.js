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
          ( this.state.currentStop.customer.primary_address.geometry.lat * Math.PI / 180 )
        ) + Math.cos(
          ( lat * Math.PI / 180 ) 
        ) * Math.cos( ( this.state.currentStop.customer.primary_address.geometry.lat * Math.PI / 180 ) 
        ) *  Math.cos( 
          ( ( lng - this.state.currentStop.customer.primary_address.geometry.lng ) * Math.PI / 180 )
        ) 
      ) * 180 / Math.PI 
    ) * 60 * 1.1515 * 1.609344 * 1000;
  }

  async startLocationWatch(){
    let watchPosition = await Location.watchPositionAsync({
      accuracy: 5,
      distanceInterval: 1,
      timeInterval: 5000
    }, location => {
      var metersToDestination = this.calculateDiffrence(location.coords.latitude, location.coords.longitude);

      let buffer = this.state.metersToDestinationBuffer;
      buffer.push(metersToDestination);
      buffer = buffer.slice(-5);
      
      this.setState({
        metersToDestination: metersToDestination,
        metersToDestinationBuffer: buffer
      });
    });

    this.setState({watchPosition: watchPosition})
  }

  refreshScreen(){
    this.setState({
      mapLoading: false,
      arrivedAtStop: false,
      metersToDestination: -1
    })
    axios.get('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.routeId).then(res => {
      if(res.data.success)
        this.setState({route: res.data.data})
      else{
        if(res.data.errors[0] == "invalid access token" || res.data.errors[0] == "access token expired")
          this.signOut();
      }
    });

    axios.get('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.routeId + '/' + this.props.route.params.planDate + '/stop').then(res => {
      if(res.data.success){
        this.setState(res.data.data)
        let currentStop = res.data.data.stops.find(s => s.delivered == 0)
        if(currentStop != null)
          this.setState({currentStop: currentStop})
        else
          this.setState({currentStop: { customer: { primary_address: { formatted: 'completed', geometry: { lat: 0, lng: 0 }}}}})
        
        this.setState({mapLoading: true})
      }
    });
  }

  openGoogleMaps(){
    const data = {
      source: null,
      destination: {
        latitude: this.state.currentStop.customer.primary_address.geometry.lat,
        longitude: this.state.currentStop.customer.primary_address.geometry.lng
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

    const unsubscribe = this.props.navigation.addListener('focus', () => {
      this.refreshScreen();
    });
    this.refreshScreen();
    this.setState({navigationListener: unsubscribe});

    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });
  }

  componentDidUpdate(prop, state){
    if(state.route.name != this.state.route.name)
      this.props.navigation.setOptions({ title: this.state.route.name + ' rutevejledning' })
    
    if(this.state.metersToDestination < 200 && this.state.metersToDestination != -1 && !this.state.arrivedAtStop){
      var lastLoc = this.state.metersToDestinationBuffer[0];
      var firstLoc = this.state.metersToDestinationBuffer[this.state.metersToDestinationBuffer.length - 1];
      
      if((lastLoc - firstLoc) < 5 && (lastLoc - firstLoc) > -5){
        this.props.navigation.navigate("RouteDestination", {routeId: this.props.route.params.routeId, planDate: this.props.route.params.planDate, stopId: this.state.currentStop.id});
        this.setState({arrivedAtStop: true});
      }
    }

    if(this.state.metersToDestination < 50 && this.state.metersToDestination != -1 && !this.state.arrivedAtStop){
      this.props.navigation.navigate("RouteDestination", {routeId: this.props.route.params.routeId, planDate: this.props.route.params.planDate, stopId: this.state.currentStop.id});
      this.setState({arrivedAtStop: true});
    }

    if(this.state.currentStop.customer.primary_address.formatted == 'completed')
      this.props.navigation.navigate("RouteCompleted");
  }

  componentWillUnmount(){
    deactivateKeepAwake();

    if(this.state.watchPosition != null)
      this.state.watchPosition.remove();
    
    
    if(this.state.navigationListener != null)
      this.state.navigationListener();
  }

  state = {
    watchPosition: null,
    navigationListener: null,
    errorMsg: '',
    mapLoading: false,
    arrivedAtStop: false,
    route: {},
    stops: [],
    currentStop: {
      customer: {
        primary_address: {
          formatted: '...',
          geometry: {
            lat: 0,
            lng: 0
          }
        }
      }
    },
    meta: {},
    metersToDestination: -1,
    metersToDestinationBuffer: [] 
  }

  render(){
    return (
      <SafeAreaView style={{ flex: 1 }}>
        {this.state.mapLoading && <MapView mapType="hybrid" provider={PROVIDER_GOOGLE} showsUserLocation={true} userLocationPriority="balanced" showsTraffic={true} initialRegion={{ latitude: this.state.currentStop.customer.primary_address.geometry.lat, longitude: this.state.currentStop.customer.primary_address.geometry.lng, latitudeDelta: 0.002, longitudeDelta: 0.002 }} style={styles.map}>
          <Marker coordinate={{ latitude: this.state.currentStop.customer.primary_address.geometry.lat, longitude: this.state.currentStop.customer.primary_address.geometry.lng }} title={this.state.currentStop.customer.primary_address.formatted} />
        </MapView>}
        {this.state.errorMsg != '' && <View style={{position: 'absolute', width: '100%', top: 0}}>
            <View style={{backgroundColor: 'red', padding: 12}}>
              <Text style={{color: 'white', textAlign: 'center', fontSize: 18}}>{this.state.errorMsg}</Text>
            </View>
          </View>}
        <View style={{ margin: 10 }}>
          <TouchableOpacity style={styles.startNaviButton} onPress={() => this.openGoogleMaps()}>
            <Text style={styles.startNaviButtonText}>Åben rutevejledning i Google Maps</Text>
          </TouchableOpacity>
          <View style={styles.hrLine}>
            <Text style={{position: 'absolute', top: 0, right: 0, fontSize: 10}}>{this.state.metersToDestination > 1000 ? (Math.round(this.state.metersToDestination / 100) / 10) + ' KM' : (Math.round(this.state.metersToDestination * 10) / 10) + ' M'}</Text>
          </View>
          <Text>Navn:</Text>
          <Text style={[styles.stopInfo, {marginBottom: 10}]}>{this.state.currentStop.customer.name || '...'}</Text>
          <Text>Adresse:</Text>
          <Text style={styles.stopInfo}>{this.state.currentStop.customer.primary_address.formatted || '...'}</Text>
        </View>
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
  }
});