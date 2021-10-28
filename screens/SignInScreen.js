import React from 'react';
import { Keyboard, SafeAreaView, StyleSheet, Text, TextInput, Button, ScrollView } from 'react-native';
import FlashMessage, { showMessage } from "react-native-flash-message";
import Constants from 'expo-constants';
const statusBarHeight = Constants.statusBarHeight

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default class SignIn extends React.Component {
  setFocus(input, bool){
    return this.setState((state) => {
      return {
        focus: {
          employee: input == 'employee' ? bool : state.focus.employee,
          password: input == 'password' ? bool : state.focus.password
        }
      }
    });
  }

  signIn(){
    Keyboard.dismiss();

    const params = new URLSearchParams();
    params.append('employee', this.state.employee)
    params.append('password', this.state.password)
    axios.post('https://api.delivery-ryslingefh.tk/v2/employee/signin', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(async res => {
      if(res.data.success){
        await SecureStore.setItemAsync('sessionToken', res.data.data.access_token);
        axios.defaults.headers.common['Authorization'] = "Bearer " + res.data.data.access_token;
        this.props.navigation.navigate('RouteList');
      }else
        showMessage({message: res.data.errors[0], type: "danger"})
    });
  }

  state = {
    focus: {
      employee: false,
      password: false
    },
    employee: '',
    password: ''
  }

  componentDidMount() {
    SecureStore.getItemAsync("sessionToken").then(token => {
      if(token != null)
        this.props.navigation.navigate('RouteList');
    });
  }

  render(){
    return (
      <SafeAreaView>
        <Text style={styles.topText}>Log ind</Text>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <TextInput onChangeText={(employee) => this.setState({employee})} onBlur={() => this.setFocus('employee', false)} onFocus={() => this.setFocus('employee', true)} style={[styles.input, this.state.focus.employee ? styles.inputFocus : styles.inputNotFocus]} placeholder="Email adresse eller mobilnummer" />
          <TextInput onChangeText={(password) => this.setState({password})} onBlur={() => this.setFocus('password', false)} onFocus={() => this.setFocus('password', true)} style={[styles.input, this.state.focus.password ? styles.inputFocus : styles.inputNotFocus]} secureTextEntry={true} placeholder="Adgangskode" />
          <Button title="Log ind" onPress={() => this.signIn()} />
        </ScrollView>
        <FlashMessage position="top" />
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
  input: {
    height: 40,
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 30,
  },
  inputFocus: {
    borderColor: '#0f94d1',
  },
  inputNotFocus: {
    borderColor: '#bbb',
  }
});