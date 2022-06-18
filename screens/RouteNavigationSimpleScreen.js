import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Col, Row, Grid } from "react-native-easy-grid";
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { MaterialIcons } from '@expo/vector-icons'; 

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const StopList = [];

const StopView = (stop, key) => {
  return (
    <View key={key} onLayout={(event) => {
      const layout = event.nativeEvent.layout;
      StopList[key] = layout.y;
    }}>
      <Row style={{ backgroundColor: stop.delivered ? 'rgba(0, 255, 0, .3)' : '' }}>
        <Col style={styles.cell}>
          <Text style={styles.text}>{stop.customer.name}</Text>
        </Col>
        <Col style={styles.cell}>
          <Text style={styles.text}>{stop.customer.primary_address.formatted || "Ingen adresse"}</Text>
        </Col>
        <Col style={styles.cellCenter}>
          <Text style={[styles.text, styles.dishNormal]}>{stop.dish && !stop.customer.diabetes && stop.dish.type == 'normal' ? stop.dish.amount : null}</Text>
        </Col>
        <Col style={styles.cellCenter}>
          <Text style={[styles.text, styles.dishAlternative]}>{stop.dish && stop.dish.type == 'alternative' ? stop.dish.amount : null}</Text>
        </Col>
        <Col style={styles.cellCenter}>
          <Text style={[styles.text, styles.dishDiabetes, (stop.dish && stop.dish.type == 'alternative' ? { textDecorationLine: 'line-through' } : {})]}>{stop.dish && stop.customer.diabetes ? stop.dish.amount : null}</Text>
        </Col>
        <Col style={styles.cellCenter}>
          <Text style={[styles.text, styles.dishSandwithes]}>{stop.sandwiches.amount || ''}</Text>
        </Col>
      </Row>
    </View>
  )
}

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

  /*getRoutePoints(origin, destination) {
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
  }*/

  async startLocationWatch(){
    this.watchPosition = await Location.watchPositionAsync({
      accuracy: 4,
      distanceInterval: 1
    }, location => {
      let stopIndex = this.props.route.params.stops.findIndex(s => s.delivered == 0);
      if(stopIndex != -1){
        for (let i = 0; i < this.props.route.params.stops.length; i++) {
          const loopStop = this.props.route.params.stops[i];

          var metersToStop = this.calculateDiffrence({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          }, {
            lat: loopStop.customer.primary_address.geometry.lat,
            lng: loopStop.customer.primary_address.geometry.lng
          });

          if((metersToStop < 50 || (metersToStop < 100 && location.coords.speed <= 1.39)) && !this.state.arrivedAtStop){
            if(Math.floor((Date.now() - this.state.startTimeStamp) / 1000) > 14){
              this.props.navigation.navigate("RouteDestination", {data: this.props.route.params, currentStopIndex: i});

              this.setState({arrivedAtStop: true});
            }
          }
        }
      }else
        this.props.navigation.navigate("RouteCompleted", {data: this.props.route.params});

      /*if(this.state.currentStopIndex != null){
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
      }*/
    });
  }

  /*calculateMapRegion(origin, destination){
    return {
      latitude: (origin.lat + destination.lat) / 2,
      longitude: (origin.lng + destination.lng) / 2,
      latitudeDelta: Math.abs(origin.lat - destination.lat) * 1.3,
      longitudeDelta: Math.abs(origin.lng - destination.lng) * 1.3
    }
  }*/

  /*updateMap(coordinate){
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
  }*/

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
    this.props.navigation.setOptions({ title: this.props.route.params.route.name + ' liste' });

    this.navigationListener = this.props.navigation.addListener('focus', async () => {
      this.setState({arrivedAtStop: false, startTimeStamp: Date.now()});

      setTimeout(() => {
        let stopIndex = this.props.route.params.stops.findIndex(s => s.delivered == 0);

        this.ScrollView.scrollTo({ x: 0, y: StopList[stopIndex], animated: true })
      }, 350);

      // Find current stop on route
      //let stopIndex = this.props.route.params.stops.findIndex(s => s.delivered == 0);

      // Set temporary variable for ease of access to the current stops address
      //const stopAddr = this.props.route.params.stops[stopIndex].customer.primary_address;

      // Get last position
      //let position = await Location.getLastKnownPositionAsync();

      // Get nearby stops
      /*for (let i = stopIndex + 1; i < this.props.route.params.stops.length; i++) {
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
      }*/

      /*let region = this.calculateMapRegion(stopAddr.geometry, {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });*/

      // Set initialRegion for MapView
      //this.setState({initialRegion: region});

      // Update state
      //this.setState({arrivedAtStop: false, currentStopIndex: stopIndex, startTimeStamp: Date.now()});

      // Check to see if next stop is close to current stop
      /*var nextStopDiff = this.calculateDiffrence({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }, {
        lat: stopAddr.geometry.lat,
        lng: stopAddr.geometry.lng
      });*/
      
      // Change screen if next stop is within 50 meters
      /*if(nextStopDiff < 50){
        this.props.navigation.navigate("RouteDestination", {data: this.props.route.params, currentStopIndex: stopIndex});
        this.setState({arrivedAtStop: true});
      }*/

      // Call directions API
      /*this.getRoutePoints({
        lat: position.coords.latitude, 
        lng: position.coords.longitude
      }, {
        lat: stopAddr.geometry.lat, 
        lng: stopAddr.geometry.lng
      });*/
    });
  }

  componentDidUpdate(prop, state){
    /*if(this.state.currentStopIndex != null){
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
        this.props.navigation.navigate("RouteCompleted", {data: this.props.route.params});
      }
    }*/
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
    startTimeStamp: -1
  }

  ScrollView;

  render(){
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Grid>
            <Row style={{height: 30, backgroundColor: '#c8eafd'}}>
              <Col style={styles.cell}>
                <Text style={styles.text}>Navn</Text>
              </Col>
              <Col style={styles.cell}>
                <Text style={styles.text}>Adresse</Text>
              </Col>
              <Col style={styles.cellCenter}>
                <Text style={[styles.text, styles.dishNormal]}>D</Text>
              </Col>
              <Col style={styles.cellCenter}>
                <Text style={[styles.text, styles.dishAlternative]}>A</Text>
              </Col>
              <Col style={styles.cellCenter}>
                <Text style={[styles.text, styles.dishDiabetes]}>S</Text>
              </Col>
              <Col style={styles.cellCenter}>
                <Text style={[styles.text, styles.dishSandwithes]}>H</Text>
              </Col>
            </Row>
            <ScrollView ref={(ref) => { this.ScrollView = ref }} style={{marginTop: -1}} bounces={false}>
              {this.props.route.params.stops.map(StopView)}
            </ScrollView>
          </Grid>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 5,
    paddingTop: 10,
    backgroundColor: '#fff' 
  },
  cellCenter: {
    borderWidth: .5,
    borderColor: '#ddd', 
    justifyContent: 'center',
    alignItems: 'center',
    width: 22
  },
  text: {
    fontSize: 22,
  },
  dishNormal: {
    color: 'black'
  },
  dishAlternative: {
    color: 'deepskyblue'
  },
  dishDiabetes: {
    color: 'red'
  },
  dishSandwithes: {
    color: 'green'
  },
  cell: {
    paddingHorizontal: 2,
    borderWidth: .5,
    borderColor: '#ddd', 
    justifyContent: 'center'
  },
});