import Button from '@/components/UI/Button';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Scan = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const handleConnectPress = () => {
    navigation.navigate('Monitor')
  }

  return (
    <View>
      <Text>Scan</Text>
      <Button onPress={handleConnectPress}>Connect</Button>
    </View>
  )
}

export default Scan

const styles = StyleSheet.create({})