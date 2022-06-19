import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { MaterialIcons } from '@expo/vector-icons'; 

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight;

import decodePolyline from 'decode-google-map-polyline';

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import StopView from './partials/StopView';

export default class RouteNavigation extends React.Component {
  mapRef = null;

  calculateDiffrence(origin, destination){
    return (
      Math.acos( 
        Math.sin(
          ( origin.lat * Math.PI / 180 ) 
        ) * Math.sin(
          ( destination.lat * Math.PI / 180 )
        ) + Math.cos(
          ( origin.lat * Math.PI / 180 ) 
        ) * Math.cos( ( destination.lat * Math.PI / 180 ) 
        ) *  Math.cos( 
          ( ( origin.lng - destination.lng ) * Math.PI / 180 )
        ) 
      ) * 180 / Math.PI 
    ) * 60 * 1.1515 * 1.609344 * 1000;
  }

  getRoutePoints(origin, destination) {
    axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=AIzaSyBObQk4vG4yDV2jEhqefWjiXMD7_c5F0E4`).then(polyRes => {
      // Decode polylines from Google directions API
      const decodedPolylines = decodePolyline(polyRes.data.routes[0].overview_polyline.points);

      // Convert lat, lng to latitude, longitude
      let tempCords = [];
      decodedPolylines.forEach(pl => {
        tempCords.push({
          latitude: pl.lat,
          longitude: pl.lng
        });
      });

      // Update coordinates value
      this.setState({coordinates: tempCords});
    });
    
    /*axios.get(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62480badd745b7524db9bd7bfa472578d43d&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`, {
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
    });*/
  }

  async startLocationWatch(){
    this.watchPosition = await Location.watchPositionAsync({
      accuracy: 4,
      distanceInterval: 1
    }, location => {
      if(this.state.currentStopIndex != null){
        if(this.state.currentStopIndex != -1){
          const stopGeo = this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry;

          var metersToDestination = this.calculateDiffrence({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          }, {
            lat: stopGeo.lat,
            lng: stopGeo.lng
          });
          
          this.setState({
            metersToDestination: metersToDestination,
            speedToDestination: location.coords.speed
          });
        }
      }
    });
  }

  calculateMapRegion(origin, destination){
    return {
      latitude: (origin.lat + destination.lat) / 2,
      longitude: (origin.lng + destination.lng) / 2,
      latitudeDelta: Math.abs(origin.lat - destination.lat) * 1.3,
      longitudeDelta: Math.abs(origin.lng - destination.lng) * 1.3
    }
  }

  updateMap(coordinate){
    const stopGeo = this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry;

    let region = this.calculateMapRegion(stopGeo, {
      lat: coordinate.latitude,
      lng: coordinate.longitude
    });
    
    if(this.state.mapCameraState == 0){
      this.mapRef.animateToRegion(region, 1000);
    }else if(this.state.mapCameraState == 1){
      this.mapRef.animateToRegion({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: Math.abs(0.001 * (coordinate.speed / 5)),
        longitudeDelta: Math.abs(0.001 * (coordinate.speed / 5)),
      }, 250);
    }
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

      if(stopIndex == -1)
        return this.props.navigation.navigate("RouteCompleted", {data: this.props.route.params});

      // Set temporary variable for ease of access to the current stops address
      const stopAddr = this.props.route.params.stops[stopIndex].customer.primary_address;

      // Get last position
      let position = await Location.getLastKnownPositionAsync();

      // Get nearby stops
      for (let i = stopIndex + 1; i < this.props.route.params.stops.length; i++) {
        const stop = this.props.route.params.stops[i];

        var metersToDestination = this.calculateDiffrence({
          lat: stopAddr.geometry.lat,
          lng: stopAddr.geometry.lng
        }, {
          lat: stop.customer.primary_address.geometry.lat,
          lng: stop.customer.primary_address.geometry.lng
        });

        let currentStreetName = stopAddr.formatted.replace(/[^a-zæøå]+[ 0-9][a-zæøå]?, [0-9]+ [a-zæøå]+/ig, ""),
         loopStreetName = stop.customer.primary_address.formatted.replace(/[^a-zæøå]+[ 0-9][a-zæøå]?, [0-9]+ [a-zæøå]+/ig, "");
        
        if(metersToDestination < 125 && currentStreetName == loopStreetName){
          this.state.nearStops.push(this.props.route.params.stops[i])
          this.setState({nearStops: this.state.nearStops});
        }
      }

      let region = this.calculateMapRegion(stopAddr.geometry, {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      // Set initialRegion for MapView
      this.setState({initialRegion: region});

      // Update state
      this.setState({arrivedAtStop: false, currentStopIndex: stopIndex, startTimeStamp: Date.now()});

      // Check to see if next stop is close to current stop
      var nextStopDiff = this.calculateDiffrence({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }, {
        lat: stopAddr.geometry.lat,
        lng: stopAddr.geometry.lng
      });
      
      // Change screen if next stop is within 50 meters
      if(nextStopDiff < 50){
        this.props.navigation.navigate("RouteDestination", {data: this.props.route.params, currentStopIndex: stopIndex});
        this.setState({arrivedAtStop: true});
      }

      // Call directions API
      this.getRoutePoints({
        lat: position.coords.latitude, 
        lng: position.coords.longitude
      }, {
        lat: stopAddr.geometry.lat, 
        lng: stopAddr.geometry.lng
      });
    });
  }

  componentDidUpdate(prop, state){
    if(this.state.currentStopIndex != null){
      if(this.state.currentStopIndex != -1){
        // Check distance to destination
        if((this.state.metersToDestination < 40 || (this.state.metersToDestination < 100 && this.state.speedToDestination <= 1.39)) && this.state.metersToDestination != -1 && !this.state.arrivedAtStop){
          if(Math.floor((Date.now() - this.state.startTimeStamp) / 1000) > 14){
            this.props.navigation.navigate("RouteDestination", {data: this.props.route.params, currentStopIndex: this.state.currentStopIndex});
            this.setState({arrivedAtStop: true});
          }
        }
      }else{
        // Route finished
        this.props.navigation.navigate("RouteCompleted", {data: this.props.route.params});
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
    nearStops: [],
    startTimeStamp: -1,
    metersToDestination: -1,
    speedToDestination: -1,
    coordinates: [],
    mapCameraState: 0,
    initialRegion: {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0
    }
  }

  render(){
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => this.setState({mapCameraState: 2==this.state.mapCameraState?0:this.state.mapCameraState+1})} style={styles.mapButton}>
          <MaterialIcons 
            name={this.state.mapCameraState == 0 ? 'location-searching' :  this.state.mapCameraState == 1 ? 'my-location' : 'location-disabled'} 
            size={24} 
            color="black" />
        </TouchableOpacity>
        {this.state.currentStopIndex != null && this.state.currentStopIndex != -1 && 
          <MapView 
            initialRegion={this.state.initialRegion} 
            onUserLocationChange={event => this.updateMap(event.nativeEvent.coordinate)} 
            mapType="hybrid" 
            provider={PROVIDER_GOOGLE} 
            showsUserLocation={true} 
            showsTraffic={false} 
            style={styles.map} 
            ref={ref => {this.mapRef = ref; }} 
            cacheEnabled>
        <MapView.Polyline coordinates={this.state.coordinates} strokeColor="#1A73E8" strokeWidth={4} />
          <Marker 
            coordinate={{ 
              latitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lat, 
              longitude: this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.geometry.lng 
            }} 
            title={this.props.route.params.stops[this.state.currentStopIndex].customer.primary_address.formatted} />
        </MapView>}
        {this.state.errorMsg != '' && <View style={{position: 'absolute', width: '100%', top: 0}}>
          <View style={{backgroundColor: 'red', padding: 12}}>
            <Text style={{color: 'white', textAlign: 'center', fontSize: 18}}>{this.state.errorMsg}</Text>
          </View>
        </View>}
        {this.state.currentStopIndex != null && this.state.currentStopIndex != -1 && <View style={{ margin: 10 }}>
          <View style={styles.hrLine} />
          <View style={{maxHeight:310, marginTop: 5}}>
            <ScrollView style={{flexGrow:0}}>
              <StopView stop={this.props.route.params.stops[this.state.currentStopIndex]} index={this.state.currentStopIndex} />
              {this.state.nearStops.map((stop, index) => (
                <StopView stop={stop} index={this.state.currentStopIndex + index + 1} key={index} />
              ))}
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
  map: {
    width: '100%',
    height: '50%'
  },
  mapButton: {
    position: 'absolute',
    zIndex: 2,
    right: 12,
    top: 10,
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 3
  }
});