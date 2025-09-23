import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export type MachinePart =
  | "anvil_jaw"
  | "anvil_release_button"
  | "articulation_field_rotating_knob"
  | "articulation_joint"
  | "reload_alignment_slot"
  | "reload_cartridge_jaw";

type MachineImagesProps = {
  activePart?: MachinePart | MachinePart[] | null;
};

const partImages: Record<MachinePart, any> = {
  anvil_jaw: require("../../assets/images/endo-cutter/anvil_jaw.png"),
  anvil_release_button: require("../../assets/images/endo-cutter/anvil_release_button.png"),
  articulation_field_rotating_knob: require("../../assets/images/endo-cutter/articulation_field_rotating_knob.png"),
  articulation_joint: require("../../assets/images/endo-cutter/articulation_joint.png"),
  reload_alignment_slot: require("../../assets/images/endo-cutter/reload_alignment_slot.png"),
  reload_cartridge_jaw: require("../../assets/images/endo-cutter/reload_cartridge_jaw.png"),
};

export default function MachineImages({ activePart }: MachineImagesProps) {
  const activeParts = Array.isArray(activePart)
    ? activePart
    : activePart
      ? [activePart]
      : [];

  const validParts = activeParts.filter((part) => part in partImages);

  if (validParts.length === 0) {
    return (
      <View style={[styles.container, styles.fallback]}>
        <Text style={styles.fallbackText}>No part selected</Text>
      </View>
    );
  }

  // Multiple parts → stacked vertically
  if (validParts.length > 1) {
    return (
      <View style={[styles.container, styles.stackContainer]}>
        {validParts.map((part) => (
          <Image
            key={part}
            source={partImages[part]}
            style={styles.stackedImage}
            resizeMode="contain"
          />
        ))}
      </View>
    );
  }

  // Single part → overlay all but highlight selected
  return (
    <View style={styles.container}>
      {Object.entries(partImages).map(([key, source]) => (
        <Image
          key={key}
          source={source}
          style={[
            styles.overlayImage,
            validParts.includes(key as MachinePart)
              ? styles.active
              : styles.inactive,
          ]}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    minHeight: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  // Overlay case
  overlayImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  active: {
    opacity: 1,
  },
  inactive: {
    opacity: 0.2,
  },
  // Stacked case
  stackContainer: {
    flexDirection: "column",
  },
  stackedImage: {
    width: 200,
    height: 100,
    marginVertical: 8,
  },
  fallback: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  fallbackText: {
    fontSize: 16,
    color: "#555",
  },
});
