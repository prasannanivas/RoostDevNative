import React, { useState } from "react";
import { View, Text, TextInput as RNTextInput, StyleSheet } from "react-native";

const TextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  style,
  prefix,
  error,
  isRequired = false,
}) => {
  const [localValue, setLocalValue] = useState(value || "");

  const handleChangeText = (text) => {
    setLocalValue(text);
    onChangeText && onChangeText(text);
  };
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.requiredIndicator}> *</Text>}
        </Text>
      )}{" "}
      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        {prefix && (
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}
        <RNTextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            prefix && styles.inputWithPrefix,
          ]}
          value={localValue}
          onChangeText={handleChangeText}
          placeholder={
            isRequired ? `${placeholder || "Required"}` : placeholder
          }
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor="#999999"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 8,
  },
  requiredIndicator: {
    color: "#FF3B30", // Red color for required indicator
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 25, // More rounded corners to match design
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden", // Ensure prefix background doesn't overflow border radius
  },
  errorContainer: {
    borderColor: "#FF3B30",
  },
  prefix: {
    fontSize: 16,
    color: "#666666",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: "500",
    backgroundColor: "#F5F5F5",
    borderRightWidth: 1,
    borderRightColor: "#D0D0D0",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  prefixText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  input: {
    flex: 1,
    paddingVertical: 14, // Slightly larger for better tap targets
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#23231A",
  },
  inputWithPrefix: {
    paddingLeft: 12, // Reduced padding when prefix is present
  },
  multilineInput: {
    paddingTop: 14,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    marginTop: 4,
  },
});

export default TextInput;
