// src/screens/DisconnectScreen.tsx
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import { useBLE } from '../context/BLEContext';

export default function DisconnectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { retryConnection } = useBLE();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    const device = await retryConnection();
    setLoading(false);

    if (device) {
      navigation.replace('Monitor');
    } else {
      alert('Reconnection failed. Please check your device.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, marginBottom: 16, color: 'red' }}>
        Device Disconnected
      </Text>
      <Text style={{ marginBottom: 24 }}>
        Please check your device and try reconnecting.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <>
          <Button title="Retry Connection" onPress={handleRetry} />
          <View style={{ marginTop: 12 }}>
            <Button
              title="Back to Scan"
              onPress={() => navigation.replace('Scan')}
            />
          </View>
        </>
      )}
    </View>
  );
}
