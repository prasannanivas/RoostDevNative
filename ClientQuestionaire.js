// ClientQuestionaire.js
import React, { useState, useEffect } from "react";
import { QuestionnaireProvider } from "./context/QuestionnaireContext";
import Questionnaire from "./components/questionnaire/Questionnaire";
import { Modal, View, Text, StyleSheet } from "react-native";
import FigmaButton from "./components/common/FigmaButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./context/AuthContext";

export default function ClientQuestionaire({
  navigation,
  questionnaireData,
  showCloseButton = true,
  onBack,
}) {
  const { auth } = useAuth();
  const [showPreview, setShowPreview] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [isStartingOver, setIsStartingOver] = useState(false);

  useEffect(() => {
    const checkDraft = async () => {
      try {
        const clientId = auth?.client?.id;
        if (!clientId) return;
        const draftKey = `questionnaire:draft:${clientId}`;
        const firstTimeKey = `questionnaire:firstTime:${clientId}`;
        // Ensure first-time flag defaults to true if missing
        const ft = await AsyncStorage.getItem(firstTimeKey);
        if (ft === null) await AsyncStorage.setItem(firstTimeKey, "true");
        const isFirstTime =
          (await AsyncStorage.getItem(firstTimeKey)) === "true";
        const draft = await AsyncStorage.getItem(draftKey);
        setHasDraft(isFirstTime && !!draft);
      } catch (e) {
        console.warn("Failed to check questionnaire draft:", e);
        setHasDraft(false);
      }
    };
    checkDraft();
  }, [auth?.client?.id]);

  const handleContinue = () => {
    setShowPreview(false);
  };

  const handleStartOver = async () => {
    try {
      const clientId = auth?.client?.id;
      if (!clientId) return setShowPreview(false);
      const draftKey = `questionnaire:draft:${clientId}`;
      await AsyncStorage.removeItem(draftKey);
    } catch (e) {
      console.warn("Failed to clear questionnaire draft:", e);
    } finally {
      // Proceed to questionnaire fresh
      setIsStartingOver(true);
      setShowPreview(false);
      setHasDraft(false);
    }
  };

  return (
    <QuestionnaireProvider>
      <Modal visible={showPreview} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {!hasDraft ? (
              <>
                <Text style={styles.title}>PRE-APPROVAL</Text>
                <Text style={styles.text}>
                  To get you a quick pre-approval, we need to ask you a few
                  questions.
                </Text>
                <Text style={styles.text}>
                  Don't worry if you don't have all the answers—just do your
                  best. The more information you provide, the faster and more
                  accurate your pre-approval will be.
                </Text>
                <FigmaButton
                  title="Let's go!"
                  onPress={() => setShowPreview(false)}
                  style={styles.button}
                />
              </>
            ) : (
              <>
                <Text style={styles.title}>Continue your application</Text>
                <Text style={styles.text}>
                  Looks like you left before you could finish, do you want to
                  continue where you left or start over?
                </Text>
                <View style={styles.buttonRow}>
                  <FigmaButton
                    title="Continue"
                    onPress={handleContinue}
                    style={[
                      //styles.button,
                      styles.primaryButton,
                      { flex: 19 },
                    ]}
                  />
                  <FigmaButton
                    variant="outline"
                    title="Start over"
                    onPress={handleStartOver}
                    style={[
                      // styles.button,
                      styles.secondaryButton,
                      { flex: 23 },
                    ]}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      {!showPreview && (
        <Questionnaire
          navigation={navigation}
          questionnaireData={isStartingOver ? null : questionnaireData}
          showCloseButton={showCloseButton}
          onBack={onBack}
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
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#377473",
  },
  secondaryButton: {
    backgroundColor: "#fdfdfd",
    borderColor: "#377473",
    borderWidth: 2,
    borderRadius: 33,
  },
});
