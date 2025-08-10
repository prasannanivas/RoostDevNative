import React, { createContext, useState, useContext } from "react";
import {
  calculateQuestionnaireProgress,
  isQuestionInFlow,
} from "../utils/questionnaireUtils";
import { useClient } from "./ClientContext";

const QuestionnaireContext = createContext();

export const QuestionnaireProvider = ({ children }) => {
  const { clientInfo } = useClient();

  const defaultResponses = {
    11: { bonuses: "no", benefits: "no" }, // Default value for question 10

    14: { hasOtherProperties: "no", hasMortgage: "no", planningSelling: "no" }, // Default value for question 14
    13: { hasAssets: "no", items: [] }, // Default value for question 15
    6: {
      firstName: clientInfo?.name.split(" ")[0],
      lastName: clientInfo?.name.split(" ")[1] || "",
      email: clientInfo?.email || "",
      phone: clientInfo?.phone || "",
    }, // Default value for question 6
    100: {
      firstName: clientInfo?.name.split(" ")[0],
      lastName: clientInfo?.name.split(" ")[1] || "",
      email: clientInfo?.email || "",
      phone: clientInfo?.phone || "",
    }, // Default value for question 100
    108: { bonuses: "no", benefits: "no" }, // Default value for question 108
    116: { hasAssets: "no", items: [] }, // Default value for question 116
    118: { hasOtherProperties: "no", hasMortgage: "no", planningSelling: "no" }, // Default value for question 118
    112: { coBonuses: "no", coBenefits: "no" }, // Default value for question 112
    117: { coHasAssets: "no", coItem: [] }, // Default value for question 117
    119: {
      coHasOtherProperties: "no",
      coHasMortgage: "no",
      coPlanningSelling: "no",
    }, // Default value for question 119
  };

  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [responses, setResponses] = useState(defaultResponses);
  const [isCompleted, setIsCompleted] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([1]));
  const [questionHistory, setQuestionHistory] = useState([1]); // Track actual navigation order

  const updateResponse = (questionId, response) => {
    // Check if this is question 5 (flow decision point) and if the answer is changing
    if (questionId === 5 || questionId === "5") {
      const previousAnswer = responses[5] || responses["5"];

      // If the user is changing their answer for question 5, reset downstream progress
      if (previousAnswer && previousAnswer !== response) {
        console.log(`Path switching detected: ${previousAnswer} → ${response}`);

        // Determine which flow they're switching FROM to clean up appropriately
        const newFlowType = response; // "just_me" or "co_signer"

        // Clear responses and visited questions for questions that don't belong to the new flow
        const newResponses = defaultResponses;
        const newVisitedQuestions = new Set([1]);
        const newQuestionHistory = [1];

        // Keep responses that are valid for the new flow
        Object.keys(responses).forEach((key) => {
          const qId = parseInt(key);
          if (qId <= 5 || isQuestionInFlow(qId, newFlowType)) {
            newResponses[key] = responses[key];
          }
        });

        // Keep visited questions that are valid for the new flow (only if they were actually visited)
        visitedQuestions.forEach((qId) => {
          if (qId <= 5 || isQuestionInFlow(qId, newFlowType)) {
            newVisitedQuestions.add(qId);
          }
        });

        // Keep question history that is valid for the new flow
        questionHistory.forEach((qId) => {
          if (qId <= 5 || isQuestionInFlow(qId, newFlowType)) {
            newQuestionHistory.push(qId);
          }
        });

        // Update the new response for question 5
        newResponses[questionId] = response;

        // Reset the state with cleaned data
        setResponses(newResponses);
        setVisitedQuestions(newVisitedQuestions);
        setQuestionHistory(newQuestionHistory);
        setCurrentQuestionId(5); // Stay on question 5

        console.log(`Cleaned state for ${newFlowType} flow:`, {
          responses: Object.keys(newResponses),
          visitedQuestions: Array.from(newVisitedQuestions),
          history: newQuestionHistory,
        });
        return; // Exit early since we've handled the special case
      }
    }

    // Normal response update for other questions or first-time answer to question 5
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const goToNextQuestion = (nextQuestionId) => {
    if (nextQuestionId && nextQuestionId !== currentQuestionId) {
      setCurrentQuestionId(nextQuestionId);
      setVisitedQuestions((prev) => new Set([...prev, nextQuestionId]));
      setQuestionHistory((prev) => [...prev, nextQuestionId]);
    }
  };

  const goToPreviousQuestion = () => {
    if (questionHistory.length > 1) {
      const newHistory = [...questionHistory];
      newHistory.pop(); // Remove current question
      const previousQuestionId = newHistory[newHistory.length - 1];
      setCurrentQuestionId(previousQuestionId);
      setQuestionHistory(newHistory);

      // Update visitedQuestions to only include questions in the current history
      // This ensures the progress bar decreases when going back
      setVisitedQuestions(new Set(newHistory));
    }
  };

  const markAsCompleted = () => {
    setIsCompleted(true);
  };

  const resetQuestionnaire = () => {
    setCurrentQuestionId(1);
    setResponses(defaultResponses);
    setIsCompleted(false);
    setVisitedQuestions(new Set([1]));
    setQuestionHistory([1]);
  };

  // New: restore previously saved progress (responses + current question + navigation state)
  const restoreProgress = ({
    currentQuestionId: toQuestionId = 1,
    responses: savedResponses = {},
    visitedQuestions: savedVisited = [],
    questionHistory: savedHistory = [],
  }) => {
    try {
      const mergedResponses = { ...defaultResponses, ...savedResponses };
      setResponses(mergedResponses);

      const qId =
        typeof toQuestionId === "string"
          ? parseInt(toQuestionId, 10)
          : toQuestionId;
      const targetQ = qId || 1;
      setCurrentQuestionId(targetQ);

      // Use saved visited/history if provided; do not infer from responses to avoid progress inflation
      const visited =
        Array.isArray(savedVisited) && savedVisited.length > 0
          ? new Set(savedVisited)
          : new Set([1, targetQ]);
      setVisitedQuestions(visited);

      const history =
        Array.isArray(savedHistory) && savedHistory.length > 0
          ? savedHistory
          : [1, targetQ];
      setQuestionHistory(history);

      setIsCompleted(false);
    } catch (e) {
      console.warn("Failed to restore questionnaire progress:", e);
    }
  };

  const getProgress = () => {
    return calculateQuestionnaireProgress(visitedQuestions, responses);
  };

  return (
    <QuestionnaireContext.Provider
      value={{
        currentQuestionId,
        responses,
        isCompleted,
        updateResponse,
        goToNextQuestion,
        goToPreviousQuestion,
        markAsCompleted,
        setResponses,
        resetQuestionnaire,
        getProgress,
        restoreProgress,
        // Expose navigation state for persistence (read-only)
        visitedQuestions,
        questionHistory,
        canGoBack: questionHistory.length > 1 && !isCompleted,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
};

export const useQuestionnaire = () => {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error(
      "useQuestionnaire must be used within a QuestionnaireProvider"
    );
  }
  return context;
};
