import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import Logo from "../components/Logo";

const COLORS = {
  blue: "#3B7EA1",
  red: "#C8102E",
};

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Logo width={100} height={100} variant="white" />
        </View>
      </View>
      <ActivityIndicator
        size="large"
        color={COLORS.red}
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginTop: 20,
  },
});

export default LoadingScreen;
