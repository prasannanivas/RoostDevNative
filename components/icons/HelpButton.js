import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const HelpButton = ({
  backgroundColor = "#377473",
  borderColor = "#FDFDFD",
  textColor = "#FFFFFF",
  text = "HELP",
  onPress,
  style,
  textStyle,
  size = "medium", // 'small', 'medium', 'large'
  variant = "filled", // 'filled', 'outline', 'ghost'
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          width: 40,
          height: 40,
          fontSize: 8,
          borderRadius: 20,
        };
      case "large":
        return {
          width: 60,
          height: 60,
          fontSize: 14,
          borderRadius: 30,
        };
      default: // medium
        return {
          width: 46,
          height: 46,
          fontSize: 12,
          borderRadius: 25,
        };
    }
  };

  const getVariantStyles = () => {
    const sizeStyles = getSizeStyles();

    switch (variant) {
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: borderColor,
          borderWidth: 2,
          textColor: borderColor,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          borderWidth: 0,
          textColor: textColor,
        };
      default: // filled
        return {
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: variant === "filled" ? 0 : 2,
          textColor: textColor,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.borderRadius,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  buttonText: {
    fontWeight: "bold",
    fontFamily: "Futura",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

export default HelpButton;
