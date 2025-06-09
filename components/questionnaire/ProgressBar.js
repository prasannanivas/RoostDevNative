import React from "react";
import { View, StyleSheet } from "react-native";

const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#23231A",
  gray: "#666666",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const ProgressBar = ({ progress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  background: {
    height: 3, // Make it thinner
    backgroundColor: COLORS.background, // Use design system background color
    borderRadius: 1.5,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 1.5,
  },
});

export default ProgressBar;
