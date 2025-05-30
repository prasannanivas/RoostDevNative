import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import TextInput from "../../common/TextInput";

const Form = ({ question, value, onValueChange }) => {
  const [formData, setFormData] = useState(value || {});
  const [fieldErrors, setFieldErrors] = useState({});
  const previousFormData = useRef(value || {});
  useEffect(() => {
    // Only call onValueChange if formData has actually changed
    if (JSON.stringify(formData) !== JSON.stringify(previousFormData.current)) {
      onValueChange(formData);
      previousFormData.current = formData;

      // Validate all fields and update error state
      const newErrors = {};
      let hasErrors = false;

      question.fields.forEach((field) => {
        if (
          field.required &&
          (!formData[field.key] || formData[field.key].trim() === "")
        ) {
          newErrors[field.key] = `${field.label} is required`;
          hasErrors = true;
        } else if (fieldErrors[field.key] && formData[field.key]) {
          // Clear errors for fields that are now filled
        } else {
          // Keep existing errors for other fields
          if (fieldErrors[field.key]) {
            newErrors[field.key] = fieldErrors[field.key];
            hasErrors = true;
          }
        }
      });

      // Only update state if errors changed
      if (JSON.stringify(newErrors) !== JSON.stringify(fieldErrors)) {
        setFieldErrors(newErrors);
      }
    }
  }, [formData]);

  const handleFieldChange = (fieldKey, fieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: fieldValue,
    }));
  };

  // Create a label with required indicator if needed
  const getLabelWithRequired = (field) => {
    return field.required ? `${field.label}` : field.label;
  };

  return (
    <View style={styles.container}>
      {question.text && (
        <Text style={styles.questionText}>{question.text}</Text>
      )}
      <View style={styles.fieldsContainer}>
        {question.fields.map((field) => (
          <View key={field.key} style={styles.fieldContainer}>
            <TextInput
              label={getLabelWithRequired(field)}
              value={formData[field.key] || ""}
              onChangeText={(text) => handleFieldChange(field.key, text)}
              placeholder={field.placeholder}
              keyboardType={field.keyboard || "default"}
              style={[
                styles.field,
                fieldErrors[field.key] ? styles.errorField : null,
              ]}
              isRequired={field.required}
            />
            {fieldErrors[field.key] && (
              <Text style={styles.errorText}>{fieldErrors[field.key]}</Text>
            )}
          </View>
        ))}
      </View>
      {Object.keys(fieldErrors).length > 0 && (
        <Text style={styles.requiredNote}>* Required fields</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    width: "100%", // Ensure form uses full width
    alignItems: "stretch", // Stretch to fill container width
  },
  questionText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 30,
    lineHeight: 32,
    textAlign: "left", // Left-aligned text to match design
    width: "100%", // Full width for text
  },
  fieldsContainer: {
    gap: 24,
    width: "100%", // Full width of container
    alignItems: "stretch", // Stretch to fill container width
  },
  fieldContainer: {
    width: "100%",
  },
  field: {
    marginBottom: 0,
  },
  errorField: {
    borderColor: "#FF3B30", // Red color for error state
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  requiredNote: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 16,
    fontStyle: "italic",
  },
});

export default Form;
