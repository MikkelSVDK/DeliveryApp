import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, View, TouchableOpacity } from 'react-native';
import getDirections from 'react-native-google-maps-directions';
import { showMessage } from "react-native-flash-message";
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
          ( this.state.currentStop.customer.address.geometry.lat * Math.PI / 180 )
        ) + Math.cos(
          ( lat * Math.PI / 180 ) 
        ) * Math.cos( ( this.state.currentStop.customer.address.geometry.lat * Math.PI / 180 ) 
        ) *  Math.cos( 
          ( ( lng - this.state.currentStop.customer.address.geometry.lng ) * Math.PI / 180 )
        ) 
      ) * 180 / Math.PI 
    ) * 60 * 1.1515 * 1.609344 * 1000;
  }

  async startLocationWatch(){
    let watchPosition = await Location.watchPositionAsync({
      accuracy: 5,
      distanceInterval: 1,
    }, location => {
      var metersToDestination = this.calculateDiffrence(location.coords.latitude, location.coords.longitude);
      
      this.setState({metersToDestination: metersToDestination});
    });

    this.setState({watchPosition: watchPosition})
  }

  /*async refreshScreen(){
    let distance = await this.calculateDiffrence(this.state.currentStop.customer.address.geometry.lat, this.state.currentStop.customer.address.geometry.lng)

    this.setState({distanceFromDestination: distance});
  }*/

  openGoogleMaps(){
    const data = {
      source: null,
      destination: {
        latitude: this.state.currentStop.customer.address.geometry.lat,
        longitude: this.state.currentStop.customer.address.geometry.lng
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
    // Ask for location permissions
    (async () => {
      let { status, granted } = await Location.getForegroundPermissionsAsync();
      if(!granted){
        Location.requestForegroundPermissionsAsync().then(async ({ status, granted }) => {
          if(granted)
            this.startLocationWatch();
          else
            showMessage({message: "Appen virker ikke uden adgang til Lokation", type: "danger"});
        });
      }else
        this.startLocationWatch();
    })();

    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });

    axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId).then(res => {
      if(res.data.success){
        this.setState(res.data.data)
      }
    });

    axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.props.route.params.planId + '/stop').then(res => {
      if(res.data.success){
        this.setState(res.data.data)
        this.setState({currentStop: res.data.data.stops.find(s => s.delivered == 0)})
        this.setState({mapLoading: true})

        /*if(this.state.currentStop != null){
          this.refreshScreen();
          this.state.refreshInterval = setInterval(function(){
            this.refreshScreen();
          }.bind(this), 3500);
        }*/
      }
    });

    /*(async () => {
      let  i = Location.getBackgroundPermissionsAsync();
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        this.setState({errorMsg: 'Permission to access location was denied'});
        return;
      }
    })();*/
  }

  componentDidUpdate(){
    if(this.state.metersToDestination < 10 && this.state.metersToDestination != -1 && !this.state.arrivedAtStop){
      this.props.navigation.navigate("RouteDestination", {routeId: this.props.route.params.routeId, planId: this.props.route.params.planId, stopId: this.state.currentStop.id});
      this.setState({arrivedAtStop: true});
    }

    if(this.state.currentStop == null){
      this.props.navigation.navigate("RouteCompleted");
    }
  }

  componentWillUnmount(){
    if(this.state.watchPosition != null)
      this.state.watchPosition.remove();
  }

  state = {
    watchPosition: null,
    mapLoading: false,
    arrivedAtStop: false,
    route: {},
    stops: [],
    currentStop: {
      customer: {
        address: {
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
  }

  render(){
    return (
      <SafeAreaView style={{ flex: 1, margin: 10 }}>
        <Text style={styles.topText}>{this.state.route.name} rutevejledning</Text>
        <View style={styles.hrLine}></View>
        {this.state.mapLoading && <MapView provider={PROVIDER_GOOGLE} showsTraffic={true} initialRegion={{ latitude: this.state.currentStop.customer.address.geometry.lat, longitude: this.state.currentStop.customer.address.geometry.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }} style={styles.map}>
          <Marker coordinate={{ latitude: this.state.currentStop.customer.address.geometry.lat, longitude: this.state.currentStop.customer.address.geometry.lng }} title={this.state.currentStop.customer.address.formatted} />
        </MapView>}
        <TouchableOpacity style={styles.startNaviButton} onPress={() => this.openGoogleMaps()}>
          <Text style={styles.startNaviButtonText}>Åben rutevejledning i Google Maps</Text>
        </TouchableOpacity>
        <View style={styles.hrLine}>
          <Text style={{position: 'absolute', top: 0, right: 0, fontSize: 10}}>{this.state.metersToDestination > 1000 ? (Math.round(this.state.metersToDestination / 100) / 10) + ' KM' : (Math.round(this.state.metersToDestination * 10) / 10) + ' M'}</Text>
        </View>
        <Text style={styles.stopInfo}>Navn: {this.state.currentStop.customer.name || '...'}</Text>
        <Text style={styles.stopInfo}>Adresse: {this.state.currentStop.customer.address.formatted || '...'}</Text>
        <View style={styles.hrLine}></View>
        <View style={{bottom: 0, position: 'absolute', width: '100%'}}>
          <Button title="Annuller" onPress={() => this.props.navigation.navigate('RouteList')} />
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
    height: '40%'
  },
  startNaviButton: {
    marginTop: 10,
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
    fontSize: 15
  }
});