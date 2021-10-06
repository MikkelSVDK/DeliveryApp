import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, View, ScrollView, TouchableOpacity } from 'react-native';
import getDirections from 'react-native-google-maps-directions';
import MapView, { Marker } from 'react-native-maps';

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteNavigation extends React.Component {
  async calculateDiffrence(lat, log){
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      this.setState({errorMsg: 'Permission to access location was denied'});
      return;
    }

    let location = await Location.getCurrentPositionAsync({accuracy: 3});

    return (
      Math.acos( 
        Math.sin(
          ( location.coords.latitude * Math.PI / 180 ) 
        ) * Math.sin(
          ( lat * Math.PI / 180 )
        ) + Math.cos(
          ( location.coords.latitude * Math.PI / 180 ) 
        ) * Math.cos( ( lat * Math.PI / 180 ) 
        ) *  Math.cos( 
          ( ( location.coords.longitude - log ) * Math.PI / 180 )
        ) 
      ) * 180 / Math.PI 
    ) * 60 * 1.1515 * 1.609344 * 1000;
  }

  async refreshScreen(){
    let distance = await this.calculateDiffrence(this.state.currentStop.customer.address.geometry.lat, this.state.currentStop.customer.address.geometry.lng)

    this.setState({distanceFromDestination: distance});
  }

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

        this.refreshScreen();
        this.state.refreshInterval = setInterval(function(){
          this.refreshScreen();
        }.bind(this), 1000);
      }
    });
  }

  componentWillUnmount(){
    clearInterval(this.state.refreshInterval);
  }

  state = {
    refreshInterval: null,
    mapLoading: false,
    errorMsg: '',
    route: {},
    stops: [],
    currentStop: {},
    meta: {},
    distanceFromDestination: -1,
  }

  render(){
    let text = 'Loading distance...';
    if (this.errorMsg) {
      text = this.state.errorMsg;
    } else if (this.state.distanceFromDestination != -1) {
      text = this.state.distanceFromDestination + ' Meters';
    }

    return (
      <SafeAreaView style={{ flex:1, margin: 10 }}>
        <Text style={styles.topText}>{this.state.route.name} rute navigation</Text>
        <View style={styles.hrLine}></View>
        {this.state.mapLoading && <MapView showsTraffic={true} initialRegion={{ latitude: this.state.currentStop.customer.address.geometry.lat, longitude: this.state.currentStop.customer.address.geometry.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }} style={styles.map}>
          <Marker coordinate={{ latitude: this.state.currentStop.customer.address.geometry.lat, longitude: this.state.currentStop.customer.address.geometry.lng, }} title={this.state.currentStop.customer.address.formatted} />
        </MapView>}
        <TouchableOpacity style={styles.startNaviButton} onPress={() => this.openGoogleMaps()}>
          <Text style={styles.startNaviButtonText}>Åben rutevejledning i Google Maps</Text>
        </TouchableOpacity>
        <View style={styles.hrLine}></View>
        <Text style={[styles.topText, {marginTop: 50, marginBottom: 50}]}>{text}</Text>
        <Button title="Go Back" onPress={() => this.props.navigation.navigate('RouteList')} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
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
    fontSize: 20,
    textAlign: 'center'
  }
});