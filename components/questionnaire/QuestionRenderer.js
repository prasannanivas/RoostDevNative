import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { processDynamicText } from "../../utils/questionnaireUtils";

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
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
          onAutoNavigate={onAutoNavigate}
        />
      );

    case "numericInput":
      return (
        <NumericInput
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "form":
      return (
        <Form
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "complexForm":
      return (
        <ComplexForm
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "dropdown":
      return (
        <Dropdown
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "textArea":
      return (
        <TextArea
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "toggleButtonGroup":
      return (
        <ToggleButtonGroup
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "conditionalForm":
      return (
        <ConditionalForm
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );
    case "conditionalMultipleItems":
      return (
        <ConditionalMultipleItems
          question={processedQuestion}
          value={value}
          onValueChange={onValueChange}
        />
      );

    case "finalStep":
      return <FinalStep question={processedQuestion} />;

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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
});

export default QuestionRenderer;
