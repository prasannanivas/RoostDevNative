import React, { createContext, useState, useContext } from "react";

const QuestionnaireContext = createContext();

export const QuestionnaireProvider = ({ children }) => {
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [responses, setResponses] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([1]));
  const [questionHistory, setQuestionHistory] = useState([1]); // Track actual navigation order

  const updateResponse = (questionId, response) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };
  const goToNextQuestion = (nextQuestionId) => {
    if (nextQuestionId) {
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
    }
  };

  const markAsCompleted = () => {
    setIsCompleted(true);
  };
  const resetQuestionnaire = () => {
    setCurrentQuestionId(1);
    setResponses({});
    setIsCompleted(false);
    setVisitedQuestions(new Set([1]));
    setQuestionHistory([1]);
  };

  const getProgress = () => {
    return (visitedQuestions.size / 121) * 100; // 121 total questions
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
        resetQuestionnaire,
        getProgress,
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
