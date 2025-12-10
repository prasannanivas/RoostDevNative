import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Select from "../../common/Select";

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

const Dropdown = ({ question, value, onValueChange }) => {
  return (
    <View style={styles.container}>
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
    width: "100%",
  },
  dropdown: {
    marginBottom: 0,
  },
});

export default Dropdown;
