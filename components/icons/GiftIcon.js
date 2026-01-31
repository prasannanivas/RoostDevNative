import React, { useEffect, useRef } from "react";
import { TouchableOpacity, StyleSheet, Animated, View } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";

/**
 * Gift Icon component
 *
 * @param {Object} props - Component props
 * @param {string} props.backgroundColor - Background color of the icon (default: #1D2327)
 * @param {string} props.strokeColor - Stroke color of the icon (default: #377473)
 * @param {string} props.pathColor - Path color of the gift icon (default: #FDFDFD)
 * @param {Function} props.onPress - Function to call when icon is pressed
 * @param {Object} props.style - Additional styles to apply to the container
 */
const GiftIcon = ({
  backgroundColor = "#1D2327",
  strokeColor = "#377473",
  pathColor = "#FDFDFD",
  onPress,
  style = {},
  width = 46,
  height = 46,
}) => {
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(borderColorAnim, {
        toValue: 3000,
        duration: 3000,
        useNativeDriver: false,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [borderColorAnim]);

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1000, 2000, 3000],
    outputRange: ["#f3f31fff", "#ce4d11ff", "rgba(0, 0, 0, 0)", "#f3f31fff"],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.container,
          style,
          {
            borderWidth: 6,
            borderColor: borderColor,
          },
        ]}
      >
        <Svg width={width} height={height} viewBox="0 0 46 46" fill="none">
        <Rect
          x="1.5"
          y="1.5"
          width="43"
          height="43"
          rx="21.5"
          fill={backgroundColor}
        />
        <Path
          d="M23 14.875V18M23 14.875C23 13.1491 24.3991 11.75 26.125 11.75C27.8509 11.75 29.25 13.1491 29.25 14.875C29.25 16.6009 27.8509 18 26.125 18M23 14.875C23 13.1491 21.6009 11.75 19.875 11.75C18.1491 11.75 16.75 13.1491 16.75 14.875C16.75 16.6009 18.1491 18 19.875 18M23 18H26.125M23 18H19.875M23 18V25.5M26.125 18H30.2502C31.6504 18 32.3495 18 32.8842 18.2725C33.3547 18.5122 33.7381 18.8943 33.9778 19.3647C34.25 19.899 34.25 20.5987 34.25 21.9961V25.5M19.875 18H15.7502C14.3501 18 13.6495 18 13.1147 18.2725C12.6443 18.5122 12.2622 18.8943 12.0225 19.3647C11.75 19.8995 11.75 20.6001 11.75 22.0002V25.5M11.75 25.5V29.0002C11.75 30.4004 11.75 31.1001 12.0225 31.6349C12.2622 32.1053 12.6443 32.4881 13.1147 32.7278C13.649 33 14.3487 33 15.7461 33H23M11.75 25.5H23M23 25.5V33M23 25.5H34.25M23 33H30.2539C31.6513 33 32.35 33 32.8842 32.7278C33.3547 32.4881 33.7381 32.1053 33.9778 31.6349C34.25 31.1006 34.25 30.4019 34.25 29.0045V25.5"
          stroke={pathColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    backgroundColor: "#1D2327", // Default background color
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 33, // Make it fully rounded
  },
});

export default GiftIcon;
