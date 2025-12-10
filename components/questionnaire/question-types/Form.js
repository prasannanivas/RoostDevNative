import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import axios from "axios";
import TextInput from "../../common/TextInput";
import ButtonGroup from "../../common/ButtonGroup";
import ToggleButtonGroupComponent from "./ToggleButtonGroup";
import ChoiceInput from "./ChoiceInput";
import SelectInput from "./SelectInput";
import { validateField } from "../../../utils/questionnaireUtils";
import { getAuthHeaders } from "../../../utils/authHeaders";
import { fetchWithCache } from "../../../utils/apiCache";

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

const Form = ({
  question,
  value,
  onValueChange,
  onValidationChange,
  fieldErrors = {},
}) => {
  const [formData, setFormData] = useState(value || {});
  const [localFieldErrors, setLocalFieldErrors] = useState({});
  const [dynamicOptions, setDynamicOptions] = useState({});
  const previousFormData = useRef(value || {});
  const previousValueProp = useRef(value || {});

  // Merge external field errors with local errors
  const allErrors = { ...localFieldErrors, ...fieldErrors };

  console.log("Form render", { question, value });

  // Keep internal state in sync when parent value prop changes (e.g., navigation/back or late defaults)
  useEffect(() => {
    const nextVal = value || {};
    if (JSON.stringify(nextVal) !== JSON.stringify(previousValueProp.current)) {
      setFormData(nextVal);
      previousFormData.current = nextVal;
      previousValueProp.current = nextVal;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Fetch dynamic options for fields that have optionsApi
  useEffect(() => {
    const fetchDynamicOptions = async () => {
      const fieldsWithApi = question.fields.filter((field) => field.optionsApi);

      console.log(`=== DYNAMIC OPTIONS FETCH START ===`);
      console.log(`Found ${fieldsWithApi.length} fields with optionsApi`);
      fieldsWithApi.forEach((f) =>
        console.log(`  - ${f.key}: ${f.optionsApi}`)
      );

      // Group fields by API URL to fetch each unique URL only once
      const apiUrlMap = new Map();
      fieldsWithApi.forEach((field) => {
        if (!apiUrlMap.has(field.optionsApi)) {
          apiUrlMap.set(field.optionsApi, []);
        }
        apiUrlMap.get(field.optionsApi).push(field);
      });

      console.log(`Unique API URLs: ${apiUrlMap.size}`);

      // Fetch each unique API URL once and apply to all fields using it
      for (const [apiUrl, fields] of apiUrlMap) {
        try {
          console.log(`\n[API] Fetching: ${apiUrl}`);
          console.log(
            `[API] Will be used by fields: ${fields
              .map((f) => f.key)
              .join(", ")}`
          );

          // Use cached fetch - only makes actual API call on first request
          const responseData = await fetchWithCache(apiUrl, false, 300000); // 5 min cache

          console.log(
            `[API] Response data:`,
            JSON.stringify(responseData, null, 2)
          );

          // Apply the response to all fields that use this API
          for (const field of fields) {
            try {
              // Extract the options array from the response
              let dataArray;
              if (responseData.success && responseData.data) {
                dataArray = responseData.data;
              } else if (field.optionsApiKey) {
                dataArray = responseData[field.optionsApiKey];
              } else {
                dataArray = responseData;
              }

              console.log(
                `[${field.key}] Extracted dataArray length: ${dataArray?.length}`
              );

              if (
                dataArray &&
                Array.isArray(dataArray) &&
                dataArray.length > 0
              ) {
                // If data already has value/label format, use it directly
                const options = dataArray.map((item) => {
                  if (item.value && item.label) {
                    return item;
                  }
                  return {
                    value: field.optionsValueKey
                      ? item[field.optionsValueKey]
                      : item,
                    label: field.optionsLabelKey
                      ? item[field.optionsLabelKey]
                      : item,
                  };
                });

                console.log(
                  `[${field.key}] ✅ Successfully mapped ${options.length} options`
                );
                setDynamicOptions((prev) => ({
                  ...prev,
                  [field.key]: options,
                }));
              } else {
                console.log(
                  `[${field.key}] ⚠️ No valid data array, using static fallback`
                );
              }
            } catch (fieldError) {
              console.error(
                `[${field.key}] Error processing field:`,
                fieldError
              );
            }
          }
        } catch (error) {
          console.error(`[API] ❌ ERROR fetching ${apiUrl}:`);
          console.error(`[API] Error name: ${error.name}`);
          console.error(`[API] Error name: ${error.name}`);
          console.error(`[API] Error message: ${error.message}`);
          if (error.response) {
            console.error(`[API] Response status: ${error.response.status}`);
            console.error(`[API] Response data:`, error.response.data);
          }
          // On error, fields will fallback to static options
        }
      }
      console.log(`\n=== DYNAMIC OPTIONS FETCH END ===\n`);
    };

    fetchDynamicOptions();
  }, [question.fields]);

  // Expose validation method to parent
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange({
        validate: () => {
          const errors = {};
          let hasErrors = false;

          question.fields.forEach((field) => {
            // Create field config for validation
            const fieldConfig = {
              ...field,
              type:
                field.key === "email" || field.key === "coEmail"
                  ? "email"
                  : field.key === "phone" || field.key === "coPhone"
                  ? "phone"
                  : "text",
            };

            const validation = validateField(
              fieldConfig,
              formData[field.key] || ""
            );
            if (!validation.isValid) {
              errors[field.key] = validation.error;
              hasErrors = true;
            }
          });

          setLocalFieldErrors(errors);
          return !hasErrors;
        },
      });
    }
  }, [formData, question.fields, onValidationChange]);

  // Memoize the onValueChange callback to prevent infinite loops
  const handleValueChangeCallback = useCallback(() => {
    if (JSON.stringify(formData) !== JSON.stringify(previousFormData.current)) {
      onValueChange(formData);
      previousFormData.current = formData;
    }
  }, [formData, onValueChange]);

  useEffect(() => {
    handleValueChangeCallback();
  }, [handleValueChangeCallback]);

  const handleFieldChange = (fieldKey, fieldValue) => {
    console.log(`Field changed: ${fieldKey} = ${fieldValue}`);
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
        {question.fields.map((field) => {
          console.log(
            "Form field:",
            field.key,
            "type:",
            field.type,
            "options:",
            field.options
          );
          return (
            <View key={field.key} style={styles.fieldContainer}>
              {field.type === "buttonGroup" ? (
                <ButtonGroup
                  label={field.label}
                  value={formData[field.key] || ""}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                  options={field.options || []}
                  placeholder={field.placeholder}
                  error={allErrors[field.key] || ""}
                  isRequired={field.required}
                />
              ) : field.type === "toggleButtonGroup" ? (
                <ToggleButtonGroupComponent
                  question={{
                    label: field.label,
                    options: field.options || [],
                  }}
                  value={formData[field.key] || ""}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                />
              ) : field.type === "choiceInput" ? (
                <ChoiceInput
                  label={field.label}
                  value={formData[field.key] || ""}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                  options={field.options || []}
                  error={allErrors[field.key] || ""}
                  isRequired={field.required}
                />
              ) : field.type === "select" ? (
                <>
                  {console.log("Rendering SelectInput for field:", field.key)}
                  <SelectInput
                    label={field.label}
                    value={formData[field.key] || ""}
                    onValueChange={(value) =>
                      handleFieldChange(field.key, value)
                    }
                    options={dynamicOptions[field.key] || field.options || []}
                    placeholder={field.placeholder || "Select an option"}
                    error={allErrors[field.key] || ""}
                    isRequired={field.required}
                  />
                </>
              ) : (
                <TextInput
                  key={field.key}
                  label={getLabelWithRequired(field)}
                  prefix={field.prefix}
                  value={formData[field.key] || ""}
                  error={allErrors[field.key] || ""}
                  onChangeText={(text) => handleFieldChange(field.key, text)}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboard || "default"}
                  style={[
                    styles.field,
                    allErrors[field.key] ? styles.errorField : null,
                  ]}
                  isRequired={field.required}
                />
              )}
              {/* {allErrors[field.key] && (
                <Text style={styles.errorText}>{allErrors[field.key]}</Text>
              )} */}
            </View>
          );
        })}
      </View>
      {/* {Object.keys(allErrors).length > 0 && (
        <Text style={styles.requiredNote}>* Required fields</Text>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    width: "100%", // Ensure form uses full width
    alignItems: "stretch", // Stretch to fill container width
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 32,
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
    borderColor: COLORS.error, // Red color for error state
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: "Futura",
    marginTop: 8,
  },
  requiredNote: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: "Futura",
    marginTop: 16,
    fontStyle: "italic",
  },
});

export default Form;
