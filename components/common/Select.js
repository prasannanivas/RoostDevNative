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
        style={[styles.selector, error && styles.errorSelector]}
        onPress={() => setIsVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666666" />
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
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
  },
  errorSelector: {
    borderColor: "#FF3B30",
  },
  selectorText: {
    fontSize: 16,
    color: "#23231A",
    flex: 1,
  },
  placeholderText: {
    color: "#999999",
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    marginTop: 4,
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
    fontWeight: "600",
    color: "#23231A",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedOption: {
    backgroundColor: "#E8F6F5",
  },
  optionText: {
    fontSize: 16,
    color: "#23231A",
  },
  selectedOptionText: {
    color: "#019B8E",
    fontWeight: "600",
  },
});

export default Select;
