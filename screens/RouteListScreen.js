import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, TouchableOpacity, RefreshControl, ScrollView, View, BackHandler } from 'react-native';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import RouteButton from './partials/RouteButton';

export default class RouteList extends React.Component {
  // Handle signout
  signOut(){
    SecureStore.deleteItemAsync("sessionToken");
    delete axios.defaults.headers.common['Authorization']
    this.props.navigation.navigate('SignIn');
  }

  // Get available routes
  updateRoutes(){
    axios.get('https://api.delivery-ryslingefh.tk/v2/route').then(res => {
      if(res.data.success)
        this.setState({routes: res.data.data.routes})
      else{
        if(res.data.errors[0] == "invalid access token" || res.data.errors[0] == "access token expired")
          this.signOut();
      }
      
      this.setState({refreshing: false})
    });
  }

  // Refresh function
  onRefresh(){
    this.setState({refreshing: true})
    
    this.updateRoutes()
  }

  // Callback for BackHandler event listener
  handleBackButton() {
    return true;
  }

  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
      
      this.updateRoutes();
    });

    const navigationFocusListener = this.props.navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
    });

    const navigationUnFocusListener = this.props.navigation.addListener('blur', () => {
      BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    });
  }

  state = {
    refreshing: false,
    routes: []
  }

  render(){
    return (
      <SafeAreaView style={{ flex:1 }}>
        <Text style={styles.topText}>Rute Liste</Text>
        <View style={styles.hrLine}></View>
        <ScrollView refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.onRefresh()} />} style={styles.container} keyboardShouldPersistTaps="handled">
          {this.state.routes.map(route =>  (
            <RouteButton navigation={this.props.navigation} route={route} key={route.id} />
          ))}
        </ScrollView>
        <Button title="Log ud" onPress={() => this.signOut()} />
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
  }
});