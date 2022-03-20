import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';

export default class StopView extends React.Component {
  render(){
    return (
      <View style={styles.foodImageView}>
        <Image style={styles.foodImage} source={{uri: this.props.dish.image}} />
        <Text style={styles.foodImageTextName}>
          {this.props.dish.name}
        </Text>
        <Text style={styles.foodImageTextType}>
          {this.props.count} ⨉ {{normal: 'Normal ret', alternative: 'Alternativ ret'}[this.props.dish.type]}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  foodImage: {
    width: 85,
    height: 85,
    marginRight: 10
  },
  foodImageTextName: {
    top: 20,
    left: 95,
    position: 'absolute',
    fontSize: 20
  },
  foodImageTextType: {
    top: 45,
    left: 95,
    position: 'absolute',
    fontSize: 18
  },
  foodImageView: {
    backgroundColor: '#fff',
    flex: 1,
    marginVertical: 5,
  }
});