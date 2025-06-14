import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A progress bar component with orange fill and percentage text inside
 *
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.showPercentage - Whether to display percentage text (default: true)
 * @param {string} props.customText - Optional custom text to display instead of percentage
 * @param {string} props.textColor - Color of the text (defaults to white)
 */
const OrangeProgressBar = ({
  progress = 100,
  style = {},
  showPercentage = true,
  customText = null,
  textColor = "#FDFDFD", // Default to white text
}) => {
  const COLORS = {
    orange: "#F0913A",
    background: "#F6F6F6",
    white: "#FDFDFD",
  };

  // Ensure progress is within 0-100 range
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Text to display (either custom text or percentage)
  const displayText = Math.round(clampedProgress) + "%";

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.background, { backgroundColor: COLORS.background }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: COLORS.orange,
            },
          ]}
        />
        <Text style={[styles.barText, { color: textColor }]}>
          {displayText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  background: {
    height: 23,
    backgroundColor: "#F6F6F6",
    borderRadius: 50,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    padding: 10,
    gap: 10,
    borderWidth: 2,
    borderColor: "#FDFDFD", // White border
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    elevation: 4, // For Android shadow
  },
  fill: {
    position: "absolute",
    textAlign: "left",
    zIndex: 1,
    left: 0,
    top: 0,
    height: 19,
    borderRadius: 50,
  },
  barText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Futura",
    textAlign: "left",
    zIndex: 2,
    textShadowColor: "rgba(0, 0, 0, 0.25)", // Add slight text shadow for better visibility
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default OrangeProgressBar;
