import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignInScreen from './screens/SignInScreen';
import RouteListScreen from './screens/RouteListScreen';
import RouteInfoScreen from './screens/RouteInfoScreen';
import RouteNavigationScreen from './screens/RouteNavigationScreen';
import RouteNavigationSimpleScreen from './screens/RouteNavigationSimpleScreen';
import RouteDestinationScreen from './screens/RouteDestinationScreen';
import RouteCompletedScreen from './screens/RouteCompletedScreen';

const Stack = createNativeStackNavigator();

export default class App extends React.Component {
  initialRoute(){
    return "SignIn";
  }

  render(){
    return (
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName={this.initialRoute()}>
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RouteList" component={RouteListScreen} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="RouteInfo" component={RouteInfoScreen} />
          <Stack.Screen name="RouteNavigation" component={RouteNavigationScreen} />
          <Stack.Screen name="RouteNavigationSimple" component={RouteNavigationSimpleScreen} />
          <Stack.Screen name="RouteDestination" component={RouteDestinationScreen} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="RouteCompleted" component={RouteCompletedScreen} options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}