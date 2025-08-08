import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { processDynamicText } from "../../utils/questionnaireUtils";

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

// Import question type components
import MultipleChoice from "./question-types/MultipleChoice";
import NumericInput from "./question-types/NumericInput";
import Form from "./question-types/Form";
import ComplexForm from "./question-types/ComplexForm";
import Dropdown from "./question-types/Dropdown";
import TextArea from "./question-types/TextArea";
import ToggleButtonGroup from "./question-types/ToggleButtonGroup";
import ConditionalForm from "./question-types/ConditionalForm";
import ConditionalMultipleItems from "./question-types/ConditionalMultipleItems";
import FinalStep from "./question-types/FinalStep";

const QuestionRenderer = ({
  question,
  value,
  onValueChange,
  allResponses = {},
  onAutoNavigate,
  showTitle = true,
  onValidationChange,
  fieldErrors = {},
}) => {
  if (!question) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Question not found</Text>
      </View>
    );
  }
  // Handle dynamic text replacement (e.g., [coFirstName])
  const processedQuestion = {
    ...question,
    text: processDynamicText(question.text, allResponses),
    // Also process any other text fields that might contain placeholders
    subtitle: processDynamicText(question.subtitle, allResponses),
    description: processDynamicText(question.description, allResponses),
  };

  switch (question.type) {
    case "multipleChoice":
      return (
        <MultipleChoice
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          fieldErrors={fieldErrors}
          onValueChange={onValueChange}
          onAutoNavigate={onAutoNavigate}
        />
      );

    case "numericInput":
      return (
        <NumericInput
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "form":
      return (
        <Form
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
          onValidationChange={onValidationChange}
          fieldErrors={fieldErrors}
        />
      );

    case "complexForm":
      return (
        <ComplexForm
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
          fieldErrors={fieldErrors}
        />
      );

    case "dropdown":
      return (
        <Dropdown
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "textArea":
      return (
        <TextArea
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "toggleButtonGroup":
      return (
        <ToggleButtonGroup
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "conditionalForm":
      return (
        <ConditionalForm
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );
    case "conditionalMultipleItems":
      return (
        <ConditionalMultipleItems
          key={`question-${question.id}`}
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "finalStep":
      return (
        <FinalStep
          key={`question-${question.id}`}
          question={processedQuestion}
        />
      );

    default:
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Question type "{question.type}" not implemented
          </Text>
          <Text style={styles.questionText}>{question.text}</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Futura",
    fontWeight: "bold",
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    fontFamily: "Futura",
    fontWeight: "medium",
    color: COLORS.gray,
    textAlign: "center",
  },
});

export default QuestionRenderer;
