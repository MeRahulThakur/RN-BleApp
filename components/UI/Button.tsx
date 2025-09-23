import { PropsWithChildren } from 'react';
import { ColorSchemeName, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
  onPress: () => void
}

function Button({ children, onPress }: PropsWithChildren<ButtonProps>) {
  const {colorScheme} = useTheme()
  const styles = getStyles(colorScheme)
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View>
        <Text style={styles.buttonText}>{children}</Text>
      </View>
    </Pressable>
  );
}

export default Button;

const getStyles = (colorScheme: ColorSchemeName) => {
  return StyleSheet.create({
    button: {
      borderRadius: 10,
      paddingVertical: 15,
      paddingHorizontal: 12,
      backgroundColor: Colors[colorScheme?? 'light'].primary500,
      elevation: 2,
      shadowColor: 'black',
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    pressed: {
      opacity: 0.7,
    },
    buttonText: {
      textAlign: 'center',
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold'
    },
  });
}