import React from "react";
import { View, StyleSheet } from "react-native";

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
    paddingVertical: 6,
  },
  background: {
    height: 3, // Make it thinner
    backgroundColor: "#EEEEEE", // Lighter color for more subtle appearance
    borderRadius: 1.5,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#019B8E",
    borderRadius: 1.5,
  },
});

export default ProgressBar;
