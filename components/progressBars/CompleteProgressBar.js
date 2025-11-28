import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A Progress Bar with 100% progress (complete - blue)
 */
const CompleteProgressBar = ({ text, points, date }) => {
  const COLORS = {
    green: "#377473",
    orange: "#F0913A4D",
    background: "#F6F6F6",
    black: "#1D2327",
    blue: "#2271B1",
    white: "#FDFDFD",
  };

  // Format points to round numbers if it exists
  const formattedPoints = points
    ? Math.round(parseFloat(points)).toString().replace(/\.0+$/, "")
    : null;

  // If text is "COMPLETED", only show points and date
  if (text === "COMPLETED") {
    return (
      <View style={[styles.container, { paddingVertical: 4 }]}>
        <Text style={[styles.barText, { marginLeft: 0 }]}>
          {date || ""}
          {formattedPoints && date ? " - " : ""}
          {formattedPoints ? `${formattedPoints} PTS` : ""}
        </Text>
      </View>
    );
  }

  // For other text, show the progress bar
  // Use orange for "Share Documents", green for others
  const barColor = text === "Share Documents" ? COLORS.orange : COLORS.green;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.progressBar,
          {
            backgroundColor: barColor,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={styles.barText}>{`${
        text === "Share Documents" ? "Submit documents" : text
      }${formattedPoints ? ` - ${formattedPoints} PTS` : ""}${
        date ? ` - ${date}` : ""
      }`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  progressBar: {
    width: 100,
    height: 10,
    //  backgroundColor: "#2271B1", // Blue for completed
    borderRadius: 10.5,
    overflow: "hidden",
    position: "relative",
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
    color: "#797979", // White color for text
    fontSize: 10,
    fontWeight: "500",
    fontFamily: "Futura",
    marginLeft: 8,
  },
});

export default CompleteProgressBar;
