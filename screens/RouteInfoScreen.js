import React from 'react';
import { StyleSheet, Text, Button, TouchableOpacity, View, ScrollView, SafeAreaView, Image } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteView extends React.Component {
  updateRoute(){
    axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId).then(res => {
      if(res.data.success)
        this.setState(res.data.data)
    });

    axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/current_plan').then(res => {
      if(res.data.success){
        this.setState(res.data.data)

        if(res.data.data.current_plan != null){
          axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.state.current_plan.id + '/dish').then(res => {
            if(res.data.success){
              for (let i = 0; i < res.data.data.dishes.length; i++)
                res.data.data.dishes[i].count = 0;

              this.setState(res.data.data);

              axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.state.current_plan.id + '/stop').then(res => {
                if(res.data.success){
                  this.setState({stops: res.data.data.stops})

                  res.data.data.stops.forEach(stop => {
                    var currDishIndex = this.state.dishes.findIndex(d => d.type == stop.dish_type);
                    if(currDishIndex != -1)
                      this.state.dishes[currDishIndex].count += stop.dish_amount;
                  });
                  this.setState(this.state.dishes);
                }
              });
            }
          });
        }
      }
    });
  }

  startRouteNavigation(){
    this.props.navigation.navigate("RouteNavigation", {routeId: this.state.route.id, planId: this.state.current_plan.id});
  }

  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });

    this.updateRoute();

    this.props.navigation.setOptions({
      headerRight: () => (
        <Button onPress={() => this.updateRoute()} title="Refresh" />
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
                      <Text style={styles.foodImageTextType}>{dish.count} ⨉ {{normal: 'Normal ret', alternative: 'Alternativ ret', 'sugar free': 'Sukkerfri ret'}[dish.type]}</Text>
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
                    <Text style={styles.stopTextAddress}>{stop.customer.address.formatted || "Ingen adresse"}</Text>
                    <View style={styles.hrLine}></View>
                    <Text style={styles.stopTextAddress}>{{normal: stop.dish_amount + ' ⨉ Normal ret', alternative: stop.dish_amount + ' ⨉ Alternativ ret', 'sugar free': stop.dish_amount + '⨉ Sukkerfri ret', null: 'Ingen ret'}[stop.dish_type]}</Text>
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