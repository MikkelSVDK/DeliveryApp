import React from 'react';
import { StyleSheet, Text, Button, TouchableOpacity, View, ScrollView, SafeAreaView, Image } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

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
            }
          });
        }
      }
    });
  }

  startRouteNavigation(){
    this.props.navigation.navigate("RouteNavigation", {routeId: this.state.route.id, planDate: this.state.current_plan});
  }

  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });

    this.updateRoute();

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
            <Text style={styles.foodHeader}>Retter</Text>
            <View style={styles.hrLine}></View>
            <View style={{maxHeight:190}}>
              <ScrollView style={{flexGrow:0}}>
                {this.state.dishes.map((dish, index) => {
                  return (
                    <View style={styles.foodImageView} key={`stop-${index}`}>
                      <Image style={styles.foodImage} source={{uri: dish.image}} />
                      <Text style={styles.foodImageTextName}>{dish.name}</Text>
                      <Text style={styles.foodImageTextType}>{this.state.meta.dish_count[dish.type]} ⨉ {{normal: 'Normal ret', alternative: 'Alternativ ret', 'sugar free': 'Sukkerfri ret'}[dish.type]}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
            <Text style={[styles.foodHeader, {marginTop: 10}]}>Stops</Text>
            <View style={styles.hrLine}></View>
            <ScrollView>
              {this.state.stops.map((stop, index) => {
                return (
                  <View style={styles.stopView} key={`stop-${index}`}>
                    <Text style={styles.stopTextName}>{index + 1}. {stop.customer.name}</Text>
                    <Text style={styles.stopTextAddress}>{stop.customer.primary_address != null ? stop.customer.primary_address.formatted : "Ingen adresse"}</Text>
                    <View style={styles.hrLine}></View>
                    <Text style={styles.stopTextAddress}>{stop.dish != null ? {normal: stop.dish.amount + ' ⨉ Normal ret', alternative: stop.dish.amount + ' ⨉ Alternativ ret', 'sugar free': stop.dish.amount + '⨉ Sukkerfri ret'}[stop.dish.type] : 'Ingen ret'}</Text>
                    <Text style={styles.stopTextAddress}>{stop.sandwiches != 0 ? stop.sandwiches + ' ⨉ Håndmadder' : 'Ingen håndmadder'}</Text>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.startButton} onPress={() => this.startRouteNavigation()}>
              <Text style={styles.startButtonText}>Start rutevejledning</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }else{
      return (
        <View style={[styles.container, styles.errorContainer]}>
          <View style={styles.errorMessageBox}>
            <Text style={styles.errorMessageText}>Der er ingen aktiv plan på dette tidspunkt</Text>
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
  foodHeader: {
    fontSize: 20,
    marginBottom: -5
  },
  foodImage: {
    width: 85,
    height: 85,
    marginRight: 10
  },
  foodImageTextName: {
    top: 20,
    left: 95,
    position: 'absolute',
    fontSize: 20
  },
  foodImageTextType: {
    top: 45,
    left: 95,
    position: 'absolute',
    fontSize: 18
  },
  foodImageView: {
    backgroundColor: '#fff',
    flex: 1,
    marginVertical: 5,
  },
  stopView: {
    backgroundColor: '#fff',
    flex: 1,
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
  }
});