import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";

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
  shadow: "rgba(0, 0, 0, 0.25)",
};

const ToggleButton = ({ options, value, onValueChange }) => {
  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
  };

  // Only handle 2 options
  const yesOption = options.find((opt) => opt.value === "yes") || options[1];
  const noOption = options.find((opt) => opt.value === "no") || options[0];
  const isYesSelected = value === "yes";

  // Animation setup
  const slideAnim = useRef(new Animated.Value(isYesSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isYesSelected ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isYesSelected, slideAnim]);

  // Interpolate animation value to position
  const slidePosition = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["1%", "51%"],
  });

  return (
    <TouchableOpacity
      onPress={() =>
        handleSelect(isYesSelected ? noOption.value : yesOption.value)
      }
      activeOpacity={0.9}
      style={styles.toggleButton}
    >
      <View style={styles.toggleContainer}>
        {/* Background container */}
        <View style={styles.toggleBackground}>
          {/* Slider */}
          <Animated.View
            style={[
              styles.toggleSlider,
              {
                left: slidePosition, // Animated position
                backgroundColor: COLORS.green,
              },
            ]}
          />

          {/* Text containers - positioned absolutely */}
          <View style={styles.textContainer}>
            <View style={styles.leftTextContainer}>
              <Text
                style={[
                  styles.toggleText,
                  { color: !isYesSelected ? COLORS.white : COLORS.gray },
                ]}
              >
                {noOption.label}
              </Text>
            </View>
            <View style={styles.rightTextContainer}>
              <Text
                style={[
                  styles.toggleText,
                  { color: isYesSelected ? COLORS.white : COLORS.gray },
                ]}
              >
                {yesOption.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ToggleButtonGroup = ({ question, value = "no", onValueChange }) => {
  // For debugging
  console.log("ToggleButtonGroup: value:", question, value);

  if (!value) {
    value = "no"; // Default to "no" if value is not provided
  }
  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
  };
  return (
    <View style={styles.container}>
      {/* {question.label && (
        <Text style={styles.questionText}>{question.label}</Text>
      )} */}
      <View style={styles.buttonGroup}>
        <ToggleButton
          options={question.options}
          value={value}
          onValueChange={handleSelect}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%", // Full width
    alignItems: "stretch", // Stretch to fill container width
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 32,
    lineHeight: 32,
    textAlign: "left", // Left-aligned text
    width: "100%", // Full width for text
  },
  buttonGroup: {
    width: "100%", // Full width
    alignSelf: "flex-start", // Left align the button group
    marginVertical: 5, // Add some vertical spacing
  },
  toggleButton: {
    width: "100%",
    alignItems: "center",
  },
  toggleContainer: {
    width: "100%",
    height: 40, // Increased height to accommodate padding
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10, // Add padding on the sides
  },
  toggleBackground: {
    width: "100%",
    height: 35,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 0.3,
    borderColor: COLORS.gray,
    flexDirection: "row",
  },
  toggleSlider: {
    position: "absolute",
    width: "48%", // Slightly smaller than 50% to create gap on sides
    height: "90%", // Slightly smaller height to create gap on top/bottom
    borderRadius: 18,
    top: "5%", // Center vertically
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  textContainer: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  leftTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  rightTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  toggleText: {
    fontFamily: "Futura",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default ToggleButtonGroup;
