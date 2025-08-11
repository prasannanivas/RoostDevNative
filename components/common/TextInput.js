import React, { useState, useEffect } from "react";
import { View, Text, TextInput as RNTextInput, StyleSheet } from "react-native";
import AnimatedDropdown from "./AnimatedDropdown";
import { trimLeft } from "../../utils/stringUtils";
import {
  formatPhoneNumber,
  unFormatPhoneNumber,
} from "../../utils/phoneFormatUtils";

// Helper function to format SIN number with dashes (xxx-xxx-xxx)
const formatSinNumber = (text) => {
  // Remove any non-numeric characters
  const cleaned = text.replace(/[^\d]/g, "");

  // Limit to 9 digits
  const limited = cleaned.slice(0, 9);

  // Apply xxx-xxx-xxx format
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

// Check if a field is a SIN number field based on key
const isSinNumberField = (key) => {
  return key && key.toLowerCase().includes("sinnumber");
};

const TextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  infoText,
  style,
  prefix,
  error,
  isRequired = false,
  isSinNumber = false,
  fieldKey,
}) => {
  // Helper to format number with commas
  const formatWithCommas = (num) => {
    if (num === undefined || num === null || num === "") return "";
    const strNum = num.toString().replace(/,/g, "");
    // Only format if it's a valid number
    if (!/^\d+$/.test(strNum)) return strNum;
    return strNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const [localValue, setLocalValue] = useState(value || "");

  // Determine if this is a SIN number field based on props or key name
  const isSinField = isSinNumber || isSinNumberField(fieldKey);
  const isPhoneNumberField = keyboardType === "phone-pad";

  // Format SIN number on initial value if needed
  useEffect(() => {
    if (isSinField && value) {
      setLocalValue(formatSinNumber(value));
    } else if (prefix === "$" && value) {
      setLocalValue(formatWithCommas(value));
    } else {
      setLocalValue(value || "");
    }
  }, []);

  const handleChangeText = (text) => {
    // Apply formatting for SIN numbers
    if (isPhoneNumberField) {
      const formattedPhoneNumber = formatPhoneNumber(text);
      setLocalValue(formattedPhoneNumber);
      onChangeText && onChangeText(unFormatPhoneNumber(formattedPhoneNumber));
    } else if (isSinField) {
      const formattedText = formatSinNumber(text);
      setLocalValue(formattedText);
      onChangeText && onChangeText(formattedText);
    } else if (prefix === "$") {
      // Only update display with commas, but pass raw value to callback
      const raw = text.replace(/[^\d]/g, "");
      setLocalValue(formatWithCommas(raw));
      onChangeText && onChangeText(raw);
    } else {
      setLocalValue(text);
      onChangeText && onChangeText(text);
    }
  };
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.requiredIndicator}> * </Text>}
        </Text>
      )}
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
          value={
            isPhoneNumberField ? formatPhoneNumber(localValue) : localValue
          }
          onChangeText={(text) => handleChangeText(trimLeft(text))}
          placeholder={
            isRequired ? `${placeholder || "Required"}` : placeholder
          }
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor="#707070"
          maxLength={isSinField ? 11 : undefined}
        />
      </View>
      {infoText && <Text style={styles.infoText}>{infoText}</Text>}
      <AnimatedDropdown
        visible={!!error}
        style={!!error ? styles.errorBox : {}}
        maxHeight={100}
      >
        <Text style={styles.errorText}>{error}</Text>
      </AnimatedDropdown>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    fontFamily: "Futura",
    fontWeight: 700,
    color: "#1D2327",
    letterSpacing: 0,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#828080ff",
    lineHeight: 20,
    fontFamily: "Futura",
    marginTop: 8,
    marginBottom: 4,
  },
  requiredIndicator: {
    color: "#FF3B30", // Red color for required indicator
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#707070",
    borderRadius: 8, // More rounded corners to match design
    backgroundColor: "#FDFDFD",
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
    color: "#707070",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: "500",
    backgroundColor: "#F6F6F6",
    borderRightWidth: 1,
    borderRightColor: "#1D2327",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  prefixText: {
    fontSize: 14,
    color: "#707070",
    fontFamily: "Futura",
    fontWeight: 500,
  },
  input: {
    flex: 1,
    paddingVertical: 13, // Slightly larger for better tap targets
    paddingHorizontal: 24,
    borderRadius: 6,
    borderColor: "#707070",
    fontSize: 14,
    fontFamily: "Futura",
    fontWeight: 500,
    color: "#23231A",
  },
  inputWithPrefix: {
    paddingLeft: 12, // Reduced padding when prefix is present
  },
  multilineInput: {
    paddingTop: 14,
    textAlignVertical: "top",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#F0DE3A40", // Using notice container background with 25% opacity (same as SignupScreen2)
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14, // P size (same as SignupScreen2)
    fontWeight: "500", // P weight (same as SignupScreen2)
    color: "#707070", // Same color as SignupScreen2
    lineHeight: 20,
    fontFamily: "Futura",
  },
});

export default TextInput;
