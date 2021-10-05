import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteList extends React.Component {
  signOut(){
    SecureStore.deleteItemAsync("sessionToken");
    this.props.navigation.navigate('SignIn');
    delete axios.defaults.headers.common['Authorization']
  }

  updateRoutes(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null){
        axios.get('http://172.16.5.15/routes', {
          headers: {
            'Authorization': "Bearer " + token
          }
        }).then(res => {
          if(res.data.success)
            this.setState({routes: res.data.data.routes})
        });
      }
    });
  }

  viewRoute(id){
    this.props.navigation.navigate("RouteInfo", {routeId: id});
  }

  componentDidMount(){
    this.updateRoutes();
  }

  state = {
    routes: []
  }

  render(){
    return (
      <SafeAreaView style={{ flex:1 }}>
        <TouchableOpacity onPress={() => this.updateRoutes()} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
        <Text style={styles.topText}>Rute Liste</Text>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          {this.state.routes.map(route => {
            return (
              <TouchableOpacity key={route.id} onPress={() => this.viewRoute(route.id)} style={styles.routeButton}>
                <Text style={styles.routeText}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Button onPress={() => this.signOut()} title="Log ud" />
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
  refreshButton: {
    marginTop: 60,
    marginLeft: 20,
    position: 'absolute',
    zIndex: 1
  },
  refreshButtonText: {
    fontSize: 18,
    color: '#0f94d1',
    textDecorationLine: 'underline'
  },
  topText: {
    fontSize: 25,
    marginBottom: 0,
    marginTop: 10,
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