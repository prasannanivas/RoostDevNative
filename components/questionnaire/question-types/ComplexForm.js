import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Svg, {
  Rect,
  Path,
  G,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend,
  ClipPath,
  Defs,
} from "react-native-svg";
import TextInput from "../../common/TextInput";
import Select from "../../common/Select";
import ButtonGroup from "../../common/ButtonGroup";
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
  gray: "#707070",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const CustomToggleButton = ({ options, value, onValueChange }) => {
  const width = 310;
  const height = 42;

  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
  };
  // Find yes and no options from the provided options
  const yesOption = options.find((opt) => opt.value === "yes") || options[1];
  const noOption = options.find((opt) => opt.value === "no") || options[0];

  // Check if the current value is "yes"
  const isYesSelected = value === yesOption.value;

  return (
    <TouchableOpacity
      onPress={() =>
        handleSelect(isYesSelected ? noOption.value : yesOption.value)
      }
      activeOpacity={0.9}
    >
      <View style={styles.svgContainer}>
        <Svg width={width} height={height} viewBox="0 0 310 42" fill="none">
          <Defs>
            <Filter
              id="filter0_d_1131_9397"
              x="0"
              y="0.5"
              width="310"
              height="41"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <FeFlood floodOpacity="0" result="BackgroundImageFix" />
              <FeColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <FeOffset />
              <FeGaussianBlur stdDeviation="2" />
              <FeComposite in2="hardAlpha" operator="out" />
              <FeColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
              />
              <FeBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow_1131_9397"
              />
              <FeBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_1131_9397"
                result="shape"
              />
            </Filter>
            <ClipPath id="clip0_1131_9397">
              <Rect
                x="4"
                y="4.5"
                width="302"
                height="33"
                rx="16.5"
                fill="white"
              />
            </ClipPath>
          </Defs>

          <G filter="url(#filter0_d_1131_9397)">
            <G clipPath="url(#clip0_1131_9397)">
              <Rect
                x="4"
                y="4.5"
                width="302"
                height="33"
                rx="16.5"
                fill="white"
              />
              {/* Toggle slider - changes position based on selection */}
              <Rect
                x={isYesSelected ? "6.5" : "151"}
                y="6.5"
                width="151"
                height="29"
                rx="14.5"
                fill={COLORS.green}
              />
              {/* Yes text - always in the same position */}
              <Path
                d="M69.9406 21.656L66.6406 16.952H69.4486L71.1286 19.424L72.7966 16.952H75.6046L72.2926 21.656V26H69.9406V21.656ZM79.7518 22.028C79.6798 21.724 79.5318 21.48 79.3078 21.296C79.0838 21.112 78.8118 21.02 78.4918 21.02C78.1558 21.02 77.8798 21.108 77.6638 21.284C77.4558 21.46 77.3238 21.708 77.2678 22.028H79.7518ZM77.2078 23.288C77.2078 24.224 77.6478 24.692 78.5278 24.692C78.9998 24.692 79.3558 24.5 79.5958 24.116H81.6958C81.2718 25.524 80.2118 26.228 78.5158 26.228C77.9958 26.228 77.5198 26.152 77.0878 26C76.6558 25.84 76.2838 25.616 75.9718 25.328C75.6678 25.04 75.4318 24.696 75.2638 24.296C75.0958 23.896 75.0118 23.448 75.0118 22.952C75.0118 22.44 75.0918 21.98 75.2518 21.572C75.4118 21.156 75.6398 20.804 75.9358 20.516C76.2318 20.228 76.5878 20.008 77.0038 19.856C77.4278 19.696 77.9038 19.616 78.4318 19.616C78.9518 19.616 79.4198 19.696 79.8358 19.856C80.2518 20.008 80.6038 20.232 80.8918 20.528C81.1798 20.824 81.3998 21.188 81.5518 21.62C81.7038 22.044 81.7798 22.524 81.7798 23.06V23.288H77.2078ZM85.0373 22.904C85.0373 23.104 85.0733 23.292 85.1453 23.468C85.2173 23.636 85.3133 23.784 85.4333 23.912C85.5613 24.04 85.7093 24.14 85.8773 24.212C86.0533 24.284 86.2413 24.32 86.4413 24.32C86.6333 24.32 86.8133 24.284 86.9813 24.212C87.1573 24.14 87.3053 24.04 87.4253 23.912C87.5533 23.784 87.6533 23.636 87.7253 23.468C87.8053 23.3 87.8453 23.12 87.8453 22.928C87.8453 22.736 87.8053 22.556 87.7253 22.388C87.6533 22.212 87.5533 22.06 87.4253 21.932C87.3053 21.804 87.1573 21.704 86.9813 21.632C86.8133 21.56 86.6333 21.524 86.4413 21.524C86.2413 21.524 86.0533 21.56 85.8773 21.632C85.7093 21.704 85.5613 21.804 85.4333 21.932C85.3133 22.06 85.2173 22.208 85.1453 22.376C85.0733 22.536 85.0373 22.712 85.0373 22.904ZM87.7733 19.844H89.9573V26H87.7733V25.316C87.3093 25.9 86.6813 26.192 85.8893 26.192C85.4413 26.192 85.0293 26.112 84.6533 25.952C84.2773 25.784 83.9493 25.552 83.6693 25.256C83.3893 24.96 83.1693 24.612 83.0093 24.212C82.8573 23.812 82.7813 23.376 82.7813 22.904C82.7813 22.464 82.8573 22.048 83.0093 21.656C83.1613 21.256 83.3733 20.908 83.6453 20.612C83.9173 20.316 84.2413 20.084 84.6173 19.916C84.9933 19.74 85.4093 19.652 85.8653 19.652C86.6333 19.652 87.2693 19.92 87.7733 20.456V19.844Z"
                fill={isYesSelected ? COLORS.white : COLORS.gray}
              />
              {/* No text - always in the same position */}
              <Path
                d="M211.391 26V16.952H213.743L218.087 22.484V16.952H220.427V26H218.087L213.743 20.468V26H211.391ZM224.267 22.892C224.267 23.1 224.303 23.292 224.375 23.468C224.455 23.636 224.555 23.784 224.675 23.912C224.803 24.04 224.951 24.14 225.119 24.212C225.295 24.284 225.479 24.32 225.671 24.32C225.863 24.32 226.043 24.284 226.211 24.212C226.387 24.14 226.535 24.04 226.655 23.912C226.783 23.784 226.883 23.636 226.955 23.468C227.035 23.292 227.075 23.104 227.075 22.904C227.075 22.712 227.035 22.532 226.955 22.364C226.883 22.188 226.783 22.036 226.655 21.908C226.535 21.78 226.387 21.68 226.211 21.608C226.043 21.536 225.863 21.5 225.671 21.5C225.479 21.5 225.295 21.536 225.119 21.608C224.951 21.68 224.803 21.78 224.675 21.908C224.555 22.036 224.455 22.184 224.375 22.352C224.303 22.52 224.267 22.7 224.267 22.892ZM221.975 22.868C221.975 22.412 222.067 21.988 222.251 21.596C222.435 21.196 222.691 20.852 223.019 20.564C223.347 20.268 223.735 20.036 224.183 19.868C224.639 19.7 225.135 19.616 225.671 19.616C226.199 19.616 226.687 19.7 227.135 19.868C227.591 20.028 227.983 20.256 228.311 20.552C228.647 20.84 228.907 21.188 229.091 21.596C229.275 21.996 229.367 22.44 229.367 22.928C229.367 23.416 229.271 23.864 229.079 24.272C228.895 24.672 228.639 25.02 228.311 25.316C227.983 25.604 227.587 25.828 227.123 25.988C226.667 26.148 226.171 26.228 225.635 26.228C225.107 26.228 224.619 26.148 224.171 25.988C223.723 25.828 223.335 25.6 223.007 25.304C222.687 25.008 222.435 24.656 222.251 24.248C222.067 23.832 221.975 23.372 221.975 22.868ZM235.525 22.94C235.525 22.748 235.489 22.568 235.417 22.4C235.353 22.224 235.257 22.072 235.129 21.944C235.001 21.816 234.849 21.716 234.673 21.644C234.505 21.564 234.321 21.524 234.121 21.524C233.929 21.524 233.749 21.56 233.581 21.632C233.413 21.704 233.265 21.804 233.137 21.932C233.017 22.06 232.917 22.212 232.837 22.388C232.765 22.556 232.729 22.736 232.729 22.928C232.729 23.12 232.765 23.3 232.837 23.468C232.909 23.636 233.009 23.784 233.137 23.912C233.265 24.032 233.413 24.132 233.581 24.212C233.757 24.284 233.941 24.32 234.133 24.32C234.325 24.32 234.505 24.284 234.673 24.212C234.841 24.14 234.985 24.04 235.105 23.912C235.233 23.784 235.333 23.636 235.405 23.468C235.485 23.3 235.525 23.124 235.525 22.94ZM232.789 29.072H230.617V19.844H232.789V20.528C233.253 19.944 233.885 19.652 234.685 19.652C235.125 19.652 235.533 19.74 235.909 19.916C236.293 20.084 236.625 20.316 236.905 20.612C237.185 20.908 237.401 21.256 237.553 21.656C237.713 22.056 237.793 22.484 237.793 22.94C237.793 23.396 237.713 23.82 237.553 24.212C237.401 24.604 237.185 24.948 236.905 25.244C236.633 25.54 236.309 25.772 235.933 25.94C235.557 26.108 235.149 26.192 234.709 26.192C233.941 26.192 233.301 25.928 232.789 25.4V29.072ZM243.531 22.028C243.459 21.724 243.311 21.48 243.087 21.296C242.863 21.112 242.591 21.02 242.271 21.02C241.935 21.02 241.659 21.108 241.443 21.284C241.235 21.46 241.103 21.708 241.047 22.028H243.531ZM240.987 23.288C240.987 24.224 241.427 24.692 242.307 24.692C242.779 24.692 243.135 24.5 243.375 24.116H245.475C245.051 25.524 243.991 26.228 242.295 26.228C241.775 26.228 241.299 26.152 240.867 26C240.435 25.84 240.063 25.616 239.751 25.328C239.447 25.04 239.211 24.696 239.043 24.296C238.875 23.896 238.791 23.448 238.791 22.952C238.791 22.44 238.871 21.98 239.031 21.572C239.191 21.156 239.419 20.804 239.715 20.516C240.011 20.228 240.367 20.008 240.783 19.856C241.207 19.696 241.683 19.616 242.211 19.616C242.731 19.616 243.199 19.696 243.615 19.856C244.031 20.008 244.383 20.232 244.671 20.528C244.959 20.824 245.179 21.188 245.331 21.62C245.483 22.044 245.559 22.524 245.559 23.06V23.288H240.987Z"
                fill={!isYesSelected ? COLORS.white : COLORS.gray}
              />
            </G>
          </G>
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

const ComplexForm = ({ question, value, onValueChange, fieldErrors = {} }) => {
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
    // Handle fields that have their own fields (nested structure)
    if (field.fields && field.title) {
      return renderSection(field, field.title);
    }

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
            style={
              field.accommodateWidth
                ? { flex: field.accommodateWidth }
                : undefined
            }
            accommodateWidth={field.accommodateWidth}
          />
        );
      case "toggleButtonGroup":
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.toggleGroup}>
              <CustomToggleButton
                options={field.options}
                value={fieldValue}
                onValueChange={(value) => handleFieldChange(field.key, value)}
              />
            </View>
          </View>
        );

      case "buttonGroup":
        return (
          <ButtonGroup
            key={field.key}
            label={field.label}
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(field.key, value)}
            options={field.options}
            placeholder={field.placeholder}
            style={
              field.accommodateWidth
                ? { flex: field.accommodateWidth, paddingHorizontal: 2 }
                : undefined
            }
            isRequired={field.required}
          />
        );

      case "text":
      default:
        return (
          <View key={field.key}>
            <TextInput
              label={field.label}
              value={fieldValue}
              onChangeText={(text) => handleFieldChange(field.key, text)}
              placeholder={field.placeholder}
              error={fieldErrors[field.key]}
              keyboardType={field.keyboard || "default"}
              prefix={field.prefix}
              style={[
                field.accommodateWidth
                  ? { flex: field.accommodateWidth }
                  : undefined,
                fieldErrors[field.key] ? styles.errorField : null,
              ]}
            />
            {/* {fieldErrors[field.key] && (
              <Text style={styles.errorText}>{fieldErrors[field.key]}</Text>
            )} */}
          </View>
        );
    }
  };
  const renderSection = (section, index) => {
    // Check if section should accommodate all fields in one line
    const isInlineSection = section.accommodateAllInOneLine;

    if (section.title) {
      return (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {isInlineSection ? (
            <View style={styles.inlineFieldsContainer}>
              {section.fields.map((field, fieldIndex) => (
                <View
                  key={fieldIndex}
                  style={[
                    styles.inlineField,
                    { flex: field.accommodateWidth || 1 },
                  ]}
                >
                  {renderField(field)}
                </View>
              ))}
            </View>
          ) : (
            section.fields.map(renderField)
          )}
        </View>
      );
    }

    // Handle sections without titles (just grouped fields)
    return (
      <View key={index} style={styles.section}>
        {isInlineSection ? (
          <View style={styles.inlineFieldsContainer}>
            {section.fields.map((field, fieldIndex) => (
              <View
                key={fieldIndex}
                style={[
                  styles.inlineField,
                  { flex: field.accommodateWidth || 1 },
                ]}
              >
                {renderField(field)}
              </View>
            ))}
          </View>
        ) : (
          section.fields.map(renderField)
        )}
      </View>
    );
  };
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
  formContainer: {
    gap: 2,
  },
  section: {
    gap: 2,
  },
  inlineFieldsContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-end",
  },
  inlineField: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  fieldContainer: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  toggleGroup: {
    flexDirection: "row",
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
  svgContainer: {
    overflow: "visible",
    alignSelf: "center",
    borderRadius: 50,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  errorField: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: "Futura",
    marginBottom: 4,
  },
});

export default ComplexForm;
