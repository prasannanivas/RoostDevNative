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
  shadow: "rgba(0, 0, 0, 0.25)",
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
  const isLeftSelected = value === leftOption.value || !value; // Default to left if no selection
  const isMiddleSelected = value === middleOption.value;
  const isRightSelected = value === rightOption.value;

  // Responsive width
  // Calculate widths based on container rather than screen
  const highlightAnim = React.useRef(new Animated.Value(0)).current;

  // This will be measured in the component
  const [measuredWidth, setMeasuredWidth] = React.useState(0);

  // Calculate section width (1/3 of total width)
  const sectionWidth = measuredWidth > 0 ? measuredWidth / 3 : 0;
  // Make highlight slightly smaller than section width to make room for shadow
  const padding = 6;
  const optionWidth = sectionWidth - padding * 2;

  React.useEffect(() => {
    let toValue = 0;
    if (measuredWidth > 0) {
      if (isLeftSelected) toValue = padding;
      else if (isMiddleSelected) toValue = sectionWidth + padding;
      else if (isRightSelected) toValue = sectionWidth * 2 + padding;
    }

    Animated.timing(highlightAnim, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isLeftSelected, isMiddleSelected, isRightSelected, measuredWidth]);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.requiredIndicator}> * </Text>}
        </Text>
      )}
      <View style={[styles.buttonContainer, error && styles.errorContainer]}>
        <View
          style={[styles.customButtonGroup, { width: "100%" }]}
          onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
        >
          {/* Main button background */}
          <View style={[styles.buttonBg, { width: "100%" }]} />

          {/* Highlight for selected option - animated */}
          <Animated.View
            style={[
              styles.highlight,
              {
                left: highlightAnim,
                width: optionWidth,
                shadowColor: COLORS.shadow,
                shadowOpacity: 0.4,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 8,
              },
            ]}
          />
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
    height: 50,
    position: "relative",
    paddingHorizontal: 0,
  },
  errorContainer: {
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 20,
  },
  customButtonGroup: {
    position: "relative",
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.background,
  },
  buttonBg: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 0.3,
    borderColor: COLORS.silver,
  },
  highlight: {
    position: "absolute",
    top: 2,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    zIndex: 1,
    opacity: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
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
  },
  selectedOptionText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default ButtonGroup;
