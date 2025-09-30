import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getRandomParts, mokedScannedDevices } from './mockData';

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
  subscribeToCharacteristic: (
    serviceUUID: string,
    charUUID: string,
    callback: (value: string) => void
  ) => (() => void) | null;
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

  const activeSubscriptions = useRef<Record<string, number>>({});

  // Load reconnect settings on mount
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

  // Save reconnect settings
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
  const startScan = useCallback(() => {
    console.log("Mock scanning started...");
    setIsScanning(true);
    setDevices([]); // clear previous devices

    setTimeout(() => {
      setDevices(mokedScannedDevices);
      setIsScanning(false);
    }, 2000); // fake delay
  }, []);

  const stopScan = useCallback(() => {
    console.log("Mock scanning stopped.");
    setIsScanning(false);
  }, []);

  // --- Fake connect ---
  const connectToDevice = useCallback(async (device: MockDevice) => {
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
  }, []);

  const disconnectDevice = useCallback(async () => {
    console.log("Mock disconnecting device...");
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Disconnected manually');
        setConnectedDevice(null);
        setIsDisconnected(true);
        resolve();
      }, 500);
    });
  }, []);

  // --- Retry connection logic ---
  const retryConnection = useCallback(async () => {
    if (!lastDevice) return null;

    for (let i = 0; i < maxRetries; i++) {
      console.log(`Retry attempt ${i + 1}/${maxRetries}`);
      await new Promise(res => setTimeout(res, retryDelay));

      // mock 50% chance to succeed
      if (Math.random() > 0.5) {
        console.log("Reconnected successfully");
        setConnectedDevice(lastDevice);
        setIsDisconnected(false);
        console.log("Mock auto-reconnect success");
        return lastDevice;
      }
    }

    console.log("Auto-reconnect failed");
    setIsDisconnected(true);
    return null;
  }, [lastDevice, maxRetries, retryDelay]);

  // --- Mock read ---
  const readCharacteristic = useCallback(
    async (serviceUUID: string, charUUID: string) => {
      console.log(`Mock read from service ${serviceUUID}, char ${charUUID}`);
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          const randomPart = getRandomParts(connectedDevice?.name as string)
          resolve(randomPart);
        }, 500);
      });
    },
    []
  );

  // --- Mock subscription ---
  const subscribeToCharacteristic = useCallback(
    (
      serviceUUID: string,
      charUUID: string,
      callback: (value: string) => void
    ): (() => void) | null => {
      if (!connectedDevice) {
        console.warn("No device connected for subscription");
        return null;
      }

      const key = `${serviceUUID}-${charUUID}`;

      if (activeSubscriptions.current[key] != null) {
        return () => { };
      }

      //let counter = 0;
      const intervalId = setInterval(() => {
        //counter++;
        //callback(`mock-value-${counter}`);
        callback(getRandomParts(connectedDevice?.name as string))
      }, 3000);

      activeSubscriptions.current[key] = intervalId as unknown as number;

      return () => {
        const id = activeSubscriptions.current[key];
        if (id != null) {
          clearInterval(id);
          delete activeSubscriptions.current[key];
        }
      };
    },
    [connectedDevice]
  );

  // --- Simulate random disconnects + auto-reconnect ---
  useEffect(() => {
    if (!connectedDevice) return;

    const timer = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance every 10s
        console.log("Mock random disconnect occurred");
        setConnectedDevice(null);
        setIsDisconnected(true);
        retryConnection();
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [connectedDevice, retryConnection]);

  // --- Cleanup all subscriptions on unmount ---
  useEffect(() => {
    return () => {
      Object.values(activeSubscriptions.current).forEach((id) => clearInterval(id));
      activeSubscriptions.current = {};
    };
  }, []);

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
        subscribeToCharacteristic,
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
