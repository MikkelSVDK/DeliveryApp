import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default class RouteButton extends React.Component {
  viewRoute(id){
    this.props.navigation.navigate("RouteInfo", {routeId: id});
  }

  render(){
    return (
      <TouchableOpacity onPress={() => this.viewRoute(this.props.route.id)} style={styles.routeButton}>
        <Text style={styles.routeText}>
          {this.props.route.name}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
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