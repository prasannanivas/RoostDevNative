import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * A configurable Progress Bar component
 *
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.text - Text to display inside the progress bar
 * @param {string} props.color - Color of the progress fill (defaults to orange for < 50%, green for >= 50%)
 * @param {string} props.textColor - Color of the text (defaults to black for < 100%, white for 100%)
 * @param {Object} props.style - Additional styles for the container
 */
const CustomProgressBar = ({
  progress = 0,
  text = "",
  color,
  textColor,
  style = {},
}) => {
  const COLORS = {
    green: "#377473",
    orange: "#F0913A",
    background: "#F6F6F6",
    black: "#1D2327",
    blue: "#2271B1",
    white: "#FDFDFD",
  };

  // Default colors based on progress
  const defaultColor =
    progress < 50
      ? "rgba(240, 145, 58, 0.2)" // Orange at 20% opacity
      : progress < 100
      ? "rgba(55, 116, 115, 0.2)" // Green at 20% opacity
      : COLORS.green; // Solid green for 100%

  const defaultTextColor = progress === 100 ? COLORS.white : COLORS.black;

  // Use the colors passed as props or the default ones
  const fillColor = color || defaultColor;
  const finalTextColor = textColor || defaultTextColor;

  // Complete progress fills the entire background
  const bgColor = progress === 100 ? fillColor : COLORS.background;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.background, { backgroundColor: bgColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
        <Text style={[styles.barText, { color: finalTextColor }]}>{text}</Text>
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
    borderRadius: 10.5,
  },
  barText: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Futura",
    textAlign: "center",
    zIndex: 2,
  },
});

export default CustomProgressBar;
