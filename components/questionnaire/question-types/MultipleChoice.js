import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AnimatedDropdown from "../../common/AnimatedDropdown";

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

const MultipleChoice = ({
  question,
  value,
  onValueChange,
  onAutoNavigate,
  fieldErrors,
}) => {
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

        <AnimatedDropdown
          visible={!!fieldErrors[question.id]}
          style={styles.errorBox}
          maxHeight={100}
          contentKey={fieldErrors[question.id]}
        >
          <Text style={styles.errorText}>{fieldErrors[question.id]}</Text>
        </AnimatedDropdown>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    width: "100%", // Full width
  },
  questionText: {
    color: COLORS.black,
    marginBottom: 32, // More space below question
    lineHeight: 32,
    textAlign: "left", // Left align questions when next to initials
    flex: 1, // Take remaining space in row
    fontSize: 24,
    fontWeight: 700,
    lineHeight: "100%",
    letterSpacing: 0,
    fontFamily: "Futura",
  },
  optionsContainer: {
    gap: 16, // Slightly more space between options
    alignItems: "flex-start", // Left align the option buttons
    width: "100%", // Full width to match design
  },
  optionButton: {
    borderWidth: 1, // Slightly thicker border
    borderColor: COLORS.green,
    backgroundColor: COLORS.background,
    borderRadius: 33,
    paddingVertical: 13, // More vertical padding
    paddingHorizontal: 24, // More horizontal padding
    gap: 10,
    alignItems: "center",
    width: "auto", // Auto width based on content
    alignSelf: "flex-start", // Left align the button
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: COLORS.green,
  },
  optionText: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Futura",
    color: COLORS.green,
  },
  selectedText: {
    color: COLORS.white,
  },
  errorBox: {
    backgroundColor: "#F0DE3A40", // Using notice container background with 25% opacity
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12, // P size
    fontWeight: "700", // P weight
    color: "#707070",
    fontFamily: "Futura",
  },
});

export default MultipleChoice;
