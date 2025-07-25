// ClientQuestionaire.js
import React, { useState } from "react";
import { QuestionnaireProvider } from "./context/QuestionnaireContext";
import Questionnaire from "./components/questionnaire/Questionnaire";
import { Modal, View, Text, StyleSheet } from "react-native";
import FigmaButton from "./components/common/FigmaButton";

export default function ClientQuestionaire({
  navigation,
  questionnaireData,
  showCloseButton = true,
}) {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <QuestionnaireProvider>
      <Modal visible={showPreview} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>PRE-APPROVAL</Text>
            <Text style={styles.text}>
              To get you a quick pre-approval, we need to ask you a few
              questions.
            </Text>
            <Text style={styles.text}>
              Don't worry if you don't have all the answers—just do your best.
              The more information you provide, the faster and more accurate
              your pre-approval will be.
            </Text>
            <FigmaButton
              title="Let's go!"
              onPress={() => setShowPreview(false)}
              style={styles.button}
            />
          </View>
        </View>
      </Modal>
      {!showPreview && (
        <Questionnaire
          navigation={navigation}
          questionnaireData={questionnaireData}
          showCloseButton={showCloseButton}
        />
      )}
    </QuestionnaireProvider>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: "Futura",
    color: "#1D2327",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    fontFamily: "Futura",
    color: "#707070",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 24,
  },
  button: {
    borderRadius: 33,
    marginTop: 20,
    minWidth: 104,
    minHeight: 42,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
