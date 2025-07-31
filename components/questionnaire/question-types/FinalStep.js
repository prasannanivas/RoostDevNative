import { Asset } from "expo-asset";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import LottieView from "lottie-react-native";

const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#23231A",
  gray: "#666666",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const FinalStep = ({ question }) => {
  return (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <LottieView
          source={require("../../../assets/celebration.json")}
          autoPlay
          loop={false}
          style={styles.confettiIcon}
        />
        <Text style={styles.successText}>{question.text}</Text>
        <Text style={styles.subtitle}>
          Your answers have been submitted, a representative will reach out
          shortly with your pre-approval. In the mean time you can get started
          by submitting documents.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Futura",
    fontWeight: "medium",
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 24,
  },
  confettiIcon: {
    width: 160,
    height: 160,
    alignSelf: "center",
  },
});

export default FinalStep;
