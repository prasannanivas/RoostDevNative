import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../context/NetworkContext";

const NetworkStatusIndicator = () => {
  const { isConnected } = useNetwork();
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  // Add a ref to store the animation controller
  const animationRef = React.useRef(null);

  React.useEffect(() => {
    if (!isConnected) {
      // Start blinking animation when offline
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      // Stop animation when back online
      if (animationRef.current) {
        animationRef.current.stop();
      }
      // Reset opacity to 1
      fadeAnim.setValue(1);
    }
  }, [isConnected, fadeAnim]);

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#FFF" />
      <Text style={styles.text}>Offline</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 45 : 30,
    left: 0,
    right: 0,
    backgroundColor: "#DC3545",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    zIndex: 9999,
  },
  text: {
    color: "#FFF",
    marginLeft: 5,
    fontWeight: "bold",
  },
});

export default NetworkStatusIndicator;
