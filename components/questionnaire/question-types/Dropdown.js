import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Select from "../../common/Select";

const Dropdown = ({ question, value, onValueChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.text}</Text>
      <Select
        value={value}
        onValueChange={onValueChange}
        options={question.options}
        placeholder={question.placeholder || "Select an option"}
        style={styles.dropdown}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  questionText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 32,
    lineHeight: 32,
  },
  dropdown: {
    marginBottom: 0,
  },
});

export default Dropdown;
