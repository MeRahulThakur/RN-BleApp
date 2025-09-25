// src/screens/SettingsScreen.tsx
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useBLE } from '../context/BLEContext';

export default function Settings() {
  const { maxRetries, retryDelay, setMaxRetries, setRetryDelay } = useBLE();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [retries, setRetries] = useState(String(maxRetries));
  const [delay, setDelay] = useState(String(retryDelay));

  const saveSettings = () => {
    const retriesNum = parseInt(retries, 10);
    const delayNum = parseInt(delay, 10);

    if (!isNaN(retriesNum)) setMaxRetries(retriesNum);
    if (!isNaN(delayNum)) setRetryDelay(delayNum);
    // success feedback
    Alert.alert("Success", "Settings saved successfully!");

    // small delay before navigating back
    setTimeout(() => {
      navigation.goBack(); // or navigation.navigate("Monitor")
    }, 800);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Settings</Text>

      <Text>Max Auto-Reconnect Attempts:</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          marginVertical: 10,
          padding: 8,
          borderRadius: 6,
        }}
        keyboardType="numeric"
        value={retries}
        onChangeText={setRetries}
      />

      <Text>Retry Delay (ms):</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          marginVertical: 10,
          padding: 8,
          borderRadius: 6,
        }}
        keyboardType="numeric"
        value={delay}
        onChangeText={setDelay}
      />

      <Button title="Save" onPress={saveSettings} />
    </View>
  );
}
