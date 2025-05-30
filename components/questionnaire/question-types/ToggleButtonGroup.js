import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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
    fontWeight: "600",
    color: "#23231A",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#019B8E",
    borderRadius: 25, // More rounded corners for pill-like look
    paddingVertical: 14, // More vertical padding
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: "#019B8E",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600", // Slightly bolder
    color: "#019B8E",
  },
  selectedText: {
    color: "#FFFFFF",
  },
});

export default ToggleButtonGroup;
