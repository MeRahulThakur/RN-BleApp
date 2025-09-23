// src/components/MachineImage.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type MachineImageProps = {
  activePart: string | null;
};

export default function MachineImage({ activePart }: MachineImageProps) {
  return (
    <View style={styles.container}>
      <Svg height="300" width="300" viewBox="0 0 300 300">
        {/* Machine Body */}
        <Rect
          x="20"
          y="20"
          width="260"
          height="260"
          fill="#eee"
          stroke="#333"
          strokeWidth="2"
          rx="20"
        />

        {/* Motor */}
        <Circle
          cx="80"
          cy="80"
          r="30"
          fill={activePart === "Motor" ? "#ca001b" : "#aaa"}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Pump */}
        <Rect
          x="180"
          y="60"
          width="60"
          height="40"
          fill={activePart === "Pump" ? "#ca001b" : "#aaa"}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Valve */}
        <Path
          d="M 100 200 L 140 160 L 180 200 L 140 240 Z"
          fill={activePart === "Valve" ? "#ca001b" : "#aaa"}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Gearbox */}
        <Circle
          cx="220"
          cy="220"
          r="40"
          fill={activePart === "Gearbox" ? "#ca001b" : "#aaa"}
          stroke="#333"
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
});
