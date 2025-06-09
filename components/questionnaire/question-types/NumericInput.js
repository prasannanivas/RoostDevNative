import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TextInput from "../../common/TextInput";

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

const NumericInput = ({ question, value, onValueChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.text}</Text>
      <TextInput
        value={value || ""}
        onChangeText={onValueChange}
        placeholder={question.placeholder}
        keyboardType={question.keyboard || "numeric"}
        prefix={question.prefix}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%", // Full width
    maxWidth: 500, // Maximum width
    alignItems: "flex-start", // Left-align content
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 32,
    lineHeight: 32,
    textAlign: "center", // Center text
    alignSelf: "center", // Center the question text
    width: "100%", // Full width for text
  },
  input: {
    marginBottom: 0,
    width: "100%", // Full width
  },
});

export default NumericInput;
