import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import {
  Svg,
  Rect,
  Path,
  Defs,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend,
} from "react-native-svg";

/**
 * FigmaButton Component - Matches the exact design from Figma
 *
 * Variants:
 * - 'primary' (green background)
 * - 'secondary' (dark background with border)
 * - 'accent' (orange background)
 * - 'danger' (red background)
 * - 'search' (blue background with search icon)
 * - 'disabled' (gray background)
 * - 'outline' (white background with green border)
 * - 'ghost' (white background only)
 */

const FigmaButton = ({
  title = "Text Here",
  variant = "primary",
  onPress,
  disabled = false,
  style,
  textStyle,
  width = 111,
  height = 42,
  showIcon = false,
  icon = null,
}) => {
  const getButtonColors = () => {
    if (disabled) {
      return {
        backgroundColor: "#E7E7E7",
        textColor: "#A9A9A9",
        borderColor: "transparent",
        hasShadow: false,
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: "#377473",
          textColor: "#FBFBFB",
          borderColor: "transparent",
          hasShadow: false,
        };
      case "secondary":
        return {
          backgroundColor: "#1D2327",
          textColor: "#FBFBFB",
          borderColor: "#FDFDFD",
          hasShadow: true,
        };
      case "accent":
        return {
          backgroundColor: "#F0913A",
          textColor: "#FBFBFB",
          borderColor: "transparent",
          hasShadow: false,
        };
      case "danger":
        return {
          backgroundColor: "#F03A3A",
          textColor: "#FBFBFB",
          borderColor: "transparent",
          hasShadow: false,
        };
      case "search":
        return {
          backgroundColor: "#2271B1",
          textColor: "#FBFBFB",
          borderColor: "transparent",
          hasShadow: false,
        };
      case "outline":
        return {
          backgroundColor: "#FBFBFB",
          textColor: "#377473",
          borderColor: "#377473",
          hasShadow: false,
        };
      case "ghost":
        return {
          backgroundColor: "white",
          textColor: "#A9A9A9",
          borderColor: "transparent",
          hasShadow: false,
        };
      default:
        return {
          backgroundColor: "#377473",
          textColor: "#FBFBFB",
          borderColor: "transparent",
          hasShadow: false,
        };
    }
  };

  const colors = getButtonColors();

  const SearchIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
      <Path
        d="M11 2C15.968 2 20 6.032 20 11C20 13.125 19.253 15.078 17.945 16.585L22.707 21.293C23.098 21.684 23.098 22.316 22.707 22.707C22.316 23.098 21.684 23.098 21.293 22.707L16.585 17.945C15.078 19.253 13.125 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2ZM11 4C7.132 4 4 7.132 4 11C4 14.868 7.132 18 11 18C14.868 18 18 14.868 18 11C18 7.132 14.868 4 11 4Z"
        fill="#FDFDFD"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const renderButtonContent = () => {
    return (
      <View style={styles.contentContainer}>
        {showIcon && variant === "search" && <SearchIcon />}
        {icon && icon}
        <Text
          style={[styles.buttonText, { color: colors.textColor }, textStyle]}
        >
          {title}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderWidth: colors.borderColor !== "transparent" ? 2 : 0,
          width: width,
          height: height,
          shadowColor: colors.hasShadow ? "#000" : "transparent",
          shadowOffset: colors.hasShadow
            ? { width: 0, height: 0 }
            : { width: 0, height: 0 },
          shadowOpacity: colors.hasShadow ? 0.5 : 0,
          shadowRadius: colors.hasShadow ? 4 : 0,
          elevation: colors.hasShadow ? 4 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
    >
      {renderButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Futura",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});

export default FigmaButton;
