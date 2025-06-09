import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import TextInput from "../../common/TextInput";
import Select from "../../common/Select";
import {
  getMonthOptions,
  getDayOptions,
  getYearOptions,
  getDependentOptions,
} from "../../../utils/questionnaireUtils";
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
const ComplexForm = ({ question, value, onValueChange }) => {
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
  const renderField = (field) => {
    const fieldValue = formData[field.key] || "";
    switch (field.type) {
      case "select":
        let options = field.options || [];

        // Generate options for specific field types
        if (field.key.includes("Month") || field.key === "months") {
          options = getMonthOptions();
        } else if (field.key.includes("Day")) {
          options = getDayOptions();
        } else if (field.key.includes("Year") || field.key === "years") {
          options = getYearOptions();
        } else if (
          field.key.includes("dependents") ||
          field.key.includes("Dependents")
        ) {
          options = getDependentOptions();
        }

        return (
          <Select
            key={field.key}
            label={field.label}
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(field.key, value)}
            options={options}
            placeholder={field.placeholder}
          />
        );
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
                    fieldValue === option.value && styles.selectedButton,
                  ]}
                  onPress={() => handleFieldChange(field.key, option.value)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      fieldValue === option.value && styles.selectedText,
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
            value={fieldValue}
            onChangeText={(text) => handleFieldChange(field.key, text)}
            placeholder={field.placeholder}
            keyboardType={field.keyboard || "default"}
            prefix={field.prefix}
          />
        );
    }
  };

  const renderSection = (section, index) => {
    if (section.title) {
      return (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.fields.map(renderField)}
        </View>
      );
    }

    // Handle sections without titles (just grouped fields)
    return (
      <View key={index} style={styles.section}>
        {section.fields.map(renderField)}
      </View>
    );
  };
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {question.text && (
        <Text style={styles.questionText}>{question.text}</Text>
      )}

      <View style={styles.formContainer}>
        {question.sections
          ? question.sections.map(renderSection)
          : question.fields
          ? question.fields.map(renderField)
          : null}
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
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
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
});

export default ComplexForm;
