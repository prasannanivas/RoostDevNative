import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const MultipleChoice = ({ question, value, onValueChange, onAutoNavigate }) => {
  const handleSelect = (selectedValue) => {
    console.log("MultipleChoice: Option selected:", selectedValue);
    onValueChange(selectedValue);

    // Auto-navigate after a short delay to ensure the response is saved
    if (onAutoNavigate) {
      console.log("MultipleChoice: Auto-navigating in 500ms...");
      setTimeout(() => {
        console.log(
          "MultipleChoice: Calling onAutoNavigate with selectedValue:",
          selectedValue
        );
        onAutoNavigate(selectedValue); // Pass the selected value to auto-navigate
      }, 500); // Increased delay to ensure response is saved
    } else {
      console.log("MultipleChoice: onAutoNavigate not provided");
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              value === option.value && styles.selectedButton,
            ]}
            onPress={() => handleSelect(option.value)}
          >
            <Text
              style={[
                styles.optionText,
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
    paddingTop: 0,
    width: "100%", // Full width
  },
  questionText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 36, // More space below question
    lineHeight: 32,
    textAlign: "left", // Left align questions when next to initials
    flex: 1, // Take remaining space in row
  },
  optionsContainer: {
    gap: 16, // Slightly more space between options
    alignItems: "flex-start", // Left align the option buttons
    width: "100%", // Full width to match design
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5, // Slightly thicker border
    borderColor: "#019B8E",
    borderRadius: 50,
    paddingVertical: 14, // More vertical padding
    paddingHorizontal: 24, // More horizontal padding
    alignItems: "center",
    width: "auto", // Auto width based on content
    alignSelf: "flex-start", // Left align the button
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: "#019B8E",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600", // Slightly bolder
    color: "#019B8E",
  },
  selectedText: {
    color: "#FFFFFF",
  },
});

export default MultipleChoice;
