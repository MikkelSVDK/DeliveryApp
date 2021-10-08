import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, TouchableOpacity, RefreshControl, ScrollView, View } from 'react-native';
import { showMessage } from "react-native-flash-message";
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteList extends React.Component {
  signOut(){
    SecureStore.deleteItemAsync("sessionToken");
    this.props.navigation.navigate('SignIn');
    delete axios.defaults.headers.common['Authorization']
  }

  updateRoutes(){
    axios.get('https://ryslinge.mikkelsv.dk/v1/route').then(res => {
      if(res.data.success)
        this.setState({routes: res.data.data.routes})
      else
        showMessage({message: res.data.errors[0], type: "danger"})
      
      this.setState({refreshing: false})
    });
  }

  onRefresh(){
    this.setState({refreshing: true})
    
    this.updateRoutes()
  }

  viewRoute(route){
    this.props.navigation.navigate("RouteInfo", {routeId: route});
  }

  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
      
      this.updateRoutes();
    });
  }

  state = {
    refreshing: false,
    routes: []
  }

  render(){
    return (
      <SafeAreaView style={{ flex:1 }}>
        <TouchableOpacity onPress={() => this.onRefresh()} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
        <Text style={styles.topText}>Rute Liste</Text>
        <View style={styles.hrLine}></View>
        <ScrollView refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.onRefresh()} />} style={styles.container} keyboardShouldPersistTaps="handled">
          {this.state.routes.map(route => {
            return (
              <TouchableOpacity key={`route-{route.id}`} onPress={() => this.viewRoute(route.id)} style={styles.routeButton}>
                <Text style={styles.routeText}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={{padding: 10}}>
          <Button onPress={() => this.signOut()} title="Log ud" />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  refreshButton: {
    top: 55,
    right: 23,
    position: 'absolute',
    zIndex: 1
  },
  refreshButtonText: {
    fontSize: 18,
    color: '#0f94d1',
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
  routeButton: {
    marginBottom: 20,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  routeText: {
    fontSize: 25,
    textAlign: 'center'
  }
});