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
import {
  getInitialsCircleStyle,
  getInitialsTextStyle,
} from "../../../utils/initialsUtils";

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

      {(question.profileInitials || profileData.initials) && (
        <View style={styles.profileContainer}>
          <View
            style={[
              styles.profileCircle,
              getInitialsCircleStyle(profileData.userType, 60),
            ]}
          >
            <Text style={[styles.profileInitials, getInitialsTextStyle(18)]}>
              {profileData.initials || question.profileInitials}
            </Text>
          </View>
        </View>
      )}

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
    fontWeight: "600",
    color: "#23231A",
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
    borderRadius: 30,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  formContainer: {
    gap: 24,
  },
  fieldContainer: {
    gap: 12,
  },
  toggleGroup: {
    flexDirection: "row",
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#019B8E",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#019B8E",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  conditionalSection: {
    gap: 20,
  },
  itemContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
  },
  removeButton: {
    backgroundColor: "#DC3545",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  itemFields: {
    gap: 12,
  },
  field: {
    marginBottom: 0,
  },
  actionButtons: {
    alignItems: "center",
    marginTop: 16,
  },
  addButton: {
    backgroundColor: "#019B8E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ConditionalMultipleItems;
