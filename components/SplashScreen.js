import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions, Animated } from "react-native";

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
    }, 25000); // 2.5 seconds visible + 0.5 seconds fade out = 3 seconds total

    // Clean up timer
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image
          source={require("../assets/app-icon-main-old.png")}
          style={styles.logo}
          resizeMode="contain"
        />
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
  logo: {
    width: Dimensions.get("window").width * 0.3, // 20% of screen width
    height: Dimensions.get("window").width * 0.3,
  },
});

export default SplashScreen;
