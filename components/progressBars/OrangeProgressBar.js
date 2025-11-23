import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A progress bar component with orange fill and percentage text outside
 * New design with E8E8E8 background, F0913A fill, and external percentage text
 *
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.showPercentage - Whether to display percentage text (default: true)
 * @param {string} props.customText - Optional custom text to display instead of percentage
 * @param {string} props.textColor - Color of the text (defaults to #797979)
 */
const OrangeProgressBar = ({
  progress = 0,
  style = {},
  showPercentage = true,
  customText = null,
  textColor = "#797979",
}) => {
  // Ensure progress is within 0-100 range
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const displayText = Math.round(clampedProgress) + "%";

  return (
    <View style={[styles.container, style]}>
      {/* Indicator background */}
      <View style={styles.indicator}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${clampedProgress}%`,
            },
          ]}
        />
      </View>

      {/* Percentage text outside */}
      {showPercentage && (
        <Text style={[styles.percentageText, { color: textColor }]}>
          {customText || displayText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    gap: 8,
    height: 13,
  },
  indicator: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 0,
    height: 10,
    backgroundColor: "#E8E8E8",
    borderRadius: 50,
    flex: 1,
    overflow: "hidden",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#F0913A",
    borderRadius: 50,
  },
  percentageText: {
    fontFamily: "Futura",
    fontStyle: "normal",
    fontWeight: "500",
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
});

export default OrangeProgressBar;
