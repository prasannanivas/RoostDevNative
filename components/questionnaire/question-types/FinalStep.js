import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
    paddingHorizontal: 20,
  },
  successContainer: {
    alignItems: "center",
    gap: 24,
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  successText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#23231A",
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
});

export default FinalStep;
