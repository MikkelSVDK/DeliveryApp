import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import getDirections from 'react-native-google-maps-directions';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { MaterialIcons } from '@expo/vector-icons'; 

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteNavigation extends React.Component {
  mapRef = null;

  calculateDiffrence(location, destination){
    return (
      Math.acos( 
        Math.sin(
          ( location.lat * Math.PI / 180 ) 
        ) * Math.sin(
          ( destination.lat * Math.PI / 180 )
        ) + Math.cos(
          ( location.lat * Math.PI / 180 ) 
        ) * Math.cos( ( destination.lat * Math.PI / 180 ) 
        ) *  Math.cos( 
          ( ( location.lng - destination.lng ) * Math.PI / 180 )
        ) 
      ) * 180 / Math.PI 
    ) * 60 * 1.1515 * 1.609344 * 1000;
  }

  getRoutePoints(origin, destination) {
    axios.get(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62480badd745b7524db9bd7bfa472578d43d&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`, {
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Content-Type': 'application/json; charset=utf-8'
      }
    }).then(optRes => {
      let tempCords = [];
      for (let i = 0; i < optRes.data.features[0].geometry.coordinates.length; i++) {
        let coords = optRes.data.features[0].geometry.coordinates[i];

        tempCords.push({
          latitude: coords[1],
          longitude: coords[0]
        })
      }

      this.setState({coordinates: tempCords});
    });
  }

  async startLocationWatch(){
    this.watchPosition = await Location.watchPositionAsync({
      accuracy: 4,
      distanceInterval: 1,
      //timeInterval: 5000
    }, location => {
      if(this.state.currentStopIndex != null){
        if(this.state.currentStopIndex != -1){
          var metersToDestination = this.calculateDiffrence({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          }, {
            lat: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat,
            lng: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng
          });
          
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

  updateMap(coordinate){
    let lat = (this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat + coordinate.latitude) / 2,
     latDelta = Math.abs(this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat - coordinate.latitude),
     lng = (this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng + coordinate.longitude) / 2,
     lngDelta = Math.abs(this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng - coordinate.longitude);

    if(!this.state.freeMapCamera)
      this.mapRef.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: latDelta * 1.3,
        longitudeDelta: lngDelta * 1.3,
      }, 1000);

    // Temp region debug
    this.setState({region: {
      latitude: lat,
      longitude: lng,
      latitudeDelta: latDelta * 1.3,
      longitudeDelta: lngDelta * 1.3
    }});
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

    this.navigationListener = this.props.navigation.addListener('focus', async () => {
      // Find current stop on route
      let stopIndex = this.props.route.params.stops.findIndex(s => s.delivered == 0);

      // Get last position
      let position = await Location.getLastKnownPositionAsync();

      // Check to see if next stop is close to current stop
      var nextStopDiff = this.calculateDiffrence({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }, {
        lat: this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lat,
        lng: this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lng
      });

      // Change screen if next stop is within 50 meters
      if(nextStopDiff < 50){
        this.props.navigation.navigate("RouteDestination", {data: this.props.route.params, currentStopIndex: stopIndex});
        this.setState({arrivedAtStop: true});
      }

      // Get nearby stops
      for (let i = stopIndex + 1; i < this.props.route.params.stops.length; i++) {
        const stop = this.props.route.params.stops[i];

        var metersToDestination = this.calculateDiffrence({
          lat: this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lat,
          lng: this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lng
        }, {
          lat: stop.customer.primary_address.geometry.lat,
          lng: stop.customer.primary_address.geometry.lng
        });

        let currentStreetName = this.props.route.params.stops[stopIndex].customer.primary_address.formatted.replace(/[^a-zæøå]+[ 0-9][a-zæøå]?, [0-9]+ [a-zæøå]+/ig, ""),
         loopStreetName = stop.customer.primary_address.formatted.replace(/[^a-zæøå]+[ 0-9][a-zæøå]?, [0-9]+ [a-zæøå]+/ig, "");
        
        if(metersToDestination < 125 && currentStreetName == loopStreetName){
          this.state.nearStops.push(this.props.route.params.stops[i])
          this.setState({nearStops: this.state.nearStops});
        }
      }

      let lat = (this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lat + position.coords.latitude) / 2,
       latDelta = Math.abs(this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lat - position.coords.latitude),
       lng = (this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lng + position.coords.longitude) / 2,
       lngDelta = Math.abs(this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lng - position.coords.longitude);

      // Set initialRegion for MapView
      this.setState({initialRegion: {
        latitude: lat,
        longitude: lng,
        latitudeDelta: latDelta * 1.3,
        longitudeDelta: lngDelta * 1.3
      }});

      // Update state
      this.setState({arrivedAtStop: false, currentStopIndex: stopIndex, startTimeStamp: Date.now()});

      // Call directions API
      this.getRoutePoints({lat: position.coords.latitude, lng: position.coords.longitude}, {lat: this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lat, lng: this.props.route.params.stops[stopIndex].customer.primary_address.geometry.lng});
    });
  }

  componentDidUpdate(prop, state){
    if(this.state.currentStopIndex != null){
      if(this.state.currentStopIndex != -1){
        // Check distance to destination
        if((this.state.metersToDestination < 50 || (this.state.metersToDestination < 100 && this.state.speedToDestination <= 1.39)) && this.state.metersToDestination != -1 && !this.state.arrivedAtStop){
          if(Math.floor((Date.now() - this.state.startTimeStamp) / 1000) > 14){
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
    debugCounter: 0,
    debugMode: false,
    errorMsg: '',
    arrivedAtStop: false,
    currentStopIndex: null,
    nearStops: [],
    startTimeStamp: -1,
    metersToDestination: -1,
    speedToDestination: -1,
    coordinates: [],
    freeMapCamera: false,
    initialRegion: {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0
    },
    // Temp region debug
    region: {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0
    }
  }

  render(){
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => this.setState({freeMapCamera: !this.state.freeMapCamera})} style={{position:'absolute',zIndex:2,right:12,top:10,backgroundColor:'white',padding:3,borderRadius:3}}>
          <MaterialIcons name={!this.state.freeMapCamera ? 'my-location' : 'location-disabled'} size={24} color="black" />
        </TouchableOpacity>
        {this.state.currentStopIndex != null && this.state.currentStopIndex != -1 && <MapView initialRegion={this.state.initialRegion} onUserLocationChange={event => this.updateMap(event.nativeEvent.coordinate)} mapType="hybrid" provider={PROVIDER_GOOGLE} showsUserLocation={true} showsTraffic={true} style={styles.map} ref={ref => {this.mapRef = ref; }} cacheEnabled>
        <MapView.Polyline coordinates={this.state.coordinates} strokeColor="#1A73E8" strokeWidth={4} />
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
            {this.state.debugMode && <><Text style={{position: 'absolute', top: -11, right: 0, fontSize: 10}}>{this.state.currentStopIndex != 0 ? (((this.state.currentStopIndex) / this.props.route.params.stops.length) * 100).toFixed(1) : '0.0'}%</Text>
            <Text style={{position: 'absolute', top: 0, right: 0, fontSize: 10}}>{this.state.metersToDestination > 1000 ? (Math.round(this.state.metersToDestination / 100) / 10) + ' KM' : (Math.round(this.state.metersToDestination * 10) / 10) + ' M'}</Text>
            <Text style={{position: 'absolute', top: -11, left: 0, fontSize: 10}}>LAT: {this.state.region.latitude} | LNG: {this.state.region.longitude}</Text>
            <Text style={{position: 'absolute', top: 0, left: 0, fontSize: 10}}>LATΔ: {this.state.region.latitudeDelta} | LNGΔ: {this.state.region.longitudeDelta}</Text></>}
          </View>
          <View style={{maxHeight:310, marginTop: 5}}>
            <ScrollView style={{flexGrow:0}} onScrollEndDrag={() => this.state.debugMode||(this.state.debugCounter>19?this.setState({debugMode:!0}):this.setState({debugCounter:this.state.debugCounter+1}))}>
              <View style={styles.stopView}>
                <Text style={styles.stopTextName}>{this.state.currentStopIndex + 1}. {this.props.route.params.stops[this.state.currentStopIndex].customer.name} {this.props.route.params.stops[this.state.currentStopIndex].customer.diabetes ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11 }}>Sukkersyg</Text></View>: null }</Text>
                <Text style={styles.stopTextAddress}>{this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address != null ? this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.formatted : "Ingen adresse"}</Text>
                <View style={styles.hrLine}></View>
                <Text style={styles.stopTextAddress}>{this.props.route.params.stops[this.state.currentStopIndex].dish != null ? {normal: this.props.route.params.stops[this.state.currentStopIndex].dish.amount + ' ⨉ Normal ret', alternative: this.props.route.params.stops[this.state.currentStopIndex].dish.amount + ' ⨉ Alternativ ret'}[this.props.route.params.stops[this.state.currentStopIndex].dish.type] : 'Ingen ret'}</Text>
                <Text style={styles.stopTextAddress}>{this.props.route.params.stops[this.state.currentStopIndex].sandwiches.amount != 0 ? this.props.route.params.stops[this.state.currentStopIndex].sandwiches.amount + ' ⨉ Håndmadder' : 'Ingen håndmadder'} {this.props.route.params.stops[this.state.currentStopIndex].sandwiches.special ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11}}>Special af 18,-</Text></View>: null }</Text>
              </View>
              {this.state.nearStops.map((stop, index) => {
                return (
                  <View style={styles.stopView} key={`stop-${index}`}>
                    <Text style={styles.stopTextName}>{this.state.currentStopIndex + index + 2}. {stop.customer.name} {stop.customer.diabetes ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11 }}>Sukkersyg</Text></View>: null }</Text>
                    <Text style={styles.stopTextAddress}>{stop.customer.primary_address != null ? stop.customer.primary_address.formatted : "Ingen adresse"}</Text>
                    <View style={styles.hrLine}></View>
                    <Text style={styles.stopTextAddress}>{stop.dish != null ? {normal: stop.dish.amount + ' ⨉ Normal ret', alternative: stop.dish.amount + ' ⨉ Alternativ ret'}[stop.dish.type] : 'Ingen ret'}</Text>
                    <Text style={styles.stopTextAddress}>{stop.sandwiches.amount != 0 ? stop.sandwiches.amount + ' ⨉ Håndmadder' : 'Ingen håndmadder'} {stop.sandwiches.special ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11}}>Special af 18,-</Text></View>: null }</Text>
                  </View>
                );
              })}
            </ScrollView>
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