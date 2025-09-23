import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Colors } from './constants/colors';
import { BLEProvider } from './context/BLEContext';
import ThemeProvider, { useTheme } from './hooks/useTheme';
import Disconnect from './screens/Disconnect';
import Monitor from './screens/Monitor';
import Scan from './screens/Scan';

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
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="Disconnect"
        component={Disconnect}
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