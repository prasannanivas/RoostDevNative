import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuestionnaire } from "../../context/QuestionnaireContext";
import { questions } from "../../data/questionnaireData";
import QuestionRenderer from "./QuestionRenderer";
import SlideTransition from "./SlideTransition";
import ProgressBar from "./ProgressBar";
import Button from "../common/Button";
import BackButton from "../icons/BackButton";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  generateInitials,
  isCoSignerQuestion,
} from "../../utils/initialsUtils";
import { processDynamicText } from "../../utils/questionnaireUtils";
import Logo from "../Logo";
import CloseIconSvg from "../icons/CloseIconSvg";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#1D2327",
  gray: "#666666",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const Questionnaire = ({ questionnaireData, showCloseButton, onBack }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const {
    currentQuestionId,
    responses,
    updateResponse,
    goToNextQuestion,
    goToPreviousQuestion,
    markAsCompleted,
    setResponses,
    getProgress,
    canGoBack,
    isCompleted,
    restoreProgress,
    visitedQuestions,
    questionHistory,
  } = useQuestionnaire();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [direction, setDirection] = useState("next");

  // Keys builder
  const getKeys = () => {
    const clientId = auth?.client?.id;
    return {
      draftKey: clientId ? `questionnaire:draft:${clientId}` : null,
      firstTimeKey: clientId ? `questionnaire:firstTime:${clientId}` : null,
    };
  };

  // Load first-time flag and any saved draft
  useEffect(() => {
    const initFromStorage = async () => {
      if (!auth?.client?.id) return;
      const { draftKey, firstTimeKey } = getKeys();
      try {
        // Determine if this is first time for this client
        const ft = await AsyncStorage.getItem(firstTimeKey);
        let firstTime = true;
        if (ft === null) {
          // default to true on first ever open
          await AsyncStorage.setItem(firstTimeKey, "true");
          firstTime = true;
        } else {
          firstTime = ft === "true";
        }
        setIsFirstTime(firstTime);

        // If first time and there is a draft, restore it
        if (firstTime) {
          const draftRaw = await AsyncStorage.getItem(draftKey);
          if (draftRaw) {
            try {
              const draft = JSON.parse(draftRaw);
              if (draft && (draft.responses || draft.currentQuestionId)) {
                restoreProgress({
                  currentQuestionId: draft.currentQuestionId ?? 1,
                  responses: draft.responses ?? {},
                  visitedQuestions: draft.visitedQuestions ?? [],
                  questionHistory: draft.questionHistory ?? [],
                });
              }
            } catch (e) {
              console.warn("Failed to parse questionnaire draft:", e);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load questionnaire state:", e);
      } finally {
        setStorageReady(true);
      }
    };

    initFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.client?.id]);

  // Persist draft whenever responses or question changes (only when first time)
  useEffect(() => {
    const persistDraft = async () => {
      if (!storageReady || !isFirstTime) return;
      const { draftKey } = getKeys();
      if (!draftKey) return;
      try {
        await AsyncStorage.setItem(
          draftKey,
          JSON.stringify({
            responses,
            currentQuestionId,
            visitedQuestions: Array.from(visitedQuestions || []),
            questionHistory: questionHistory || [],
          })
        );
      } catch (e) {
        console.warn("Failed to persist questionnaire draft:", e);
      }
    };

    persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    responses,
    currentQuestionId,
    isFirstTime,
    storageReady,
    visitedQuestions,
    questionHistory,
  ]);

  // Handle initial questionnaire data loading
  useEffect(() => {
    console.log(
      "Questionnaire: Initializing with currentQuestionId:",
      currentQuestionId,
      questionnaireData
    );
    if (questionnaireData?.responses) {
      console.log(
        "questionnaireData has responses",
        questionnaireData.responses
      );
      setResponses(questionnaireData.responses);
    }
  }, [questionnaireData, setResponses]);

  // Keyboard visibility listener for Android
  useEffect(() => {
    if (Platform.OS === "android") {
      const keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow",
        () => {
          setKeyboardVisible(true);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        () => {
          setKeyboardVisible(false);
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, []);
  const currentQuestion = questions.find((q) => q.id === currentQuestionId);
  const currentResponse = responses[currentQuestionId];

  // Get user initials from questionnaire responses
  const getUserInitials = () => {
    // Check for primary applicant name in various locations - both paths
    // Question 6 path (Just me flow) OR Question 100 path (Me and a co-signer flow)
    const primaryNameData = {
      firstName:
        responses["6"]?.firstName ||
        responses[6]?.firstName ||
        responses["100"]?.firstName ||
        responses[100]?.firstName ||
        undefined,
      lastName:
        responses["6"]?.lastName ||
        responses[6]?.lastName ||
        responses["100"]?.lastName ||
        responses[100]?.lastName ||
        undefined,
    };

    // Also check direct data in root level
    const rootPrimaryData = {
      firstName: responses.firstName,
      lastName: responses.lastName,
    };

    // Check for co-signee name in question 101 or root level
    const coSigneeNameData = responses["101"] || responses[101] || {};
    // Determine if this question is related to the co-signer using our utility function
    const isCurrQuestionForCoSigner = isCoSignerQuestion(
      currentQuestionId,
      currentQuestion?.text
    );

    // Determine if primary and co-signer names are available
    const hasPrimaryName =
      primaryNameData.firstName ||
      primaryNameData.lastName ||
      rootPrimaryData.firstName ||
      rootPrimaryData.lastName;

    // Check if we have co-signer name information from question 101 responses
    const hasCoSignerName =
      coSigneeNameData.coFirstName || coSigneeNameData.coLastName;

    // If this is a co-signer question, show co-signer initials if available
    // But ONLY if we have COMPLETE co-signer data (both first and last name)
    if (isCurrQuestionForCoSigner && hasCoSignerName) {
      // Get co-signer name from any available source
      const firstName = coSigneeNameData?.coFirstName;

      const lastName = coSigneeNameData?.coLastName;

      // Only show initials if we have both first and last name
      // This prevents showing just a single initial which could be confusing
      if (firstName && lastName) {
        return {
          initials: generateInitials(firstName, lastName),
          isCoSigner: true,
        };
      } else if (firstName) {
        // If we only have first name, just show first initial
        return {
          initials: firstName.charAt(0).toUpperCase(),
          isCoSigner: true,
        };
      } else {
        // If we only have last name or no name, show empty circle with co-signer color
        return {
          initials: "",
          isCoSigner: true,
        };
      }
    }
    // For non-co-signer questions, show primary applicant initials if available
    else if (!isCurrQuestionForCoSigner) {
      // Try to get primary name from any available source
      const firstName = primaryNameData.firstName || rootPrimaryData.firstName;
      const lastName = primaryNameData.lastName || rootPrimaryData.lastName;

      if (firstName || lastName) {
        return {
          initials: generateInitials(firstName, lastName),
          isCoSigner: false,
        };
      }
    } // When we get here, two cases are possible:
    // 1. It's a co-signer question but we don't have co-signer name
    // 2. It's a primary question but we don't have primary name    // For co-signer questions, don't show any initials if co-signer name isn't available yet
    // This prevents showing primary applicant initials in the co-signer entry screen
    if (isCurrQuestionForCoSigner && !hasCoSignerName) {
      return {
        initials: "", // Empty initials, don't show primary user's initials
        isCoSigner: true, // Still use co-signer color since it's a co-signer question
      };
    } // For primary applicant questions, don't show co-signer initials if primary name isn't available
    // This prevents showing co-signer initials in the primary applicant entry screen
    if (!isCurrQuestionForCoSigner && !hasPrimaryName) {
      return {
        initials: "", // Empty initials, don't show co-signer's initials
        isCoSigner: false, // Use primary color since it's a primary question
      };
    } // For question 5 (flow selection) or 100 (primary in co-signer flow)
    if (
      currentQuestionId === "5" ||
      currentQuestionId === 5 ||
      currentQuestionId === "100" ||
      currentQuestionId === 100
    ) {
      // For question 100, only show initials if name already exists in the response
      if (currentQuestionId === "100" || currentQuestionId === 100) {
        const hasPrimaryFirstName = currentResponse?.firstName;
        const hasPrimaryLastName = currentResponse?.lastName;

        if (hasPrimaryFirstName || hasPrimaryLastName) {
          return {
            initials: generateInitials(hasPrimaryFirstName, hasPrimaryLastName),
            isCoSigner: false, // Primary applicant color
          };
        }
      }

      // Otherwise show empty circle
      return {
        initials: "", // Empty initials, no default
        isCoSigner: false, // Primary applicant color
      };
    } // For question 101 (co-signer in co-signer flow), we need special handling
    // This ensures we never show primary user initials when entering co-signer details
    if (currentQuestionId === "101" || currentQuestionId === 101) {
      // We look ONLY at the actual co-signer fields (with 'co' prefix)
      // This prevents using regular firstName/lastName fields which might be primary user data

      // Check if we have co-signer specific name fields in the current response
      const hasCoSignerFirstName = currentResponse?.coFirstName;
      const hasCoSignerLastName = currentResponse?.coLastName;

      // Only show initials if BOTH co-signer first AND last name exist
      // This ensures we only show co-signer initials from the proper fields
      if (hasCoSignerFirstName && hasCoSignerLastName) {
        return {
          initials: generateInitials(hasCoSignerFirstName, hasCoSignerLastName),
          isCoSigner: true, // Co-signer color
        };
      }

      // If we only have co-signer first name but no last name, only show first initial
      if (hasCoSignerFirstName && !hasCoSignerLastName) {
        return {
          initials: hasCoSignerFirstName.charAt(0).toUpperCase(),
          isCoSigner: true, // Co-signer color
        };
      }

      // Otherwise show empty circle with co-signer color
      return {
        initials: "", // Empty initials, no default
        isCoSigner: true, // Co-signer color
      };
    }

    // If we have absolutely no name data, show empty circle with appropriate color
    return {
      initials: "", // Empty initials, no defaults
      isCoSigner: isCurrQuestionForCoSigner,
    };
  }; // Enhanced debug logging for response state and initials

  // Debug specifically for initials
  const handleResponseChange = (value) => {
    // Clear field errors when user changes input
    setFieldErrors({});
    // For all other questions, update normally
    updateResponse(currentQuestionId, value);
  };
  const getNextQuestionId = (requireResponse = false) => {
    if (!currentQuestion) return null;

    // Handle nextQuestionMap (conditional navigation)
    if (currentQuestion.nextQuestionMap) {
      // If we require a response (for auto-navigation) and there's no response, return null
      if (requireResponse && !currentResponse) {
        console.log(
          "Questionnaire: No response available for conditional navigation"
        );
        return null;
      }

      // If there's a response, use it for navigation
      if (currentResponse) {
        // For multiple choice questions, currentResponse is a string
        // For form questions, currentResponse is an object - we don't use nextQuestionMap for forms
        let responseKey = currentResponse;

        // If currentResponse is an object (form data), we shouldn't be using nextQuestionMap
        if (typeof currentResponse === "object" && currentResponse !== null) {
          console.warn(
            "nextQuestionMap used with object response - this should not happen"
          );
          return currentQuestion.nextQuestion;
        }

        // Check if the response key exists in the nextQuestionMap
        if (currentQuestion.nextQuestionMap.hasOwnProperty(responseKey)) {
          return currentQuestion.nextQuestionMap[responseKey];
        } else {
          console.warn("Response key not found in nextQuestionMap:", {
            questionId: currentQuestion.id,
            responseKey,
            availableKeys: Object.keys(currentQuestion.nextQuestionMap),
          });
          // Fallback to nextQuestion if the response key is not found
          return currentQuestion.nextQuestion;
        }
      }

      // If no response and we don't require one, fall back to simple nextQuestion
      return currentQuestion.nextQuestion;
    }

    // Handle simple nextQuestion
    return currentQuestion.nextQuestion;
  };

  const getNextQuestionIdWithResponse = (responseValue) => {
    if (!currentQuestion) return null;

    // Handle nextQuestionMap (conditional navigation)
    if (currentQuestion.nextQuestionMap && responseValue) {
      // For multiple choice questions, responseValue is a string
      // For form questions, responseValue is an object - we don't use nextQuestionMap for forms
      let responseKey = responseValue;

      // If responseValue is an object (form data), we shouldn't be using nextQuestionMap
      if (typeof responseValue === "object" && responseValue !== null) {
        console.warn(
          "nextQuestionMap used with object response - this should not happen"
        );
        return currentQuestion.nextQuestion;
      }

      // Check if the response key exists in the nextQuestionMap
      if (currentQuestion.nextQuestionMap.hasOwnProperty(responseKey)) {
        return currentQuestion.nextQuestionMap[responseKey];
      } else {
        console.warn("Response key not found in nextQuestionMap:", {
          questionId: currentQuestion.id,
          responseKey,
          availableKeys: Object.keys(currentQuestion.nextQuestionMap),
        });
        // Fallback to nextQuestion if the response key is not found
        return currentQuestion.nextQuestion;
      }
    }

    // Handle simple nextQuestion
    return currentQuestion.nextQuestion;
  };
  const handleAutoNavigate = (selectedValue) => {
    // For form questions that collect names, we don't auto-navigate
    // because we need to validate name fields first - they will use the "Looks Good" button
    if (
      currentQuestionId === "6" ||
      currentQuestionId === 6 ||
      currentQuestionId === "100" ||
      currentQuestionId === 100 ||
      currentQuestionId === "101" ||
      currentQuestionId === 101
    ) {
      console.log(
        "Questionnaire: Auto-navigation skipped for name collection question"
      );
      return;
    }

    // Use selectedValue if provided, otherwise fall back to currentResponse
    const responseToUse = selectedValue || currentResponse;
    console.log("Questionnaire: responseToUse:", responseToUse);

    const nextQuestionId = getNextQuestionIdWithResponse(responseToUse);
    console.log("Questionnaire: next question ID:", nextQuestionId);

    if (nextQuestionId) {
      console.log("Questionnaire: Going to next question:", nextQuestionId);
      setDirection("next");
      goToNextQuestion(nextQuestionId);
    } else {
      // This could be either final question or no valid next question
      console.log(
        "Questionnaire: No next question found - could be final or navigation issue"
      );
      if (!responseToUse) {
        console.log(
          "Questionnaire: No response available, auto-navigation cancelled"
        );
      } else {
        console.log("Questionnaire: Final question, submitting...");
        handleSubmit();
      }
    }
  };
  // Helper function to validate name fields for form questions
  const validateNameFields = () => {
    // Check if this is a question that collects name information
    const isNameCollectionQuestion =
      currentQuestionId === "6" ||
      currentQuestionId === 6 ||
      currentQuestionId === "100" ||
      currentQuestionId === 100 ||
      currentQuestionId === "101" ||
      currentQuestionId === 101;

    if (!isNameCollectionQuestion) {
      return true; // Not a name collection question, no validation needed
    }

    // For question 6 or 100 (primary applicant details)
    if (
      currentQuestionId === "6" ||
      currentQuestionId === 6 ||
      currentQuestionId === "100" ||
      currentQuestionId === 100
    ) {
      if (!currentResponse?.firstName || !currentResponse?.lastName) {
        Alert.alert(
          "Required Fields",
          "Please enter both first name and last name to continue."
        );
        return false;
      }
    } // For question 101 (co-signer details)
    if (currentQuestionId === "101" || currentQuestionId === 101) {
      // Only check the proper co-prefixed fields for co-signer details
      // This ensures we're validating the right fields
      const hasCoFirstName = currentResponse?.coFirstName;
      const hasCoLastName = currentResponse?.coLastName;

      if (!hasCoFirstName || !hasCoLastName) {
        Alert.alert(
          "Required Fields",
          "Please enter both first name and last name for your co-signer to continue."
        );
        return false;
      }
    }

    return true;
  };

  // Helper function to validate email, phone, and SIN fields
  const validateContactFields = () => {
    const errors = {};

    // Check if this is a form or complexForm question
    if (
      currentQuestion?.type !== "form" &&
      currentQuestion?.type !== "complexForm"
    ) {
      return true; // Not a form question, no validation needed
    }

    if (!currentResponse) {
      return true; // No response yet, allow empty
    }

    // For form questions (email and phone validation)
    if (currentQuestion?.type === "form") {
      // Validate email fields
      const emailFields = ["email", "coEmail"];
      for (const field of emailFields) {
        if (currentResponse[field]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(currentResponse[field])) {
            errors[field] = "Please enter a valid email address.";
          }
        }
      }

      // Validate phone fields
      const phoneFields = ["phone", "coPhone"];
      for (const field of phoneFields) {
        if (currentResponse[field]) {
          const cleanPhone = currentResponse[field].replace(/\D/g, "");
          if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            errors[field] = "Please enter a valid phone number (10-11 digits).";
          }
        }
      }
    }

    // For complexForm questions (SIN validation) - questions 7, 102, 103
    if (currentQuestion?.type === "complexForm") {
      // Validate SIN fields (only digits)
      const sinFields = ["sinNumber", "coSinNumber"];
      for (const field of sinFields) {
        if (currentResponse[field]) {
          const cleanSIN = currentResponse[field].replace(/\D/g, "");
          if (cleanSIN.length !== 9) {
            errors[field] = "SIN number must be exactly 9 digits.";
          }
        }
      }
    }

    // Set errors in state
    setFieldErrors(errors);

    // Return true if no errors, false if there are errors
    return Object.keys(errors).length === 0;
  };

  // Helper function to check if Continue button should look disabled
  const shouldShowDisabledStyle = () => {
    // Check if current question is a required MCQ
    if (
      currentQuestion?.type === "multipleChoice" &&
      currentQuestion?.required
    ) {
      return !currentResponse;
    }

    // Check if current question is a form with required fields
    if (currentQuestion?.type === "form" && currentQuestion?.fields) {
      // Check if any required field is missing or empty
      const missingRequiredField = currentQuestion.fields.some((field) => {
        if (field.required) {
          // If no response object at all, the field is missing
          if (!currentResponse) return true;

          const value = currentResponse[field.key];
          // Check if value is null, undefined, or empty string
          return !value || (typeof value === "string" && value.trim() === "");
        }
        return false;
      });

      if (missingRequiredField) {
        return true;
      }
    }

    return false;
  };

  const validateRequiredFields = () => {
    const errors = {};

    // Question 2 validation is now handled by validatePreApprovalCriticalFields

    // Check if this is a required question
    if (currentQuestion?.id === 5) {
      // Validate text fields
      if (!currentResponse) {
        console.log("5: cr", currentResponse);
        // Set errors in state
        setFieldErrors({
          5: "Your selection is missing, don’t worry you can always add a co-signer later",
        });
        return false; // No response yet, allow empty
      }
    }
    if ([9, "9", 106, "106", 110, "110"].includes(currentQuestion?.id)) {
      // Validate text fields
      if (!currentResponse) {
        console.log("101-103: cr", currentResponse);
        // Set errors in state
        setFieldErrors({
          [currentQuestion?.id]:
            "Your selection is missing, this field is mandatory for your application",
        });
        return false; // No response yet, allow empty
      }
    }

    // Return true if no errors, false if there are errors
    return true;
  };

  // Helper to validate pre-approval critical fields
  const validatePreApprovalCriticalFields = () => {
    const errors = {};

    // Question 2: Down payment amount (critical for pre-approval)
    if (currentQuestion?.id === 2 || currentQuestion?.id === "2") {
      if (
        !currentResponse?.downPaymentAmount ||
        currentResponse.downPaymentAmount === ""
      ) {
        setFieldErrors({
          downPaymentAmount:
            "This field is crucial for pre-approval calculation",
        });
        return false;
      }
    }

    // Question 11: Income details for main applicant (critical for pre-approval)
    if (
      currentQuestion?.id === 11 ||
      currentQuestion?.id === "11" ||
      currentQuestion?.id === "108" ||
      currentQuestion?.id === 108
    ) {
      const missingFields = [];

      if (!currentResponse?.income || currentResponse.income === "") {
        missingFields.push("Annual Income");
        errors.income = "This field is crucial for pre-approval calculation";
      } else {
        // Validate minimum income requirement
        const incomeValue = parseFloat(
          String(currentResponse.income).replace(/[^0-9.]/g, "")
        );
        if (incomeValue < 15000) {
          errors.income =
            "Sorry, The minimum income should be $15,000 a year or greater";
          setFieldErrors(errors);
          return false;
        }
      }

      if (
        (currentResponse.benefits === "yes" ||
          currentResponse.bonuses === "yes") &&
        (!currentResponse?.bonusComissionAnnualAmount ||
          currentResponse.bonusComissionAnnualAmount === "")
      ) {
        missingFields.push("Bonus/Commission Amount");
        errors.bonusComissionAnnualAmount =
          "This field is crucial for pre-approval calculation";
      }

      if (missingFields.length > 0) {
        setFieldErrors(errors);
        return false;
      }
    }

    // Question 112: Income details for co-applicant (critical for pre-approval if co-signer exists)
    if (currentQuestion?.id === 112 || currentQuestion?.id === "112") {
      const missingFields = [];

      // Always require coIncome
      if (
        !currentResponse?.coIncome ||
        currentResponse.coIncome === "" ||
        currentResponse.coIncome === undefined
      ) {
        missingFields.push("Co-Applicant Annual Income");
        errors.coIncome = "This field is crucial for pre-approval calculation";
      }

      // Only require bonus/commission amount if user selected "yes" for bonuses OR benefits
      const hasBonuses = currentResponse?.coBonuses === "yes";
      const hasBenefits = currentResponse?.coBenefits === "yes";

      if (hasBonuses || hasBenefits) {
        if (
          !currentResponse?.coBonusComissionAnnualAmount ||
          currentResponse.coBonusComissionAnnualAmount === ""
        ) {
          missingFields.push("Co-Applicant Bonus/Commission Amount");
          errors.coBonusComissionAnnualAmount =
            "This field is crucial for pre-approval calculation";
        }
      }

      if (missingFields.length > 0) {
        setFieldErrors(errors);
        return false;
      }
    }

    return true;
  };

  // Helper to validate assets and properties fields
  const validateAssetsAndProperties = () => {
    const errors = {};

    // Question 13: Assets for main applicant
    if (
      currentQuestion?.id === 13 ||
      currentQuestion?.id === "13" ||
      currentQuestion?.id === 116 ||
      currentQuestion?.id === "116"
    ) {
      if (currentResponse?.hasAssets === "yes") {
        // Check if items array exists and has at least one item
        if (!currentResponse?.items || currentResponse.items.length === 0) {
          Alert.alert(
            "Required Information",
            "You selected 'Yes' for assets. Please add at least one asset with item name and value."
          );
          return false;
        }

        // Validate each item has both item name and value
        const invalidItems = currentResponse.items.filter(
          (item) =>
            !item.item || !item.value || item.item === "" || item.value === ""
        );

        if (invalidItems.length > 0) {
          Alert.alert(
            "Required Information",
            "Please fill in both item name and value for all assets."
          );
          return false;
        }
      }
    }

    // Question 14: Properties for main applicant
    if (
      currentQuestion?.id === 14 ||
      currentQuestion?.id === "14" ||
      currentQuestion?.id === 118 ||
      currentQuestion?.id === "118"
    ) {
      if (currentResponse?.hasOtherProperties === "yes") {
        // Check if required fields are filled
        if (!currentResponse?.address || currentResponse.address === "") {
          Alert.alert(
            "Required Information",
            "You selected 'Yes' for other properties. Please enter the property address."
          );
          errors.address = "Property address is required";
          setFieldErrors(errors);
          return false;
        }

        if (!currentResponse?.value || currentResponse.value === "") {
          Alert.alert(
            "Required Information",
            "Please enter the property value."
          );
          errors.value = "Property value is required";
          setFieldErrors(errors);
          return false;
        }
      }
    }

    // Question 117: Assets for co-applicant
    if (currentQuestion?.id === 117 || currentQuestion?.id === "117") {
      if (currentResponse?.coHasAssets === "yes") {
        // Check if coItem array exists and has at least one item
        if (!currentResponse?.coItem || currentResponse.coItem.length === 0) {
          Alert.alert(
            "Required Information",
            "You selected 'Yes' for co-applicant assets. Please add at least one asset with item name and value."
          );
          return false;
        }

        // Validate each item has both item name and value
        const invalidItems = currentResponse.coItem.filter(
          (item) =>
            !item.coItem ||
            !item.coValue ||
            item.coItem === "" ||
            item.coValue === ""
        );

        if (invalidItems.length > 0) {
          Alert.alert(
            "Required Information",
            "Please fill in both item name and value for all co-applicant assets."
          );
          return false;
        }
      }
    }

    // Question 119: Properties for co-applicant
    if (currentQuestion?.id === 119 || currentQuestion?.id === "119") {
      if (currentResponse?.coHasOtherProperties === "yes") {
        // Check if required fields are filled
        if (!currentResponse?.coAddress || currentResponse.coAddress === "") {
          Alert.alert(
            "Required Information",
            "You selected 'Yes' for co-applicant's other properties. Please enter the property address."
          );
          errors.coAddress = "Property address is required";
          setFieldErrors(errors);
          return false;
        }

        if (!currentResponse?.coValue || currentResponse.coValue === "") {
          Alert.alert(
            "Required Information",
            "Please enter the co-applicant's property value."
          );
          errors.coValue = "Property value is required";
          setFieldErrors(errors);
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = async () => {
    // First check if this is a required MCQ with no response - show error and stop

    // First validate name fields if applicable
    if (!validateNameFields()) {
      return; // Stop if validation fails
    }

    // Validate email, phone, and SIN fields
    if (!validateContactFields()) {
      return; // Stop if validation fails
    }

    if (!validateRequiredFields()) {
      return; // Stop if validation fails
    }

    // Validate pre-approval critical fields (Question 2, 11, 112)
    if (!validatePreApprovalCriticalFields()) {
      return; // Stop if validation fails
    }

    // Validate assets and properties fields (Question 13, 14, 117, 119)
    if (!validateAssetsAndProperties()) {
      return; // Stop if validation fails
    }

    if (shouldShowDisabledStyle()) {
      // Handle Form Questions
      if (currentQuestion?.type === "form" && currentQuestion?.fields) {
        const newFieldErrors = {};
        currentQuestion.fields.forEach((field) => {
          if (field.required) {
            const value = currentResponse?.[field.key];
            if (!value || (typeof value === "string" && value.trim() === "")) {
              newFieldErrors[field.key] = "This field is required";
            }
          }
        });
        setFieldErrors(newFieldErrors);
        return;
      }
      if (
        currentQuestion?.type === "multipleChoice" &&
        currentQuestion?.required &&
        !currentResponse
      ) {
        setFieldErrors({
          [currentQuestion?.id]:
            currentQuestion?.errorMessage || "This field is required",
        });
        return;
      }

      // // Set the error message
      // let errorMessage = "This field is required";

      // if (currentQuestion?.id === 5) {
      //   errorMessage =
      //     "Your selection is missing, don't worry you can always add a co-signer later";
      // } else if (
      //   [9, "9", 106, "106", 110, "110"].includes(currentQuestion?.id)
      // ) {
      //   errorMessage =
      //     "Your selection is missing, this field is mandatory for your application";
      // } else if (currentQuestion?.id === 1) {
      //   errorMessage = "Please select an option to continue";
      // } else if (currentQuestion?.id === 4) {
      //   errorMessage = "Please select an option to continue";
      // }

      setFieldErrors({
        [currentQuestion?.id]: errorMessage,
      });
      return; // Stop here - don't proceed
    }

    const nextQuestionId = getNextQuestionId();

    if (nextQuestionId) {
      setDirection("next");
      goToNextQuestion(nextQuestionId);
    } else {
      // This is the final question
      await handleSubmit();

      try {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } catch (error) {
        console.error("Navigation error in Done button:", error);
      }
    }
  };

  const findEmploymentStatusofSelf = (responses) => {
    let employmentStatus = "employed";
    if (responses["5"] === "just_me") {
      if (responses["9"] === "employed") {
        employmentStatus = "Employed";
      } else if (responses["9"] === "self_employed") {
        // Check question 999 for specific self-employed type
        if (responses["999"] === "self_employed_corporation") {
          employmentStatus = "self_employed_corporation";
        } else {
          // Sole proprietor or not specified - use generic Self-employed
          employmentStatus = "Self-employed";
        }
      } else if (responses["9"] === "pension") {
        employmentStatus = "Pension";
      } else if (responses["9"] === "other") {
        employmentStatus = "Other";
      } else {
        employmentStatus = "Unemployed";
      }
      return employmentStatus;
    }
    if (responses["5"] === "co_signer") {
      if (responses["106"] === "employed") {
        employmentStatus = "Employed";
      } else if (responses["106"] === "self_employed") {
        // Check question 998 for specific self-employed type (co-signer flow)
        if (responses["998"] === "self_employed_corporation") {
          employmentStatus = "self_employed_corporation";
        } else {
          // Sole proprietor or not specified - use generic Self-employed
          employmentStatus = "Self-employed";
        }
      } else if (responses["106"] === "pension") {
        employmentStatus = "Pension";
      } else if (responses["106"] === "other") {
        employmentStatus = "Other";
      } else {
        employmentStatus = "Unemployed";
      }
      return employmentStatus;
    }

    console.log("Invalid responses for employment status");
    return "";
  };

  const findEmploymentStatusofCoSigner = (responses) => {
    if (responses["110"] === "employed") {
      return "Employed";
    }
    if (responses["110"] === "self_employed") {
      // Check question 997 for specific self-employed type (co-applicant flow)
      if (responses["997"] === "self_employed_corporation") {
        return "self_employed_corporation";
      } else {
        // Sole proprietor or not specified - use generic Self-employed
        return "Self-employed";
      }
    }
    if (responses["110"] === "pension") {
      return "Pension";
    }
    if (responses["110"] === "other") {
      return "Other";
    }
    if (responses["110"] === "unemployed") {
      return "Unemployed";
    } else {
      console.log("Invalid responses for employment status of co-signer");
      return "";
    }
  };

  const findOwnAnotherPropertySelf = (responses) => {
    if (responses["5"] === "just_me") {
      if (responses["14"]?.hasOtherProperties === "no") {
        return "No";
      }
      if (responses["14"]?.hasOtherProperties === "yes") {
        if (responses["14"]?.hasMortgage === "no") {
          return "Yes - All paid off";
        } else if (responses["14"]?.hasMortgage === "yes") {
          return "Yes - with a mortgage";
        } else {
          return "No";
        }
      }
    }
    if (responses["5"] === "co_signer") {
      if (responses["118"]?.hasOtherProperties === "no") {
        return "No";
      }
      if (responses["118"]?.hasOtherProperties === "yes") {
        if (responses["118"]?.hasMortgage === "no") {
          return "Yes - All paid off";
        } else if (responses["118"]?.hasMortgage === "yes") {
          return "Yes - with a mortgage";
        } else {
          console.error(
            "Question 118 has invalid responses for Property - mortgages"
          );
          return "";
        }
      }
    }

    console.log("Invalid responses for own another property");
    return "";
  };

  const findOwnAnotherPropertyCoSigner = (responses) => {
    if (responses["119"]?.coHasOtherProperties === "no") {
      return "No";
    }
    if (responses["119"]?.coHasOtherProperties === "yes") {
      if (responses["119"]?.coHasMortgage === "no") {
        return "Yes - All paid off";
      } else if (responses["119"]?.coHasMortgage === "yes") {
        return "Yes - with a mortgage";
      } else {
        console.error(
          "Question 119 has invalid responses for Property - mortgages"
        );
        return "";
      }
    }

    console.log("Invalid responses for own another property of co-signer");
    return "";
  };

  const findCoSignerDetails = (responses) => {
    if (responses["5"] === "just_me") {
      return {}; // No co-signer details needed for self
    }
    if (responses["5"] === "co_signer") {
      const coSignerDetails = {
        name:
          responses["101"]?.coFirstName + " " + responses["101"]?.coLastName ||
          "",
        email: responses["101"]?.coEmail || "",
        phone: responses["101"]?.coPhone || "",
        employmentStatus: findEmploymentStatusofCoSigner(responses),
        ownAnotherProperty: findOwnAnotherPropertyCoSigner(responses),
      };
      return coSignerDetails;
    }

    console.log("Invalid responses for co-signer details");
    return {};
  };

  const handleSubmitAndClose = async () => {
    handleSubmit();

    try {
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      console.error("Navigation error in Done button:", error);
    }
  };

  const handleBackPress = () => {
    // If we're on the first question and onBack is provided, call it
    if (currentQuestionId === 1 && onBack) {
      onBack();
    } else {
      // Otherwise use normal back navigation
      setDirection("back");
      goToPreviousQuestion();
    }
  };

  const handleSubmit = async () => {
    if (!auth?.client?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    console.log("Submitting questionnaire with responses:", responses);

    setIsSubmitting(true);
    try {
      await axios.put(
        `https://signup.roostapp.io/client/questionnaire/${auth.client.id}`,
        {
          applyingbehalf: responses["5"]
            ? responses["5"] === "just_me"
              ? "Self"
              : "other"
            : "",
          employmentStatus: findEmploymentStatusofSelf(responses),
          ownAnotherProperty: findOwnAnotherPropertySelf(responses),
          otherDetails: findCoSignerDetails(responses),
          responses,
        }
      );

      markAsCompleted();

      // On successful submit, clear any first-time draft and mark first-time as false
      try {
        const { draftKey, firstTimeKey } = getKeys();
        if (draftKey) await AsyncStorage.removeItem(draftKey);
        if (firstTimeKey) await AsyncStorage.removeItem(firstTimeKey);
        setIsFirstTime(true);
      } catch (e) {
        console.warn("Failed to clear draft or update first-time flag:", e);
      }
      // Alert.alert("Success", "Questionnaire submitted successfully!", [
      //   {
      //     text: "OK",
      //     onPress: () => {
      //       console.log("Navigating after submit");
      //       navigation.reset({
      //         index: 0,
      //         routes: [{ name: "Home" }],
      //       });
      //     },
      //   },
      // ]);
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      Alert.alert("Error", "Failed to submit questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted && currentQuestion?.type === "finalStep") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <QuestionRenderer
            question={currentQuestion}
            value={currentResponse}
            onValueChange={handleResponseChange}
            allResponses={responses}
          />

          <View style={styles.finalStepFooter}>
            <Button
              title={
                isCompleted
                  ? "Done"
                  : currentQuestion.submitButtonText || "Complete"
              }
              style={styles.finalStepButton}
              onPress={() => {
                console.log("Done button pressed");
                try {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Home" }],
                  });
                } catch (error) {
                  console.error("Navigation error in Done button:", error);
                }
              }}
              variant="primary"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#019B8E" />
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <ProgressBar progress={getProgress()} /> */}
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={handleSubmitAndClose}
          >
            <CloseIconSvg />
          </TouchableOpacity>
        )}
      </View>

      {/* Only wrap the ScrollView/content in KeyboardAvoidingView, not the footer */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.logoContainer}>
            <Logo
              width={112}
              height={39}
              variant="black"
              style={styles.brandLogo}
            />
          </View>
          <View style={styles.content}>
            <View style={styles.contentWrapper}>
              {/* Question Header with Initials and Question Text */}
              <View style={styles.questionHeaderRow}>
                {/* Always render the circle, but conditionally style based on type */}
                {(() => {
                  const userInfo = getUserInitials();
                  const hasInitials =
                    userInfo.initials && userInfo.initials.trim() !== "";
                  return hasInitials &&
                    currentQuestion.id > 5 &&
                    currentQuestion.id <= 1000 &&
                    currentQuestion?.type !== "finalStep" ? (
                    <View
                      style={[
                        styles.initialsCircle,
                        !hasInitials && styles.emptyInitialsCircle,
                        userInfo.isCoSigner && styles.coSignerInitialsCircle,
                      ]}
                    >
                      {hasInitials && (
                        <Text style={styles.initialsText}>
                          {userInfo.initials}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <></>
                  );
                })()}
                <Text
                  style={
                    currentQuestion?.type === "finalStep"
                      ? styles.questionTextHeaderFinal
                      : styles.questionTextHeader
                  }
                >
                  {processDynamicText(currentQuestion.text, responses)}
                </Text>
              </View>
              {/* Question Content */}
              <View style={styles.questionContent}>
                <SlideTransition
                  id={currentQuestionId}
                  direction={direction}
                >
                  <QuestionRenderer
                    question={{
                      ...currentQuestion,
                      text: "", // Text is already displayed in the header
                      profileInitials: null,
                    }}
                    value={currentResponse}
                    onValueChange={handleResponseChange}
                    allResponses={responses} // Pass all responses for dynamic text replacement
                    onAutoNavigate={handleAutoNavigate}
                    fieldErrors={fieldErrors} // Pass field errors for display
                  />
                </SlideTransition>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Footer stays outside KeyboardAvoidingView so it remains fixed - Hidden on Android when keyboard is visible */}
      {(Platform.OS === "ios" || !keyboardVisible) && (
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title={
                currentQuestion?.type === "finalStep" ? "Complete" : "Continue"
              }
              onPress={handleNext}
              variant="primary"
              loading={isSubmitting}
              disabled={shouldShowDisabledStyle()}
              canClickDisabled={true}
              style={[
                styles.looksGoodButton,
                shouldShowDisabledStyle() && styles.disabledButton,
              ]}
            />

            {(canGoBack || currentQuestionId === 1) && (
              <Button
                Icon={<BackButton width={26} height={26} color="#FFFFFF" />}
                onPress={handleBackPress}
                variant="outline"
                style={styles.backButton}
              />
            )}
            {/* "Looks Good" button after questions */}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 120, // Add padding at the bottom for better scrolling experience and footer clearance
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24, // Add some top margin
    marginBottom: 32,
  },
  brandLogo: {
    // Logo component will handle its own styling
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 0,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1, // Ensure content takes up available space
    paddingHorizontal: 48, // 8px increment spacing
    overflow: "visible", // Prevent content overflow
    paddingVertical: 24,
  //  backgroundColor: "#952929ff",
    paddingBottom: 120, // No bottom padding to align with footer
    justifyContent: "center", // Center questions vertically
    alignItems: "center",
  },
  contentWrapper: {
    maxWidth: 500, // Consistent maximum width
    minWidth: 310, // Consistent minimum width
    width: "100%",
   /// backgroundColor: "yellow",
    justifyContent: "center", // Center content vertically
  },
  questionHeaderRow: {
    flexDirection: "row",
    alignItems: "center", // Align items center vertically
    marginBottom: 24,
  },
  initialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A7EC0", // Blue color from screenshots for primary applicant
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // For Android shadow
  },
  emptyInitialsCircle: {
    backgroundColor: COLORS.silver, // Light gray for empty state
  },
  coSignerInitialsCircle: {
    backgroundColor: "#FF3B30", // Red color for co-signer to visually distinguish
  },
  closeModalButton: {
    position: "absolute",
    top: 5,
    right: 5,
    padding: 5,
    borderRadius: 8,
    backgroundColor: "#F6F6F6",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  questionTextHeader: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0,
    fontFamily: "Futura",
    color: COLORS.black,
    flex: 1, // Take remaining space in row
  },
  questionContent: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0,
    fontFamily: "Futura",
    color: COLORS.black,
    flex: 1, // Take remaining space in row
  },
  questionTextHeaderFinal: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0,
    textAlign: "center",
    fontFamily: "Futura",
    color: COLORS.black,
    flex: 1, // Take remaining space in row
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "15%",
    justifyContent: "center",
    backgroundColor: COLORS.black, // Dark background
  },
  buttonContainer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    borderWidth: 0,
    backgroundColor: COLORS.black,
    shadowOpacity: 0,
    elevation: 0,
  },
  looksGoodButton: {
    backgroundColor: COLORS.green,
    color: COLORS.white,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 12,
  },
  disabledButton: {
    backgroundColor: "#E8E8E8",
    borderColor: "#E8E8E8",
    color: "#797979",
  },
  fullWidthButton: {
    flex: 1,
  },
  finalStepFooter: {
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  finalStepButton: {
    width: "100%",
    maxWidth: 400, // Limit width for final step button
    backgroundColor: COLORS.green,
    color: COLORS.white,
    borderColor: COLORS.green,
    borderWidth: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Questionnaire;
