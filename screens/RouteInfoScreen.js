import React from 'react';
import { StyleSheet, Text, Button, TouchableOpacity, ScrollView } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteView extends React.Component {

  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });

    axios.get('http://172.16.5.15/routes/' + this.props.route.params.routeId).then(res => {
      if(res.data.success)
        this.setState({routes: res.data.data})
    });
  }

  render(){
    return (
      <ScrollView style={styles.container}>
        <Text>Hello, World!</Text>
        <Button title="Test" onPress={() => {console.log(this.state)}} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  }
});