import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { QuestionnaireProvider } from "../context/QuestionnaireContext";
import QuestionRenderer from "../components/questionnaire/QuestionRenderer";
import ProgressBar from "../components/questionnaire/ProgressBar";
import Button from "../components/common/Button";

// Test component to verify questionnaire functionality
const QuestionnaireTest = () => {
  // Sample question for testing
  const testQuestion = {
    id: 1,
    text: "Have you found a property yet?",
    type: "multipleChoice",
    options: [
      { value: "still_looking", label: "Still looking" },
      { value: "yes", label: "Yes" },
    ],
  };

  const [testResponse, setTestResponse] = React.useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Questionnaire System Test</Text>
        <ProgressBar progress={15} />
      </View>

      <View style={styles.content}>
        <QuestionRenderer
          question={testQuestion}
          value={testResponse}
          onValueChange={setTestResponse}
          allResponses={{}}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.responseText}>
          Selected: {testResponse || "None"}
        </Text>
        <Button
          title="Test Button"
          onPress={() => console.log("Response:", testResponse)}
          disabled={!testResponse}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 16,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
  },
  responseText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
});

export default QuestionnaireTest;
