import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, TouchableOpacity, ScrollView } from 'react-native';
import { showMessage } from "react-native-flash-message";
import { WebView } from 'react-native-webview';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteList extends React.Component {
  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });

    axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.props.route.params.planId + '/stop').then(res => {
      if(res.data.success)
        this.setState(res.data.data.meta, res.data.data.stops)
    });
  }

  state = {
    stops: {},
    meta: null,
  }

  render(){
    return (
      <SafeAreaView style={{ flex:1 }}>
        
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
  }
});