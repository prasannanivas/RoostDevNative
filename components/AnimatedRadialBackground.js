import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  G,
  Path,
  ClipPath,
  Filter,
  FeFlood,
  FeBlend,
  FeGaussianBlur,
} from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SVG_WIDTH = 472;
const SVG_HEIGHT = 463;

const AnimatedRadialBackground = () => {
  // Animated values for position
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Calculate positions
    // 1. Top Left: (0, 0)
    // 2. Center Right: (screen width - svg width, (screen height - svg height) / 2)
    // 3. Bottom Left: (0, screen height - svg height)

    const centerRightX = SCREEN_WIDTH - SVG_WIDTH;
    const centerRightY = (SCREEN_HEIGHT - SVG_HEIGHT) / 2;
    const bottomLeftY = SCREEN_HEIGHT - SVG_HEIGHT;

    // Create animation sequence: top-left -> center-right -> bottom-left -> repeat
    const animationSequence = Animated.sequence([
      // Move from top-left to center-right
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: centerRightX, // Move to right edge
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: centerRightY, // Move to vertical center
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
          toValue: bottomLeftY, // Move to bottom
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
      <Svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox="0 0 472 463"
        fill="none"
      >
        <Defs>
          <Filter
            id="filter0_f_72_226"
            x="-30"
            y="-30"
            width="502"
            height="493"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <FeGaussianBlur
              stdDeviation="25"
              result="effect1_foregroundBlur_72_226"
            />
          </Filter>
          <RadialGradient
            id="paint0_radial_72_226"
            cx="0"
            cy="0"
            r="1"
            gradientTransform="matrix(127.339 373.854 -382.415 95.7308 93.6608 39.1462)"
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#C00006" stopOpacity="0.1" />
            <Stop offset="1" stopColor="white" stopOpacity="0" />
          </RadialGradient>
          <ClipPath id="clip0_72_226">
            <Rect width="402" height="393" fill="white" x="20" y="20" />
          </ClipPath>
        </Defs>
        <G
          opacity="0.3"
          clipPath="url(#clip0_72_226)"
          filter="url(#filter0_f_72_226)"
        >
          <Path
            d="M-29.6164 417.16C-96.8164 367.16 -105.283 293.66 -101.116 263.16C-101.116 217.66 -75.1165 123.16 -1.61646 93.1602C71.8835 63.1602 253.884 170.16 295.884 254.16C329.484 321.36 244.55 390.827 197.884 417.16C150.05 437.994 37.5836 467.16 -29.6164 417.16Z"
            fill="#A20E0E"
            fillOpacity="0.1"
          />
          <Path
            d="M280.384 227.16C213.184 177.16 204.717 103.66 208.884 73.1602C208.884 27.6602 234.884 -66.8398 308.384 -96.8398C381.884 -126.84 563.884 -19.8398 605.884 64.1602C639.484 131.36 554.55 200.827 507.884 227.16C460.05 247.994 347.584 277.16 280.384 227.16Z"
            fill="#27806B"
            fillOpacity="0.2"
          />
          <Rect
            x="20"
            y="20"
            width="402"
            height="393"
            fill="url(#paint0_radial_72_226)"
          />
        </G>
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
  },
});

export default AnimatedRadialBackground;
