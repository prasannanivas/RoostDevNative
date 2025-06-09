import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { QuestionnaireProvider } from "../context/QuestionnaireContext";
import QuestionRenderer from "../components/questionnaire/QuestionRenderer";
import ProgressBar from "../components/questionnaire/ProgressBar";
import Button from "../components/common/Button";

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
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 16,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    gap: 16,
  },
  responseText: {
    fontSize: 14,
    fontFamily: "Futura",
    fontWeight: "medium",
    color: COLORS.gray,
    textAlign: "center",
  },
});

export default QuestionnaireTest;
