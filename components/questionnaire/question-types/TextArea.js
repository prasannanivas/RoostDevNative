import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TextInput from "../../common/TextInput";

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
    flex: 1,
    width: "100%", // Full width
    alignItems: "stretch", // Stretch to fill container width
  },
  questionText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#23231A",
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
