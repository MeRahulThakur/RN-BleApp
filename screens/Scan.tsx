import Button from '@/components/UI/Button';
import { useBLE } from '@/context/BLEContext';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Scan = () => {
  const { devices, startScan, stopScan, connectToDevice, isScanning } = useBLE();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // Auto-start scan on mount
  useEffect(() => {
    startScan();
    return stopScan;
  }, [startScan, stopScan]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Devices</Text>
        <Button onPress={startScan}>
          Rescan
        </Button>
      </View>

      {isScanning && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loaderText}>Scanning...</Text>
        </View>
      )}

      {!isScanning && devices.length === 0 && (
        <Text style={styles.noDevices}>No devices found</Text>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceItem}
            onPress={async () => {
              const connected = await connectToDevice(item);
              if (connected) navigation.replace('Monitor');
            }}
          >
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
            <View style={styles.connectIndicator} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default Scan;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  rescanButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#007AFF', borderRadius: 6 },
  loader: { alignItems: 'center', marginVertical: 20 },
  loaderText: { marginTop: 8, fontSize: 14, color: '#555' },
  noDevices: { textAlign: 'center', marginVertical: 20, color: '#999' },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceInfo: {
    flexDirection: 'column',
  },
  deviceName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  deviceId: { fontSize: 12, color: 'gray' },
  connectIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
});
