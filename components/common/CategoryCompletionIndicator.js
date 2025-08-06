import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Component to display the completion status of a category
 *
 * @param {Object} props - Component props
 * @param {Boolean} props.isComplete - Whether the category is complete
 * @param {Number} props.completionPercentage - Percentage of completion (0-100)
 * @param {String} props.size - Size of the indicator ('small', 'medium', 'large')
 * @returns {JSX.Element} - Rendered component
 */
const CategoryCompletionIndicator = ({
  isComplete = false,
  completionPercentage = 0,
  size = "small",
}) => {
  // Determine the color based on completion status
  const getColor = () => {
    if (isComplete) {
      return "#4CAF50"; // Green for complete
    } else if (completionPercentage >= 50) {
      return "#FFA000"; // Amber for partially complete
    } else {
      return "#F44336"; // Red for mostly incomplete
    }
  };

  // Determine the size of the indicator
  const getSize = () => {
    switch (size) {
      case "large":
        return { width: 20, height: 20, borderRadius: 10 };
      case "medium":
        return { width: 16, height: 16, borderRadius: 8 };
      case "small":
      default:
        return { width: 12, height: 12, borderRadius: 6 };
    }
  };

  const sizeStyles = getSize();
  const color = getColor();

  return (
    <View style={styles.container}>
      <View
        style={[styles.indicator, { backgroundColor: color }, sizeStyles]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F44336",
  },
  percentText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#666",
  },
});

export default CategoryCompletionIndicator;
