import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";

const Button = ({
  title,
  Icon,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? "#FFFFFF" : "#377473"}
          />
          {title && (
            <Text
              style={[
                styles.text,
                styles[`${variant}Text`],
                styles.loadingText,
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      ) : Icon ? (
        Icon
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            isDisabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 50, // Fully rounded for pill shape
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50, // Slightly taller
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primary: {
    backgroundColor: "#377473",
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#377473",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  text: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Futura",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#377473",
  },
  outlineText: {
    color: "#FFFFFF",
  },
  disabled: {
    backgroundColor: "#E0E0E0",
    borderColor: "#E0E0E0",
  },
  disabledText: {
    color: "#999999",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
});

export default Button;
