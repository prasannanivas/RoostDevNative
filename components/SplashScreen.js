import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions, Animated } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

const SplashScreen = ({ onFinish }) => {
  // Create animated values
  const opacity = new Animated.Value(1);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    // Initial animation - scale up the logo
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 10,
      useNativeDriver: true,
    }).start();

    // Timer for 3 seconds
    const timer = setTimeout(() => {
      // Fade out animation
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500, // 500ms fade-out
        useNativeDriver: true,
      }).start(() => {
        // Call onFinish when animation completes
        if (onFinish) {
          onFinish();
        }
      });
    }, 2500); // 2.5 seconds visible + 0.5 seconds fade out = 3 seconds total

    // Clean up timer
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg
          width="430"
          height="932"
          viewBox="0 0 430 932"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Rect
            x="-63"
            y="-65"
            width="555"
            height="1062"
            rx="82"
            fill="#CB003F"
          />
        </Svg>

        <View style={styles.logoContainer}>
          <Svg
            width="127"
            height="204"
            viewBox="0 0 127 204"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <G clipPath="url(#clip0_2627_3169)">
              <Path
                d="M120.7 97.62C120.7 97.18 120.68 96.74 120.67 96.3C120.67 95.96 120.7 95.63 120.7 95.29C120.7 63.3 93.7 37.37 60.39 37.37C27.08 37.37 0.72 62.71 0.11 94.2C0.04 95.33 0 96.47 0 97.62C0 101.11 0.67 105.01 1.84 109.22C2.51 111.82 3.36 114.35 4.39 116.8C18.27 152.83 60.35 203.21 60.35 203.21C60.35 203.21 101 154.54 115.57 118.67C117.36 114.79 118.71 110.68 119.58 106.4C120.3 103.26 120.7 100.32 120.7 97.63V97.62Z"
                fill="#F7CBBF"
              />
              <Path
                d="M62.3499 107.95C69.2148 107.95 74.7799 102.394 74.7799 95.54C74.7799 88.6862 69.2148 83.13 62.3499 83.13C55.485 83.13 49.9199 88.6862 49.9199 95.54C49.9199 102.394 55.485 107.95 62.3499 107.95Z"
                fill="#8B1C41"
              />
              <Path
                d="M93.89 20.84C86.62 26.5 81.44 33.67 77.93 39.9C75.37 44.43 73.7 48.47 72.78 51.03C72.78 51.03 71.56 45.72 71.62 38.36C71.7 29.35 73.7 17.29 82.25 8.08001C75.77 2.82001 68.15 -0.529992 59.36 0.070008C43.93 1.13001 36.34 16.42 32.63 32.58C34.24 35.7 36.19 38.74 38.51 41.38C41.72 45.01 45.66 47.89 50.47 49.09C50.47 49.09 39.83 47.29 29.98 45.18C22.97 49.23 16.97 54.24 12.11 60.66C11.12 61.97 7.54996 66.49 4.20996 74.3C9.56996 72.87 28.4 62.71 61.27 63.49C76.88 64.33 89.89 74.77 93.5 89.36L109.15 62.13L109.42 61.66C109.42 61.66 104.24 35.44 93.89 20.85V20.84Z"
                fill="#8B1C41"
              />
              <Path
                d="M90.0899 149.6V120.97H126.69L93.7099 94.55C91.5699 102.09 83.0299 113.5 77.3499 119.58C67.0199 132.22 55.2499 140.36 49.9599 147.65C48.6099 149.52 48.6199 152.04 49.9799 153.9L50.6999 154.87C58.3899 165.31 66.0899 175.74 73.7799 186.18C74.8599 186.38 76.2099 186.5 77.7699 186.5C90.4699 186.5 100.77 177.53 100.77 166.48C100.77 159.37 96.4999 153.14 90.0899 149.6Z"
                fill="#8B1C41"
              />
            </G>
            <Defs>
              <ClipPath id="clip0_2627_3169">
                <Rect width="126.69" height="203.21" fill="white" />
              </ClipPath>
            </Defs>
          </Svg>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#cc3d51",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // Ensure it's above other components
  },
  logoContainer: {
    position: "absolute",
    top: "35%",
    left: "35%",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: Dimensions.get("window").width * 0.3, // 20% of screen width
    height: Dimensions.get("window").width * 0.3,
  },
});

export default SplashScreen;
