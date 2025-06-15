import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, {
  Rect,
  Path,
  G,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend,
  Defs,
} from "react-native-svg";

const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#23231A",
  gray: "#707070",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const ButtonGroup = ({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  style,
  error,
  isRequired = false,
}) => {
  if (!options || options.length < 3) {
    console.error("ButtonGroup requires at least 3 options");
    return null;
  }

  const handleSelect = (selectedValue) => {
    onValueChange && onValueChange(selectedValue);
  };

  // Handle the 3 options - specifically for employment type
  const leftOption = options[0]; // Full Time
  const middleOption = options[1]; // Part Time
  const rightOption = options[2]; // Seasonal

  // Determine which option is selected
  const isLeftSelected = value === leftOption.value;
  const isMiddleSelected = value === middleOption.value;
  const isRightSelected = value === rightOption.value || !value; // Default to right if no selection

  // Calculate the x position for the highlight based on selected option
  let highlightX = "4"; // Default to left position

  if (isMiddleSelected) {
    highlightX = "103";
  } else if (isRightSelected) {
    highlightX = "202.333";
  }
  const width = 310;
  const height = 70; // Increased height from 55 to 70

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.requiredIndicator}> * </Text>}
        </Text>
      )}
      <View style={[styles.buttonContainer, error && styles.errorContainer]}>
        <View style={styles.svgContainer}>
          <Svg width={width} height={height} viewBox="0 0 310 70" fill="none">
            <Defs>
              <Filter
                id="filter0_d_1366_9334"
                x="0"
                y="0"
                width="310"
                height="70"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <FeFlood floodOpacity="0" result="BackgroundImageFix" />
                <FeColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <FeOffset />
                <FeGaussianBlur stdDeviation="2" />
                <FeComposite in2="hardAlpha" operator="out" />
                <FeColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                />
                <FeBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_1366_9334"
                />
                <FeBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_1366_9334"
                  result="shape"
                />
              </Filter>
            </Defs>

            <G filter="url(#filter0_d_1366_9334)">
              {/* Main button background */}
              <Rect
                x="6"
                y="4"
                width="302"
                height="50"
                rx="20.5"
                fill="white"
              />
              {/* Highlight for selected option - moves based on selection */}
              <Rect
                x={highlightX}
                y="6"
                width="100.667"
                height="46"
                rx="20.5"
                fill="#377473"
              />
            </G>
          </Svg>

          {/* Option Labels rendered on top of SVG */}
          <View style={styles.optionsOverlay}>
            <TouchableOpacity
              onPress={() => handleSelect(leftOption.value)}
              style={[styles.optionTouch, { left: 0 }]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  isLeftSelected && styles.selectedOptionText,
                ]}
              >
                {leftOption.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelect(middleOption.value)}
              style={[styles.optionTouch, { left: "33.33%" }]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  isMiddleSelected && styles.selectedOptionText,
                ]}
              >
                {middleOption.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelect(rightOption.value)}
              style={[styles.optionTouch, { left: "66.66%" }]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  isRightSelected && styles.selectedOptionText,
                ]}
              >
                {rightOption.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  requiredIndicator: {
    color: COLORS.error,
  },
  buttonContainer: {
    width: "100%",
    height: 60,
    position: "relative",
  },
  errorContainer: {
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 16.5,
  },
  svgContainer: {
    width: "100%",
    height: 60,
    position: "relative",
  },
  optionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  optionTouch: {
    position: "absolute",
    width: "33.33%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Futura",
    color: COLORS.gray,
    textAlign: "center",
  },
  selectedOptionText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default ButtonGroup;
