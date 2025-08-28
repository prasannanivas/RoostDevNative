import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

/**
 * A progress bar component with orange fill and percentage text inside
 * Matches the SVG design with F6F6F6 background, FDFDFD border, and F0913A fill
 *
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.showPercentage - Whether to display percentage text (default: true)
 * @param {string} props.customText - Optional custom text to display instead of percentage
 * @param {string} props.textColor - Color of the text (defaults to white)
 */
const OrangeProgressBar = ({
  progress = 0,
  style = {},
  showPercentage = true,
  customText = null,
  textColor = "#FDFDFD", // Default to white text
}) => {
  // Ensure progress is within 0-100 range
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const displayText = Math.round(clampedProgress) + "%";

  return (
    <View style={[styles.container, style]}>
      <View style={styles.shadowContainer}>
        <View style={styles.background}>
          <View
            style={[
              styles.fill,
              {
                width: `${clampedProgress}%`,
                borderTopRightRadius: clampedProgress === 100 ? 9.5 : 0,
                borderBottomRightRadius: clampedProgress === 100 ? 9.5 : 0,
              },
            ]}
          />
          {showPercentage && (
            <Text style={[styles.barText, { color: textColor }]}>
              {customText || displayText}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    width: "100%",
  },
  shadowContainer: {
    // Drop shadow exactly like in SVG
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: "#000000",
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 2,
      },
    }),
  },
  background: {
    height: 23, // Exactly as in SVG (23px)
    backgroundColor: "#F6F6F6", // Exact color from SVG
    borderRadius: 11.5, // Exactly as in SVG (11.5px)
    overflow: "hidden", // Critical for iOS
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FDFDFD", // White border matching SVG
    position: "relative",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#F0913A", // Exact color from SVG
    height: "100%",
    borderTopLeftRadius: 9.5, // Exactly as in SVG (9.5px)
    borderBottomLeftRadius: 9.5,
  },
  barText: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Futura",
    marginLeft: 10,
    zIndex: 5,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default OrangeProgressBar;
