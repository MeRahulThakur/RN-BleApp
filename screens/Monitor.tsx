import MachineImage from '@/components/Machine/MachineImage';
import MachineImages, { MachinePart } from '@/components/Machine/MachineImages';
import Button from '@/components/UI/Button';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useBLE } from '../context/BLEContext';

export default function Monitor() {
  const { connectedDevice, subscribeToCharacteristic, isDisconnected, disconnectDevice } = useBLE();
  const [activePart, setActivePart] = useState<string | MachinePart | MachinePart[]>('');
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  useEffect(() => {
    if (isDisconnected) {
      navigation.replace('Disconnect');
    }
  }, [isDisconnected, navigation]);

  //Polling every 2 secs
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     const value = await readCharacteristic('service-uuid', 'char-uuid');
  //     if (value) {
  //       //const decoded = atob(value);
  //       const decoded = value;
  //       setActivePart(decoded);
  //     }
  //   }, 2000);

  //   return () => clearInterval(interval);
  // }, [connectedDevice, readCharacteristic]);

  //Notification
  useEffect(() => {
    if (!connectedDevice) return;

    const unsubscribe = subscribeToCharacteristic(
      "service-uuid",
      "char-uuid",
      onDataNotification
    );

    return () => unsubscribe?.();
  }, [connectedDevice]);

  const onDataNotification = (value: string) => {
    setActivePart(value)
  }

  const handleSwitchDevice = async () => {
    await disconnectDevice();
    navigation.replace("Scan");
  };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>
        Connected to: {connectedDevice?.name}
      </Text>
      <Text style={{ marginTop: 16, fontSize: 20 }}>
        Active Part: {activePart || 'Waiting...'}
      </Text>

      {'Endo Cutter' === connectedDevice?.name ? <MachineImages activePart={activePart as MachinePart | MachinePart[]} /> : <MachineImage activePart={activePart as string} />}

      <Button onPress={handleSwitchDevice}>Switch Device</Button>
    </ScrollView>
  );
}
