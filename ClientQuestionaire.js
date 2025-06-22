// ClientQuestionaire.js
import React from "react";
import { QuestionnaireProvider } from "./context/QuestionnaireContext";
import Questionnaire from "./components/questionnaire/Questionnaire";

export default function ClientQuestionaire({ navigation, questionnaireData }) {
  return (
    <QuestionnaireProvider>
      <Questionnaire
        navigation={navigation}
        questionnaireData={questionnaireData}
      />
    </QuestionnaireProvider>
  );
}
