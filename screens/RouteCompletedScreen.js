import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

export default class RouteCompleted extends React.Component {
  render(){
    return (
      <SafeAreaView>
        <Text style={styles.topText}>Rute færdig</Text>
        <View style={styles.container}>
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