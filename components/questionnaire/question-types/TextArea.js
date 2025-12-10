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

const TextArea = ({ question, value, onValueChange }) => {
  return (
    <View style={styles.container}>
      {question.text && (
        <Text style={styles.questionText}>{question.text}</Text>
      )}
      <TextInput
        value={value || ""}
        onChangeText={onValueChange}
        placeholder={question.placeholder}
        multiline={true}
        numberOfLines={4}
        style={styles.textArea}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%", // Full width
    alignItems: "stretch", // Stretch to fill container width
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 32,
    lineHeight: 32,
    textAlign: "left", // Left-aligned text
    width: "100%", // Full width for text
  },
  textArea: {
    marginBottom: 0,
    width: "100%", // Full width
  },
});

export default TextArea;
