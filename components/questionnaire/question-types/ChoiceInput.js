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
};

const ChoiceInput = ({
  label,
  value,
  onValueChange,
  options = [],
  error,
  isRequired = false,
}) => {
  const handleSelect = (selectedValue) => {
    onValueChange && onValueChange(selectedValue);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.requiredIndicator}> *</Text>}
        </Text>
      )}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value || index}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                error && styles.optionButtonError,
              ]}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 8,
  },
  label: {
    fontSize: 20,
    fontFamily: "Futura",
    fontWeight: "700",
    color: "#1D2327",
    letterSpacing: 0,
    marginBottom: 8,
  },
  requiredIndicator: {
    color: COLORS.error,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  optionButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: COLORS.silver,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  optionButtonSelected: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  optionButtonError: {
    borderColor: COLORS.error,
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Futura",
    fontWeight: "500",
    color: COLORS.green,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: "Futura",
    marginTop: 8,
  },
});

export default ChoiceInput;
