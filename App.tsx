import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar, TouchableOpacity } from 'react-native';
import { Colors } from './constants/colors';
import { BLEProvider } from './context/BLEContext';
import ThemeProvider, { useTheme } from './hooks/useTheme';
import Disconnect from './screens/Disconnect';
import Monitor from './screens/Monitor';
import Scan from './screens/Scan';
import Settings from './screens/Settings';

const Stack = createNativeStackNavigator();

function OpenAuthStack() {
  const { colorScheme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].primary500 },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: Colors.common.white },
      }}
    >
      <Stack.Screen
        name="Scan"
        component={Scan}
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="Monitor"
        component={Monitor}
        options={({ navigation }) => ({
          headerShown: true,
          title: "Monitor",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={{ marginRight: 5 }}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Disconnect"
        component={Disconnect}
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

function Navigation() {
  return (
    <NavigationContainer>
      <OpenAuthStack />
    </NavigationContainer>
  );
}

function Root() {
  useEffect(() => {
    SplashScreen.hide();
  }, [])

  return (
    <BLEProvider>
      <Navigation />
    </BLEProvider>
  )
}

export default function App() {
  return (
    <>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
      <StatusBar barStyle="default" />
    </>
  )
}