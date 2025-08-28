import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A Progress Bar with 100% progress (complete - blue)
 */
const CompleteProgressBar = ({ text, points, date }) => {
  const COLORS = {
    green: "#377473",
    orange: "#F0913A",
    background: "#F6F6F6",
    black: "#1D2327",
    blue: "#2271B1",
    white: "#FDFDFD",
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.background,
          {
            backgroundColor: text !== "COMPLETED" ? COLORS.orange : COLORS.blue,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor:
                text !== "COMPLETED" ? COLORS.orange : COLORS.blue,
            },
          ]}
        />
        <Text style={styles.barText}>{`${text} ${
          points ? ` - ${points} PTS` : ""
        }${date ? ` - ${date}` : ""}`}</Text>
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
    //  backgroundColor: "#2271B1", // Blue for completed
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
    //  backgroundColor: "#2271B1", // Blue for completed
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

export default CompleteProgressBar;
