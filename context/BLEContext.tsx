import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type MockDevice = {
  id: string;
  name: string;
};

type BLEContextType = {
  devices: MockDevice[];
  connectedDevice: MockDevice | null;
  lastDevice: MockDevice | null;
  isDisconnected: boolean;
  isScanning: boolean;
  maxRetries: number;
  retryDelay: number;
  setMaxRetries: (n: number) => void;
  setRetryDelay: (ms: number) => void;
  startScan: () => void;
  stopScan: () => void;
  connectToDevice: (device: MockDevice) => Promise<MockDevice | null>;
  retryConnection: () => Promise<MockDevice | null>;
  readCharacteristic: (serviceUUID: string, charUUID: string) => Promise<string | null>;
  disconnectDevice: () => Promise<void>;
};

const BLEContext = createContext<BLEContextType | null>(null);

const STORAGE_KEYS = {
  MAX_RETRIES: 'ble_maxRetries',
  RETRY_DELAY: 'ble_retryDelay',
};


export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<MockDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<MockDevice | null>(null);
  const [lastDevice, setLastDevice] = useState<MockDevice | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [maxRetries, setMaxRetriesState] = useState<number>(3);
  const [retryDelay, setRetryDelayState] = useState<number>(3000);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      try {
        const savedRetries = await AsyncStorage.getItem(STORAGE_KEYS.MAX_RETRIES);
        const savedDelay = await AsyncStorage.getItem(STORAGE_KEYS.RETRY_DELAY);

        if (savedRetries) setMaxRetriesState(Number(savedRetries));
        if (savedDelay) setRetryDelayState(Number(savedDelay));
      } catch (e) {
        console.error("Failed to load BLE settings", e);
      }
    })();
  }, []);

  // Save settings when changed
  const setMaxRetries = (n: number) => {
    setMaxRetriesState(n);
    AsyncStorage.setItem(STORAGE_KEYS.MAX_RETRIES, String(n)).catch(err =>
      console.error("Save maxRetries failed", err)
    );
  };

  const setRetryDelay = (ms: number) => {
    setRetryDelayState(ms);
    AsyncStorage.setItem(STORAGE_KEYS.RETRY_DELAY, String(ms)).catch(err =>
      console.error("Save retryDelay failed", err)
    );
  };

  // --- Fake scanner ---
  const startScan = () => {
    console.log("Mock scanning started...");
    setIsScanning(true);
    setDevices([]); // clear previous devices

    setTimeout(() => {
      setDevices([
        { id: "1", name: "Machine-Alpha" },
        { id: "2", name: "Machine-Beta" },
        { id: "3", name: "Machine-Gamma" },
        { id: "4", name: "Endo Cutter" },
      ]);
      setIsScanning(false);
    }, 1500); // fake delay
  };

  const stopScan = () => {
    console.log("Mock scanning stopped.");
    setIsScanning(false);
  };

  // --- Fake connect ---
  const connectToDevice = async (device: MockDevice) => {
    console.log(`Mock connecting to ${device.name}...`);
    return new Promise<MockDevice>((resolve) => {
      setTimeout(() => {
        setConnectedDevice(device);
        setLastDevice(device);
        setIsDisconnected(false);
        console.log(`Connected to ${device.name}`);
        resolve(device);
      }, 1000);
    });
  };

  const disconnectDevice = async () => {
    console.log("Mock disconnecting device...");
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setConnectedDevice(null);
        setIsDisconnected(false);
        resolve();
      }, 500);
    });
  };

  const retryConnection = async () => {
    if (!lastDevice) return null;
    return connectToDevice(lastDevice);
  };

  const attemptReconnect = useCallback(async () => {
    if (!lastDevice) {
      setIsDisconnected(true);
      return;
    }

    for (let i = 0; i < maxRetries; i++) {
      console.log(`Mock reconnect attempt ${i + 1}/${maxRetries}`);
      await new Promise((res) => setTimeout(res, retryDelay));

      if (Math.random() > 0.5) {
        setConnectedDevice(lastDevice);
        setIsDisconnected(false);
        console.log("Mock auto-reconnect success");
        return;
      }
    }

    console.log("Mock auto-reconnect failed");
    setIsDisconnected(true);
  }, [lastDevice, maxRetries, retryDelay]);

  const readCharacteristic = async (serviceUUID: string, charUUID: string) => {
    console.log(`Mock read from service ${serviceUUID}, char ${charUUID}`);
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const parts = ["Motor", "Pump", "Valve", "Gearbox"];
        const endoCutterParts = [
          "anvil_jaw",
          "anvil_release_button",
          "articulation_field_rotating_knob",
          "articulation_joint",
          "reload_alignment_slot",
          "reload_cartridge_jaw"
        ];
        const randomPart = connectedDevice?.name === 'Endo Cutter'
          ? endoCutterParts[Math.floor(Math.random() * endoCutterParts.length)]
          : parts[Math.floor(Math.random() * parts.length)];
        resolve(randomPart);
      }, 500);
    });
  };

  // --- Simulate random disconnects ---
  useEffect(() => {
    if (!connectedDevice) return;

    const timer = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance every 10s
        console.log("Mock random disconnect");
        setConnectedDevice(null);
        attemptReconnect();
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [connectedDevice, attemptReconnect]);

  return (
    <BLEContext.Provider
      value={{
        devices,
        connectedDevice,
        lastDevice,
        isDisconnected,
        isScanning,
        maxRetries,
        retryDelay,
        setMaxRetries,
        setRetryDelay,
        startScan,
        stopScan,
        connectToDevice,
        retryConnection,
        readCharacteristic,
        disconnectDevice,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};

export const useBLE = () => {
  const ctx = useContext(BLEContext);
  if (!ctx) throw new Error("useBLE must be used within BLEProvider");
  return ctx;
};
