import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
        <Text style={styles.successText}>{question.text}</Text>
        <Text style={styles.subtitle}>
          Your questionnaire responses have been saved. We'll review your
          information and get back to you soon.
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
    paddingHorizontal: 24,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    fontSize: 36,
    color: COLORS.white,
    fontWeight: "bold",
    fontFamily: "Futura",
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
    maxWidth: 300,
  },
});

export default FinalStep;
