import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Svg, {
  Rect,
  Path,
  G,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend,
  Defs,
} from "react-native-svg";

const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#23231A",
  gray: "#707070",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const ButtonGroup = ({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  style,
  error,
  isRequired = false,
}) => {
  if (!options || options.length < 3) {
    console.error("ButtonGroup requires at least 3 options");
    return null;
  }

  const handleSelect = (selectedValue) => {
    onValueChange && onValueChange(selectedValue);
  };

  // Handle the 3 options - specifically for employment type
  const leftOption = options[0]; // Full Time
  const middleOption = options[1]; // Part Time
  const rightOption = options[2]; // Seasonal

  // Determine which option is selected
  const isLeftSelected = value === leftOption.value;
  const isMiddleSelected = value === middleOption.value;
  const isRightSelected = value === rightOption.value || !value; // Default to right if no selection

  // Responsive width
  const screenWidth = Dimensions.get("window").width;
  const groupWidth = Math.min(screenWidth * 0.92, 310);
  const optionWidth = groupWidth / 3;
  const highlightAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let toValue = 0;
    if (isMiddleSelected) toValue = optionWidth;
    else if (isRightSelected) toValue = optionWidth * 2;
    Animated.timing(highlightAnim, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [isLeftSelected, isMiddleSelected, isRightSelected, optionWidth]);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.requiredIndicator}> * </Text>}
        </Text>
      )}
      <View style={[styles.buttonContainer, error && styles.errorContainer]}>
        <View style={[styles.customButtonGroup, { width: groupWidth }]}>
          {/* Highlight for selected option - animated */}
          <Animated.View
            style={[
              styles.highlight,
              {
                left: highlightAnim,
                width: optionWidth,
                shadowColor: COLORS.green,
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              },
            ]}
          />
          {/* Main button background */}
          <View style={[styles.buttonBg, { width: groupWidth }]} />
          {/* Option Labels rendered on top of background */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              onPress={() => handleSelect(leftOption.value)}
              style={[
                styles.optionTouch,
                isLeftSelected && styles.selectedTouch,
              ]}
              activeOpacity={0.95}
            >
              <Text
                style={[
                  styles.optionText,
                  isLeftSelected && styles.selectedOptionText,
                ]}
              >
                {leftOption.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelect(middleOption.value)}
              style={[
                styles.optionTouch,
                isMiddleSelected && styles.selectedTouch,
              ]}
              activeOpacity={0.95}
            >
              <Text
                style={[
                  styles.optionText,
                  isMiddleSelected && styles.selectedOptionText,
                ]}
              >
                {middleOption.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelect(rightOption.value)}
              style={[
                styles.optionTouch,
                isRightSelected && styles.selectedTouch,
              ]}
              activeOpacity={0.95}
            >
              <Text
                style={[
                  styles.optionText,
                  isRightSelected && styles.selectedOptionText,
                ]}
              >
                {rightOption.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  requiredIndicator: {
    color: COLORS.error,
  },
  buttonContainer: {
    width: "100%",
    height: 60,
    position: "relative",
  },
  errorContainer: {
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 16.5,
  },
  customButtonGroup: {
    position: "relative",
    alignSelf: "center",
    //alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.background,
  },
  buttonBg: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    borderRadius: 33,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  highlight: {
    position: "absolute",
    top: 2.5,
    height: 40,
    borderRadius: 33,
    backgroundColor: COLORS.green,
    zIndex: 1,
    opacity: 0.95,
    borderWidth: 2,
    borderColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 2,
  },
  optionTouch: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 33,
    zIndex: 3,
  },
  selectedTouch: {
    // Optional: add a subtle effect for selected touch
    // backgroundColor: COLORS.green,
    // opacity: 0.1,
  },
  optionText: {
    fontSize: 12,
    fontFamily: "Futura",
    fontWeight: "700",
    color: COLORS.gray,
    textAlign: "center",

    paddingVertical: 8,
    paddingHorizontal: 2,
    transition: "color 0.2s",
  },
  selectedOptionText: {
    color: COLORS.white,
    fontWeight: "bold",
    textShadowColor: COLORS.green,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default ButtonGroup;
