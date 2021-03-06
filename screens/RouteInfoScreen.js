import React from 'react';
import { StyleSheet, Text, Button, TouchableOpacity, View, ScrollView, SafeAreaView, Image } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import StopView from './partials/StopView';
import DishView from './partials/DishView';

export default class RouteView extends React.Component {
  signOut(){
    SecureStore.deleteItemAsync("sessionToken");
    delete axios.defaults.headers.common['Authorization']
    this.props.navigation.navigate('SignIn');
  }

  updateRoute(){
    axios.get('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.routeId).then(res => {
      if(res.data.success)
        this.setState({route: res.data.data})
      else{
        if(res.data.errors[0] == "invalid access token" || res.data.errors[0] == "access token expired")
          this.signOut();
      }
    });

    axios.get('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.routeId + '/current_plan').then(res => {
      if(res.data.success){
        this.setState(res.data.data)

        if(this.state.current_plan != null){
          axios.get('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.routeId + '/' + this.state.current_plan + '/stop').then(res => {
            if(res.data.success){
              this.setState(res.data.data);
              
              /*if(res.data.data.stops.length > 1){
                // Optimization object
                let optimize = {
                  jobs: [],
                  vehicles: [
                    {
                      id: 1,
                      profile: "driving-car",
                      start: [
                        res.data.data.stops[0].customer.primary_address.geometry.lng,
                        res.data.data.stops[0].customer.primary_address.geometry.lat
                      ]
                    }
                  ]
                };

                for (var i = 0; i < res.data.data.stops.length; i++) {
                  const stop = res.data.data.stops[i];
                  
                  optimize.jobs.push({
                    id: stop.id,
                    service: 90,
                    location: [
                      stop.customer.primary_address.geometry.lng,
                      stop.customer.primary_address.geometry.lat
                    ]
                  });
                }

                axios.post('https://api.openrouteservice.org/optimization', optimize, {
                  headers: {
                    'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                    'Authorization': '5b3ce3597851110001cf62480badd745b7524db9bd7bfa472578d43d',
                    'Content-Type': 'application/json; charset=utf-8'
                  }
                }).then(optRes => {
                  for (var i = 0; i < optRes.data.routes[0].steps.length; i++) {
                    const step = optRes.data.routes[0].steps[i];
                    if(step.type == 'job'){
                      const stopIndex = res.data.data.stops.findIndex(s => s.id == step.id);
                      res.data.data.stops[stopIndex].delivery_order = i;
                    }
                  }
                  res.data.data.stops.sort((a, b) => a.delivery_order - b.delivery_order);
                  
                  this.setState(res.data.data);
                }).catch(e => {
                  this.setState(res.data.data);
                })
              }else
                this.setState(res.data.data);*/
            }
          });
        }
      }
    });
  }

  startRouteNavigation(){
    this.props.navigation.navigate("RouteNavigation", this.state);
  }

  showRouteList(){
    this.props.navigation.navigate("RouteNavigationSimple", this.state);
  }

  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });

    this.updateRoute();

    this.willFocusSubscription = this.props.navigation.addListener(
      'focus',
      () => {
        this.setState({is_updated:true});
      }
    );

    this.props.navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => this.updateRoute()}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      ),
    });
  }

  componentDidUpdate(prop, state){
    if(state.route.name != this.state.route.name)
      this.props.navigation.setOptions({ title: this.state.route.name + ' rute' })
  }

  componentWillUnmount() {
    this.willFocusSubscription();
  }

  state = {
    route: {},
    current_plan: null,
    meta: {},
    dishes: [],
    stops: []
  }

  render(){
    if(this.state.current_plan != null){
      return (
        <SafeAreaView style={{ flex:1 }}>
          <View style={styles.container}>
            <Text style={styles.header}>Retter</Text>
            <View style={styles.hrLine}></View>
            <View style={{maxHeight:190}}>
              <ScrollView style={{flexGrow:0}}>
                {this.state.dishes.map((dish, index) => (
                  <DishView dish={dish} count={this.state.meta.dish_count[dish.type]} key={index} />
                ))}
              </ScrollView>
            </View>
            <Text style={[styles.header, {marginTop: 10}]}>Stops</Text>
            <View style={styles.hrLine}></View>
            <ScrollView>
              {this.state.stops.map((stop, index) => (
                <StopView stop={stop} index={index} key={index} />
              ))}
            </ScrollView>
            <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={[styles.startButton, {width: '71%', marginRight: 2.5}]} onPress={() => this.startRouteNavigation()}>
              <Text style={styles.startButtonText}>Start rutevejledning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.startButton, {width: '29%', marginLeft: 2.5}]} onPress={() => this.showRouteList()}>
              <Text style={[styles.startButtonText, {fontSize: 23, marginTop: 1}]}>Liste</Text>
            </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }else{
      return (
        <View style={[styles.container, styles.errorContainer]}>
          <View style={styles.errorMessageBox}>
            <Text style={styles.errorMessageText}>Der er ingen aktiv plan p?? dette tidspunkt</Text>
          </View>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    padding: 15
  },
  hrLine:{
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 5
  },
  refreshButtonText: {
    fontSize: 18,
    color: '#0f94d1',
  },
  header: {
    fontSize: 20,
    marginBottom: -5
  },
  errorContainer: {
    height: '90%',
    justifyContent: 'center',
  },
  errorMessageBox: {
    margin: 20,
    backgroundColor: '#d9534f',
    padding: 15
  },
  errorMessageText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 28
  },
  startButton: {
    marginVertical: 10,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  startButtonText: {
    fontSize: 25,
    textAlign: 'center'
  },
  badge: {
    backgroundColor: '#0f94d1',
    padding: 2
  }
});