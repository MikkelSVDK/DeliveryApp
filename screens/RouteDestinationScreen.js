import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class RouteDestination extends React.Component {
  onRefresh(){
    axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.props.route.params.planId + '/stop/' + this.props.route.params.stopId).then(res => {
      if(res.data.success){
        this.setState({stop: res.data.data});

        axios.get('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.props.route.params.planId + '/dish').then(res => {
          if(res.data.success){
            let selectedDish = res.data.data.dishes.find(d => d.type == this.state.stop.dish_type)
            this.setState({'selectedDish': selectedDish});
          }
        });
      }
    });
  }

  foodDelivered(){
    axios.put('https://ryslinge.mikkelsv.dk/v1/route/' + this.props.route.params.routeId + '/plan/' + this.props.route.params.planId + '/stop/' + this.props.route.params.stopId + '/delivered').then(res => {
      if(res.data.success)
        this.props.navigation.navigate("RouteNavigation", {routeId: this.props.route.params.routeId, planId: this.props.route.params.planId});
    });
  }

  componentDidMount(){
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
      
      this.onRefresh();
    });
  }

  state = {
    stop: {},
    selectedDish: {},
    dishToolTipVisible: false
  }

  render(){
    return (
      <SafeAreaView style={{ flex:1 }}>
        <TouchableOpacity onPress={() => this.onRefresh()} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
        <Text style={styles.topText}>Ankommet til</Text>
        <Text style={styles.address}>{Object.keys(this.state.stop).length > 0 ? this.state.stop.customer.address.formatted : '...'}</Text>
        <View style={styles.hrLine}></View>
        <View style={{maxHeight:288}}>
          <ScrollView style={[styles.container, {flexGrow:0}]} keyboardShouldPersistTaps="handled">
            <Tooltip topAdjustment={Platform.OS === "android" ? -24 : 0} isVisible={this.state.dishToolTipVisible} content={<Text>{this.state.stop.comment || 'Ingen kommentar'}</Text>} placement="top" onClose={() => this.setState({ dishToolTipVisible: false })} >
              {this.state.stop.comment != null ? <TouchableOpacity onPress={() => this.setState({ dishToolTipVisible: true })} style={styles.stopView}>
                <Text style={styles.stopTextName}>{Object.keys(this.state.stop).length > 0 ? this.state.stop.customer.name : '...'}</Text>
                <View style={styles.hrLine}></View>
                <Text style={styles.stopTextAddress}>{{normal: this.state.stop.dish_amount + ' ⨉ Normal ret', alternative: this.state.stop.dish_amount + ' ⨉ Alternativ ret', 'sugar free': this.state.stop.dish_amount + '⨉ Sukkerfri ret', null: 'Ingen ret'}[this.state.stop.dish_type]}</Text>
                <Text style={styles.stopTextAddress}>{this.state.stop.sandwiches != 0 ? this.state.stop.sandwiches + ' ⨉ Håndmadder' : 'Ingen håndmadder'}</Text>              <Ionicons style={{position: 'absolute', right: 10, top: 10}} name="information-circle-sharp" size={24} color="black" />
              </TouchableOpacity> : <View style={styles.stopView}>
                <Text style={styles.stopTextName}>{Object.keys(this.state.stop).length > 0 ? this.state.stop.customer.name : '...'}</Text>
                <View style={styles.hrLine}></View>
                <Text style={styles.stopTextAddress}>{{normal: this.state.stop.dish_amount + ' ⨉ Normal ret', alternative: this.state.stop.dish_amount + ' ⨉ Alternativ ret', 'sugar free': this.state.stop.dish_amount + '⨉ Sukkerfri ret', null: 'Ingen ret'}[this.state.stop.dish_type]}</Text>
                <Text style={styles.stopTextAddress}>{this.state.stop.sandwiches != 0 ? this.state.stop.sandwiches + ' ⨉ Håndmadder' : 'Ingen håndmadder'}</Text>
              </View>}
            </Tooltip>
            <View style={styles.hrLine}></View>
            <TextInput placeholder="Kommentar til leveringen..." style={styles.input} numberOfLines={4} onChangeText={text => this.setState({ comment: text })} value={this.state.comment} multiline />
          </ScrollView>
        </View>
        <View style={{padding: 15}}>
          <TouchableOpacity style={styles.startButton} onPress={() => this.foodDelivered()}>
            <Text style={styles.startButtonText}>Leveret</Text>
          </TouchableOpacity>
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
  }
});