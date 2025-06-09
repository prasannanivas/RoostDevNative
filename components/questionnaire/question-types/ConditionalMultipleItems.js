import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import TextInput from "../../common/TextInput";
import { useQuestionnaire } from "../../../context/QuestionnaireContext";
import { getProfileInitialsForQuestion } from "../../../data/questionnaireData";

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

const ConditionalMultipleItems = ({ question, value, onValueChange }) => {
  const { responses } = useQuestionnaire();
  const [formData, setFormData] = useState(value || {});
  const [items, setItems] = useState(value?.items || []);
  const previousFormData = useRef(value || {});

  // Get dynamic profile initials
  const profileData = getProfileInitialsForQuestion(responses, question.id);

  useEffect(() => {
    const newFormData = { ...formData, items };
    // Only call onValueChange if formData has actually changed
    if (
      JSON.stringify(newFormData) !== JSON.stringify(previousFormData.current)
    ) {
      onValueChange(newFormData);
      previousFormData.current = newFormData;
    }
  }, [formData, items]);

  const handleInitialFieldChange = (fieldValue) => {
    const newFormData = { [question.initialField.key]: fieldValue };

    // Clear items if user selects "no"
    if (fieldValue !== "yes") {
      setItems([]);
    } else if (items.length === 0) {
      // Add first empty item if user selects "yes" and no items exist
      setItems([{}]);
    }

    setFormData(newFormData);
  };

  const handleItemFieldChange = (itemIndex, fieldKey, fieldValue) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      [fieldKey]: fieldValue,
    };
    setItems(newItems);
  };

  const addAnotherItem = () => {
    setItems([...items, {}]);
  };

  const removeItem = (itemIndex) => {
    const newItems = items.filter((_, index) => index !== itemIndex);
    setItems(newItems);
  };
  const renderItemField = (field, itemIndex, itemValue) => {
    switch (field.type) {
      case "text":
      default:
        return (
          <TextInput
            key={field.key}
            label={field.label}
            value={itemValue || ""}
            onChangeText={(text) =>
              handleItemFieldChange(itemIndex, field.key, text)
            }
            placeholder={field.placeholder}
            keyboardType={field.keyboard || "default"}
            prefix={field.prefix}
            style={styles.field}
          />
        );
    }
  };

  const renderItem = (item, itemIndex) => {
    return (
      <View key={itemIndex} style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>Asset {itemIndex + 1}</Text>
          {items.length > 1 && (
            <TouchableOpacity
              onPress={() => removeItem(itemIndex)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.itemFields}>
          {question.itemFields.map((field) =>
            renderItemField(field, itemIndex, item[field.key])
          )}
        </View>
      </View>
    );
  };

  const shouldShowConditionalFields =
    formData[question.initialField.key] === "yes";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.questionText}>{question.text}</Text>

      <View style={styles.formContainer}>
        {/* Initial toggle field */}
        <View style={styles.fieldContainer}>
          <View style={styles.toggleGroup}>
            {question.initialField.options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.toggleButton,
                  formData[question.initialField.key] === option.value &&
                    styles.selectedButton,
                ]}
                onPress={() => handleInitialFieldChange(option.value)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    formData[question.initialField.key] === option.value &&
                      styles.selectedText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conditional items section */}
        {shouldShowConditionalFields && (
          <View style={styles.conditionalSection}>
            {items.map((item, index) => renderItem(item, index))}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={addAnotherItem}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>
                  {question.addButtonText || "Add Another"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 24,
    lineHeight: 32,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  formContainer: {
    gap: 24,
  },
  fieldContainer: {
    gap: 16,
  },
  toggleGroup: {
    flexDirection: "row",
    gap: 16,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    height: 48,
    justifyContent: "center",
  },
  selectedButton: {
    backgroundColor: COLORS.green,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  selectedText: {
    color: COLORS.white,
  },
  conditionalSection: {
    gap: 24,
  },
  itemContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.silver,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  removeButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "medium",
    fontFamily: "Futura",
  },
  itemFields: {
    gap: 16,
  },
  field: {
    marginBottom: 0,
  },
  actionButtons: {
    alignItems: "center",
    marginTop: 16,
  },
  addButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 140,
    alignItems: "center",
    height: 48,
    justifyContent: "center",
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
});

export default ConditionalMultipleItems;
