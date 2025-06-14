import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A Progress Bar with empty/minimal progress (first step)
 * @param {Object} props - Component props
 * @param {string} props.text - Text to display inside the progress bar (defaults to "LIVING")
 * @param {number} props.progress - Progress percentage (defaults to 10%)
 * @param {Object} props.style - Additional styles for container
 */
const EmptyProgressBar = ({ text = "LIVING", progress = 10, style = {} }) => {
  const COLORS = {
    green: "#377473",
    orange: "#F0913A",
    background: "#F6F6F6",
    black: "#1D2327",
    white: "#FDFDFD",
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.background}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
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
    backgroundColor: "rgba(240, 145, 58, 0.2)",
    borderRadius: 10.5,
  },
  barText: {
    color: "#1D2327",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Futura",
    textAlign: "center",
    zIndex: 2,
  },
});

export default EmptyProgressBar;
