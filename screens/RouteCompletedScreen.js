import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import axios from 'axios';

export default class RouteCompleted extends React.Component {
  componentDidMount(){
    const failedAPIStops = this.props.route.params.data.stops.filter(s => s.failedAPI == true);

    // If still no internet, display error
    failedAPIStops.forEach(stop => {
      axios.put('https://api.delivery-ryslingefh.tk/v2/route/' + this.props.route.params.data.route.id + '/' + this.props.route.params.data.current_plan + '/stop/' + stop.id + '/delivered').catch(e => {
        this.setState({
          errorMsg: `Der er ingen internet forbindelse - Vær obs på at alle leveringer ikke er blevet gemt`});
      });
      
      if(stop.comment){
        axios.put('https://api.delivery-ryslingefh.tk/v2/customer/' + stop.customer.id + '/plan/' + stop.id, {
          comment: stop.comment
        })
      }
    });
  }

  state = {
    errorMsg: ''
  }
  
  render(){
    return (
      <SafeAreaView>
        <Text style={styles.topText}>Rute færdig</Text>
        <View style={styles.container}>
          {this.state.errorMsg != '' && <View style={{position: 'absolute', width: '100%', top: 0}}>
            <View style={{backgroundColor: 'red', padding: 12}}>
              <Text style={{color: 'white', textAlign: 'center', fontSize: 18}}>{this.state.errorMsg}</Text>
            </View>
          </View>}
          <TouchableOpacity onPress={() => this.props.navigation.navigate("RouteList")} style={styles.routeButton}>
            <Text style={styles.routeText}>
              Gå tilbage
            </Text>
          </TouchableOpacity>
        </View>
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