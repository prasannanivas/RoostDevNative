import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Dimensions } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const AnimatedRadialBackground = () => {
  // Animated values for position
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create animation sequence: top-left -> center-right -> bottom-left -> repeat
    const animationSequence = Animated.sequence([
      // Move from top-left to center-right
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH * 0.95, // Move to right
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT * 0.5, // Move to center
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
      // Move from center-right to bottom-left
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0, // Move back to left
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT * 0.95, // Move to bottom
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
      // Move from bottom-left back to top-left
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Loop the animation
    Animated.loop(animationSequence).start();
  }, [translateX, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      <Svg width={402} height={393} viewBox={`0 0 ${402} ${393}`}>
        <Defs>
          <RadialGradient id="radialGradient" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#C00006" stopOpacity="0.1" />
            <Stop offset="1" stopColor="white" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={402} height={393} fill="url(#radialGradient)" />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default AnimatedRadialBackground;
