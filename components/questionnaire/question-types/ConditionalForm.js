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

const ConditionalForm = ({ question, value, onValueChange }) => {
  const { responses } = useQuestionnaire();
  const [formData, setFormData] = useState(value || {});
  const previousFormData = useRef(value || {});

  useEffect(() => {
    // Only call onValueChange if formData has actually changed
    if (JSON.stringify(formData) !== JSON.stringify(previousFormData.current)) {
      onValueChange(formData);
      previousFormData.current = formData;
    }
  }, [formData]);

  const handleFieldChange = (fieldKey, fieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: fieldValue,
    }));
  };

  const handleInitialFieldChange = (fieldValue) => {
    const newFormData = { [question.initialField.key]: fieldValue };

    // Clear conditional fields if the initial field changes
    if (fieldValue !== "yes") {
      question.conditionalFields?.yes?.forEach((field) => {
        delete newFormData[field.key];
      });
    }

    setFormData((prev) => ({ ...prev, ...newFormData }));
  };

  const renderConditionalField = (field) => {
    // Check if field has a condition
    if (field.condition) {
      const conditionMet =
        formData[field.condition.key] === field.condition.value;
      if (!conditionMet) return null;
    }

    switch (field.type) {
      case "toggleButtonGroup":
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.toggleGroup}>
              {field.options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.toggleButton,
                    formData[field.key] === option.value &&
                      styles.selectedButton,
                  ]}
                  onPress={() => handleFieldChange(field.key, option.value)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      formData[field.key] === option.value &&
                        styles.selectedText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case "text":
      default:
        return (
          <TextInput
            key={field.key}
            label={field.label}
            value={formData[field.key] || ""}
            onChangeText={(text) => handleFieldChange(field.key, text)}
            placeholder={field.placeholder}
            keyboardType={field.keyboard || "default"}
            prefix={field.prefix}
            style={styles.field}
          />
        );
    }
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

        {/* Conditional fields */}
        {shouldShowConditionalFields && question.conditionalFields?.yes && (
          <View style={styles.conditionalSection}>
            {question.conditionalFields.yes.map(renderConditionalField)}
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
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
    gap: 16,
    paddingTop: 8,
  },
  field: {
    marginBottom: 0,
  },
});

export default ConditionalForm;
