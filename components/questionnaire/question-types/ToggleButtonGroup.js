import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#23231A",
  gray: "#666666",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const ToggleButtonGroup = ({ question, value, onValueChange }) => {
  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
  };
  return (
    <View style={styles.container}>
      {question.text && (
        <Text style={styles.questionText}>{question.text}</Text>
      )}
      <View style={styles.buttonGroup}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.toggleButton,
              value === option.value && styles.selectedButton,
            ]}
            onPress={() => handleSelect(option.value)}
          >
            <Text
              style={[
                styles.buttonText,
                value === option.value && styles.selectedText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
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
    flexDirection: "row",
    gap: 16,
    width: "100%", // Full width
    alignSelf: "flex-start", // Left align the button group
  },
  toggleButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 8, // Changed from rounded to square-ish
    paddingVertical: 16, // More vertical padding
    paddingHorizontal: 16,
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: COLORS.green,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  selectedText: {
    color: COLORS.white,
  },
});

export default ToggleButtonGroup;
