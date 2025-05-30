// ClientQuestionaire.js
import React from "react";
import { QuestionnaireProvider } from "./context/QuestionnaireContext";
import Questionnaire from "./components/questionnaire/Questionnaire";

export default function ClientQuestionaire({ navigation }) {
  return (
    <QuestionnaireProvider>
      <Questionnaire navigation={navigation} />
    </QuestionnaireProvider>
  );
}
