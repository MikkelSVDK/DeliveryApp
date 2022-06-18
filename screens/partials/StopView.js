import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default class StopView extends React.Component {
  render(){
    return (
      <View style={styles.stopView}>
        {/*<View style={[styles.badge, { backgroundColor: this.props.stop.delivered ? '#28a745' : '#dc3545' }]}>
          <Text style={styles.badgeText}>{this.props.stop.delivered ? 'Leveret' : 'Ikke Leveret'}</Text>
        </View>*/}
        <Text style={styles.stopTextName}>
          {this.props.index + 1}. {this.props.stop.customer.name} &nbsp;
          {this.props.stop.customer.diabetes && <View style={styles.badge}><Text style={styles.badgeText}>Sukkersyg</Text></View>}
        </Text>
        <Text style={styles.stopTextAddress}>
          {this.props.stop.customer.primary_address.formatted || "Ingen adresse"}
        </Text>
        <View style={styles.hrLine}></View>
        <Text style={styles.stopTextAddress}>
          {this.props.stop.dish != null ? 
            {normal: this.props.stop.dish.amount + ' ⨉ Normal ret', alternative: this.props.stop.dish.amount + ' ⨉ Alternativ ret'}[this.props.stop.dish.type] 
          : 
            'Ingen ret'
          }
        </Text>
        <Text style={styles.stopTextAddress}>
          {this.props.stop.sandwiches.amount != 0 ? 
            this.props.stop.sandwiches.amount + ' ⨉ Smørrebrød' 
          : 
            'Ingen smørrebrød'
          } 
          &nbsp;
          {this.props.stop.sandwiches.special && <View style={styles.badge}><Text style={styles.badgeText}>Special</Text></View>}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  stopView: {
    backgroundColor: '#fff',
    flex: 1,
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
  hrLine:{
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 5
  },
  badge: {
    backgroundColor: '#0f94d1',
    padding: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center'
  }
});