import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BleManager, Characteristic, Device, Subscription } from 'react-native-ble-plx';

type BLEContextType = {
  devices: Device[];
  connectedDevice: Device | null;
  lastDevice: Device | null;
  isDisconnected: boolean;
  isScanning: boolean;
  maxRetries: number;
  retryDelay: number;
  setMaxRetries: (n: number) => void;
  setRetryDelay: (ms: number) => void;
  startScan: () => void;
  stopScan: () => void;
  connectToDevice: (device: Device) => Promise<Device | null>;
  retryConnection: () => Promise<Device | null>;
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

const manager = new BleManager();

export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [lastDevice, setLastDevice] = useState<Device | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [maxRetries, setMaxRetriesState] = useState<number>(3);
  const [retryDelay, setRetryDelayState] = useState<number>(3000);

  const activeSubscriptions = useRef<Record<string, Subscription>>({});

  // --- Cleanup Subscriptions ---
  const cleanupSubscriptions = useCallback(() => {
    Object.values(activeSubscriptions.current).forEach((sub) => sub.remove());
    activeSubscriptions.current = {};
  }, []);

  // Load retry settings from storage
  useEffect(() => {
    (async () => {
      try {
        const savedRetries = await AsyncStorage.getItem(STORAGE_KEYS.MAX_RETRIES);
        const savedDelay = await AsyncStorage.getItem(STORAGE_KEYS.RETRY_DELAY);
        if (savedRetries) setMaxRetriesState(Number(savedRetries));
        if (savedDelay) setRetryDelayState(Number(savedDelay));
      } catch (e) {
        console.error('Failed to load BLE settings', e);
      }
    })();
  }, []);

  // Save settings to storage
  const setMaxRetries = (n: number) => {
    setMaxRetriesState(n);
    AsyncStorage.setItem(STORAGE_KEYS.MAX_RETRIES, String(n)).catch((err) =>
      console.error('Save maxRetries failed', err)
    );
  };

  const setRetryDelay = (ms: number) => {
    setRetryDelayState(ms);
    AsyncStorage.setItem(STORAGE_KEYS.RETRY_DELAY, String(ms)).catch((err) =>
      console.error('Save retryDelay failed', err)
    );
  };

  // --- Scan for devices ---
  const startScan = useCallback(() => {
    setIsScanning(true);
    setDevices([]);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }
      if (device && device.name) {
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }
    });
  }, []);

  const stopScan = useCallback(() => {
    manager.stopDeviceScan();
    setIsScanning(false);
  }, []);

  // --- Connect ---
  const connectToDevice = useCallback(async (device: Device) => {
    try {
      const connected = await manager.connectToDevice(device.id, { timeout: 10000 });
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      setLastDevice(connected);
      setIsDisconnected(false);
      return connected;
    } catch (err) {
      console.error('Connect error:', err);
      return null;
    }
  }, []);

  const disconnectDevice = useCallback(async () => {
    if (connectedDevice) {
      try {
        cleanupSubscriptions();
        await manager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        setIsDisconnected(true);
      } catch (err) {
        console.error('Disconnect error:', err);
      }
    }
  }, [connectedDevice, cleanupSubscriptions]);

  // --- Retry connection ---
  const retryConnection = useCallback(async () => {
    if (!lastDevice) return null;

    for (let i = 0; i < maxRetries; i++) {
      console.log(`Reconnect attempt ${i + 1}/${maxRetries}`);
      await new Promise((res) => setTimeout(res, retryDelay));
      try {
        const connected = await manager.connectToDevice(lastDevice.id, { timeout: 10000 });
        await connected.discoverAllServicesAndCharacteristics();
        setConnectedDevice(connected);
        setIsDisconnected(false);
        return connected;
      } catch (e) {
        console.warn('Reconnect failed, retrying...');
      }
    }

    setIsDisconnected(true);
    return null;
  }, [lastDevice, maxRetries, retryDelay]);

  // --- Read characteristic ---
  const readCharacteristic = useCallback(
    async (serviceUUID: string, charUUID: string): Promise<string | null> => {
      if (!connectedDevice) return null;
      try {
        const char: Characteristic = await connectedDevice.readCharacteristicForService(
          serviceUUID,
          charUUID
        );
        if (char?.value) {
          return Buffer.from(char.value, 'base64').toString('utf-8');
        }
        return null;
      } catch (err) {
        console.error('Read error:', err);
        return null;
      }
    },
    [connectedDevice]
  );

  // --- Subscribe to characteristic ---
  const subscribeToCharacteristic = useCallback(
    (
      serviceUUID: string,
      charUUID: string,
      callback: (value: string) => void
    ): (() => void) | null => {
      if (!connectedDevice) return null;
      const key = `${serviceUUID}-${charUUID}`;

      if (activeSubscriptions.current[key]) {
        return () => {};
      }

      const sub = connectedDevice.monitorCharacteristicForService(
        serviceUUID,
        charUUID,
        (error, char) => {
          if (error) {
            console.error('Subscribe error:', error);
            return;
          }
          if (char?.value) {
            const decoded = Buffer.from(char.value, 'base64').toString('utf-8');
            callback(decoded);
          }
        }
      );

      activeSubscriptions.current[key] = sub;

      return () => {
        sub.remove();
        delete activeSubscriptions.current[key];
      };
    },
    [connectedDevice]
  );

  // --- Monitor disconnections ---
  useEffect(() => {
    if (!connectedDevice) return;

    const sub = manager.onDeviceDisconnected(connectedDevice.id, () => {
      console.warn('Device disconnected unexpectedly');
      setConnectedDevice(null);
      setIsDisconnected(true);
      retryConnection();
    });

    return () => {
      sub.remove();
    };
  }, [connectedDevice, retryConnection]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      console.debug('BLEProvider unmounted → cleaning up');
      cleanupSubscriptions();
      manager.destroy();
    };
  }, [cleanupSubscriptions]);

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
  if (!ctx) throw new Error('useBLE must be used within BLEProvider');
  return ctx;
};
