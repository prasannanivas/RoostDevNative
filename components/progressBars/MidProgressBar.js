import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A Progress Bar with customizable progress and text
 *
 * @param {Object} props - Component props
 * @param {string} props.text - Text to display inside the progress bar
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {Object} props.style - Additional styles for the container
 */
const MidProgressBar = ({ text = "SUBMITTED", progress = 62, style = {} }) => {
  const COLORS = {
    green: "#377473",
    orange: "#F0913A",
    background: "#F6F6F6",
    black: "#1D2327",
    white: "#FDFDFD",
  };

  // Ensure progress is within bounds
  const boundedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.background}>
        <View style={[styles.fill, { width: `${boundedProgress}%` }]} />
        <Text style={styles.barText}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  background: {
    height: 21,
    backgroundColor: "#F6F6F6",
    borderRadius: 10.5,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "rgba(55, 116, 115, 0.2)", // Green at 20% opacity
    borderRadius: 10.5,
  },
  barText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Futura",
    textAlign: "center",
    zIndex: 2,
  },
});

export default MidProgressBar;
