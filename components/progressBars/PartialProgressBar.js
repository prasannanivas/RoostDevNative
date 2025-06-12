import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A Progress Bar with 20% progress (second step)
 */
const PartialProgressBar = () => {
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
        <View style={[styles.fill, { width: "22%" }]} />
        <Text style={styles.barText}>SIGNING</Text>
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
    color: "#000000",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Futura",
    textAlign: "center",
    zIndex: 2,
  },
});

export default PartialProgressBar;
