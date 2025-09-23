import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// Define the theme context
interface ThemeContextType {
  colorScheme: ColorSchemeName;
  toggleColorScheme: () => void;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  toggleColorScheme: () => {},
});

// Define the custom hook
export const useTheme = () => useContext(ThemeContext);

// Create the theme provider component
export default function ThemeProvider({ children }: PropsWithChildren) {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() || 'light');

  // Listen to the device's color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Toggle between light and dark mode
  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};