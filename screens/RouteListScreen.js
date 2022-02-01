import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, TouchableOpacity, RefreshControl, ScrollView, View, BackHandler } from 'react-native';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteList extends React.Component {
  signOut(){
    SecureStore.deleteItemAsync("sessionToken");
    delete axios.defaults.headers.common['Authorization']
    this.props.navigation.navigate('SignIn');
  }

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

  onRefresh(){
    this.setState({refreshing: true})
    
    this.updateRoutes()
  }

  viewRoute(route){
    this.props.navigation.navigate("RouteInfo", {routeId: route});
  }

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
          {this.state.routes.map(route => {
            return (
              <TouchableOpacity key={`route-${route.id}`} onPress={() => this.viewRoute(route.id)} style={styles.routeButton}>
                <Text style={styles.routeText}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
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