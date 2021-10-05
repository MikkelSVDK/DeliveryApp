import React from 'react';
import { StyleSheet, Text, Button, TouchableOpacity, View, ScrollView } from 'react-native';
import { showMessage } from "react-native-flash-message";

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
            if(res.data.success)
              this.setState(res.data.data)
          });

          axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.state.current_plan.id + '/stop').then(res => {
            if(res.data.success)
              this.setState({totalStops: res.data.data.meta.pagination.total})
          });
        }
      }
    });
  }

  startRouteNavigation(route, plan){
    this.props.navigation.navigate("RouteNavigation", {routeId: route, planId: plan});
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
    dishes: null,
    totalStops: null
  }

  render(){
    if(this.state.current_plan != null){
      return (
        <ScrollView style={styles.container}>
          <Text>Der er en plan</Text>
          <Button title="Get State" onPress={() => console.log(this.state)} />
        </ScrollView>
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
  }
});