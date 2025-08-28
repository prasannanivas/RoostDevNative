import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A Progress Bar with 100% progress (complete - green)
 */
const SuccessProgressBar = () => {
  const COLORS = {
    green: "#377473",
    orange: "#F0913A",
    background: "#F6F6F6",
    black: "#1D2327",
    white: "#FDFDFD",
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={[styles.fill]} />
        <Text style={styles.barText}>FINISHED</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  background: {
    height: 21,
    backgroundColor: "#377473", // Green for success
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
    width: "100%",
    backgroundColor: "#377473", // Green for success
    borderRadius: 10.5,
  },
  barText: {
    color: "#FDFDFD", // White color for text
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Futura",
    textAlign: "center",
    zIndex: 2,
  },
});

export default SuccessProgressBar;
