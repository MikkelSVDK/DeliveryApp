import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FlashMessage from "react-native-flash-message";

import SignInScreen from './screens/SignInScreen';
import RouteListScreen from './screens/RouteListScreen';
import RouteInfoScreen from './screens/RouteInfoScreen';

const Stack = createNativeStackNavigator();

export default class App extends React.Component {
  initialRoute(){
    return "SignIn";
  }

  render(){
    return (
      <NavigationContainer>
        <StatusBar style="auto" />
        <FlashMessage position="top" />
        <Stack.Navigator initialRouteName={this.initialRoute()}>
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RouteList" component={RouteListScreen} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="RouteInfo" component={RouteInfoScreen} />
          <Stack.Screen name="RouteNavigation" component={RouteInfoScreen} options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}