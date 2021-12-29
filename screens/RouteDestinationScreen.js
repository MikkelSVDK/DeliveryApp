import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, TextInput, BackHandler, ToastAndroid } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteDestination extends React.Component {
  /*updateRouteStop(){
    axios.get('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.routeId + '/' + this.props.route.params.planDate + '/stop/' + this.props.route.params.stopId).then(res => {
      if(res.data.success){
        this.setState({stop: res.data.data});

        this.setState({refreshing: false})
      }else{
        if(res.data.errors[0] == "invalid access token" || res.data.errors[0] == "access token expired")
          this.signOut();
      }
    });
  }*/

  foodDelivered(){
    axios.put('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.data.route.id + '/' + this.props.route.params.data.current_plan + '/stop/' + this.props.route.params.data.stops[this.props.route.params.currentStopIndex].id + '/delivered').then(res => {
      if(res.data.success){
        this.props.route.params.data.stops[this.props.route.params.currentStopIndex].delivered = true;
        this.props.navigation.goBack();
      }
    }).catch(e => {
      this.props.route.params.data.stops[this.props.route.params.currentStopIndex].delivered = true;
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

    // AAA
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
  }

  state = {
    dishToolTipVisible: false,
    refreshing: false
  }

  render(){
    return (
      <SafeAreaView style={{ flex:1 }}>
        <Text style={styles.topText}>Ankommet til</Text>
        <Text style={styles.address}>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].customer.primary_address.formatted}</Text>
        <View style={styles.hrLine}></View>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={{maxHeight:288}}>
            <View style={[styles.container, {flexGrow:0}]} keyboardShouldPersistTaps="handled">
              <Tooltip topAdjustment={Platform.OS === "android" ? -24 : 0} isVisible={this.state.dishToolTipVisible} content={<Text>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].comment || 'Ingen kommentar'}</Text>} placement="top" onClose={() => this.setState({ dishToolTipVisible: false })} >
                {this.props.route.params.data.stops[this.props.route.params.currentStopIndex].comment != null ? <TouchableOpacity onPress={() => this.setState({ dishToolTipVisible: true })} style={styles.stopView}>
                  <Text style={styles.stopTextName}>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].customer.name} {this.props.route.params.data.stops[this.props.route.params.currentStopIndex].customer.diabetes ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11 }}>Sukkersyg</Text></View>: null }</Text>
                  <View style={styles.hrLine}></View>
                  <Text style={styles.stopTextAddress}>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish != null ? {normal: this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish.amount + ' ⨉ Normal ret', alternative: this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish.amount + ' ⨉ Alternativ ret'}[this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish.type] : 'Ingen ret'}</Text>
                  <Text style={styles.stopTextAddress}>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].sandwiches.amount != 0 ? this.props.route.params.data.stops[this.props.route.params.currentStopIndex].sandwiches.amount + ' ⨉ Håndmadder' : 'Ingen håndmadder'} {this.props.route.params.data.stops[this.props.route.params.currentStopIndex].sandwiches.special ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11}}>Special af 18,-</Text></View>: null }</Text>
                  <Ionicons style={{position: 'absolute', right: 10, top: 10}} name="information-circle-sharp" size={24} color="black" />
                </TouchableOpacity> : <View style={styles.stopView}>
                  <Text style={styles.stopTextName}>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].customer.name} {this.props.route.params.data.stops[this.props.route.params.currentStopIndex].customer.diabetes ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11 }}>Sukkersyg</Text></View>: null }</Text>
                  <View style={styles.hrLine}></View>
                  <Text style={styles.stopTextAddress}>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish != null ? {normal: this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish.amount + ' ⨉ Normal ret', alternative: this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish.amount + ' ⨉ Alternativ ret'}[this.props.route.params.data.stops[this.props.route.params.currentStopIndex].dish.type] : 'Ingen ret'}</Text>
                  <Text style={styles.stopTextAddress}>{this.props.route.params.data.stops[this.props.route.params.currentStopIndex].sandwiches.amount != 0 ? this.props.route.params.data.stops[this.props.route.params.currentStopIndex].sandwiches.amount + ' ⨉ Håndmadder' : 'Ingen håndmadder'} {this.props.route.params.data.stops[this.props.route.params.currentStopIndex].sandwiches.special ? <View style={styles.badge}><Text style={{color: '#fff', fontSize: 11}}>Special af 18,-</Text></View>: null }</Text>
                </View>}
              </Tooltip>
              <View style={styles.hrLine}></View>
              <TextInput placeholder="Kommentar til leveringen..." style={styles.input} numberOfLines={4} onChangeText={text => this.setState({ comment: text })} value={this.state.comment} multiline />
            </View>
          </View>
          <View style={{padding: 15}}>
            <TouchableOpacity style={styles.startButton} onPress={() => this.foodDelivered()}>
              <Text style={styles.startButtonText}>Leveret</Text>
            </TouchableOpacity>
          </View>
    </ScrollView>
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
  address: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20
  },
  stopView: {
    backgroundColor: '#fff',
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
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    height: 100,
    borderColor: '#ccc'
  },
  startButton: {
    marginTop: -20,
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
  },
  badge: {
    backgroundColor: '#0f94d1',
    padding: 2
  }
});