import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Select = ({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  style,
  error,
  accommodateWidth,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (option) => {
    onValueChange && onValueChange(option.value);
    setIsVisible(false);
  };

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[styles.option, item.value === value && styles.selectedOption]}
      onPress={() => handleSelect(item)}
    >
      <Text
        style={[
          styles.optionText,
          item.value === value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.selector,
          error && styles.errorSelector,
          accommodateWidth && styles.accommodateWidthSelector,
        ]}
        onPress={() => setIsVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedOption && styles.placeholderText,
            accommodateWidth && styles.accommodateWidthText,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        {!accommodateWidth && (
          <Ionicons name="chevron-down" size={20} color="#666666" />
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || "Select an option"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value.toString()}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    fontFamily: "Futura",
    fontWeight: 700,
    color: "#1D2327",
    letterSpacing: 0,
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#707070",
    borderRadius: 8,
    backgroundColor: "#FDFDFD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    backgroundColor: "#FFFFFF",
    height: 48,
  },
  errorSelector: {
    borderColor: "#FF3B30",
  },
  selectorText: {
    fontSize: 16,
    color: "#23231A",
    flex: 1,
    fontFamily: "Futura",
  },
  placeholderText: { color: "#707070" },
  accommodateWidthSelector: {
    paddingHorizontal: 5, // Reduce horizontal padding for more space
    justifyContent: "center", // Center content when no arrow is shown
  },
  accommodateWidthText: {
    textAlign: "center", // Center the text when taking full width
    flex: 1, // Make sure text takes all available space
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    marginTop: 4,
    fontFamily: "Futura",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    maxHeight: "70%",
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "Futura",
    color: "#1D2327",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedOption: {
    backgroundColor: "#E8F6F5",
  },
  optionText: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "Futura",
    color: "#23231A",
  },
  selectedOptionText: {
    color: "#377473", // Using the green color defined in ComplexForm.js
    fontWeight: 700,
  },
});

export default Select;
