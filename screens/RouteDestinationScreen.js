import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, TextInput, BackHandler, ToastAndroid } from 'react-native';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import StopView from './partials/StopView';

export default class RouteDestination extends React.Component {
  foodDelivered(){
    this.props.route.params.data.stops[this.props.route.params.currentStopIndex].delivered = true;
    
    // Add comment if any was written
    if(this.state.comment){
      this.props.route.params.data.stops[this.props.route.params.currentStopIndex].comment += `
Leveringsnote: ` + this.state.comment;
    }
      
    const currentStop = this.props.route.params.data.stops[this.props.route.params.currentStopIndex];

    axios.put('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.data.route.id + '/' + this.props.route.params.data.current_plan + '/stop/' + currentStop.id + '/delivered').then(res => {
      if(res.data.success){
        // App has internet access and can save comment
        if(this.state.comment){
          axios.put('https://api.delivery-ryslingefh.tk/v2/customer/' + currentStop.customer.id + '/plan/' + currentStop.id, {
            comment: currentStop.comment + `
Leveringsnote: ` + this.state.comment
          })
        }

        this.props.navigation.goBack();
      }
    }).catch(e => {
      // App can't connect to the API - Try again when route is completed
      this.props.route.params.data.stops[this.props.route.params.currentStopIndex].failedAPI = true;
      
      this.props.navigation.goBack();
    });
  }

  handleBackButton() {
    ToastAndroid.show('Du kan ikke bruge tilbageknappen', ToastAndroid.SHORT);
    return true;
  }

  componentDidMount(){
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);

    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    });
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
  }

  state = {
    comment: ''
  }

  render(){
    const currentStop = this.props.route.params.data.stops[this.props.route.params.currentStopIndex];
    
    return (
      <SafeAreaView style={{ flex:1 }}>
        <Text style={styles.topText}>Ankommet til</Text>
        <Text style={styles.address}>{currentStop.customer.primary_address.formatted}</Text>
        <View style={styles.hrLine}></View>
        <View style={styles.container}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{currentStop.comment || 'Ingen kommentar'}</Text>
            </View>
            <StopView stop={currentStop} index={this.props.route.params.currentStopIndex} />
            <View style={styles.hrLine}></View>
            <TextInput placeholder="Kommentar til leveringen..." style={styles.input} numberOfLines={4} onChangeText={text => this.setState({ comment: text })} value={this.state.comment} multiline />

              <TouchableOpacity style={styles.deliveredButton} onPress={() => this.foodDelivered()}>
                <Text style={styles.deliveredButtonText}>Leveret</Text>
              </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    padding: 15,
    marginTop: -15
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
  address: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    height: 100,
    borderColor: '#ccc'
  },
  deliveredButton: {
    marginTop: 5,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  deliveredButtonText: {
    fontSize: 25,
    textAlign: 'center'
  },
  badge: {
    backgroundColor: '#0f94d1',
    padding: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center'
  }
});