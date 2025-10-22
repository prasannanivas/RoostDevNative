import React, { useState, useEffect } from "react";
import { questions } from "../../data/questionnaireData";
import QuestionRenderer from "../questionnaire/QuestionRenderer";
import { useQuestionnaire } from "../../context/QuestionnaireContext";
import { useAuth } from "../../context/AuthContext";
import { processDynamicText } from "../../utils/questionnaireUtils";
// import ProgressBar from "../progressBars/ProgressBar";
// import Button from "../common/Button";
// import Logo from "../Logo";
// import BackButton from "../icons/BackButton";
import {
  generateInitials,
  isCoSignerQuestion,
} from "../../utils/initialsUtils";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../Logo";
import Button from "../common/Button";
import BackButton from "../icons/BackButton";
import Svg, { Path, Rect } from "react-native-svg";

/**
 * Category Selection Modal Component for editing specific sections of the questionnaire
 */
const CategorySelectionModal = ({
  visible,
  questionnaireData,
  onClose,
  onSelectCategory,
  logo,
}) => {
  // States for category selection and question rendering
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [isFirstTimeCoSigner, setIsFirstTimeCoSigner] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [localResponses, setLocalResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCoSignerCategories, setShowCoSignerCategories] = useState(false);
  const { auth } = useAuth();
  // Get the questionnaire context
  const { responses, updateResponse, setResponses } = useQuestionnaire();

  // Initialize local responses from provided data or context
  useEffect(() => {
    if (questionnaireData?.responses) {
      console.log("Initializing local responses from questionnaireData");
      setLocalResponses({ ...questionnaireData.responses });
      setResponses(questionnaireData.responses); // Ensure global state is also set
    } else if (responses) {
      console.log("Initializing local responses from context responses");
      setLocalResponses({ ...responses });
    }

    // Only reset co-signer toggle when modal is first opened
    if (!visible) {
      setShowCoSignerCategories(false);
    }
  }, [questionnaireData, visible]);

  // Also update local responses whenever currentQuestionId changes
  // This ensures we're always using fresh data from the global context
  useEffect(() => {
    if (currentQuestionId && responses) {
      console.log(
        `Question ID changed to ${currentQuestionId}, updating local responses from global context`
      );
      // Use the global responses to ensure we have the latest data
      setLocalResponses({ ...responses });
    }
  }, [currentQuestionId, responses]);

  // Get the current question based on ID
  const currentQuestion = currentQuestionId
    ? questions.find(
        (q) =>
          q.id === parseInt(currentQuestionId) || q.id === currentQuestionId
      )
    : null;

  // Get response for current question
  const currentResponse = currentQuestionId
    ? localResponses[currentQuestionId]
    : null;

  // Get user initials from questionnaire responses - similar to Questionnaire.js
  const getUserInitials = () => {
    if (!currentQuestion) return { initials: "", isCoSigner: false };

    // Check for primary applicant name
    const primaryNameData = {
      firstName:
        localResponses["6"]?.firstName ||
        localResponses[6]?.firstName ||
        localResponses["100"]?.firstName ||
        localResponses[100]?.firstName ||
        undefined,
      lastName:
        localResponses["6"]?.lastName ||
        localResponses[6]?.lastName ||
        localResponses["100"]?.lastName ||
        localResponses[100]?.lastName ||
        undefined,
    };

    // Also check direct data in root level
    const rootPrimaryData = {
      firstName: localResponses.firstName,
      lastName: localResponses.lastName,
    };

    // Check for co-signee name in question 101 or root level
    const coSigneeNameData = localResponses["101"] || localResponses[101] || {};

    // Determine if this question is related to the co-signer
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

    // Check if we have co-signer name information
    const hasCoSignerName =
      coSigneeNameData.coFirstName || coSigneeNameData.coLastName;

    // If this is a co-signer question, show co-signer initials if available
    if (isCurrQuestionForCoSigner && hasCoSignerName) {
      const firstName = coSigneeNameData?.coFirstName;
      const lastName = coSigneeNameData?.coLastName;

      if (firstName && lastName) {
        return {
          initials: generateInitials(firstName, lastName),
          isCoSigner: true,
        };
      } else if (firstName) {
        return {
          initials: firstName.charAt(0).toUpperCase(),
          isCoSigner: true,
        };
      } else {
        return {
          initials: "",
          isCoSigner: true,
        };
      }
    }
    // For non-co-signer questions, show primary applicant initials
    else if (!isCurrQuestionForCoSigner) {
      const firstName = primaryNameData.firstName || rootPrimaryData.firstName;
      const lastName = primaryNameData.lastName || rootPrimaryData.lastName;

      if (firstName || lastName) {
        return {
          initials: generateInitials(firstName, lastName),
          isCoSigner: false,
        };
      }
    }

    // Default return - empty initials with appropriate co-signer flag
    return {
      initials: "",
      isCoSigner: isCurrQuestionForCoSigner,
    };
  };

  const findEmploymentStatusofSelf = (responses) => {
    let employmentStatus = "employed";
    if (responses["5"] === "just_me") {
      if (responses["9"] === "employed") {
        employmentStatus = "Employed";
      } else if (responses["9"] === "self_employed") {
        employmentStatus = "Self-employed";
      } else {
        employmentStatus = "Unemployed";
      }
      return employmentStatus;
    }
    if (responses["5"] === "co_signer") {
      if (responses["106"] === "employed") {
        employmentStatus = "Employed";
      } else if (responses["106"] === "self_employed") {
        employmentStatus = "Self-employed";
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
      return "Self-employed";
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

  // Check if we're in co-signer flow based on response to question 5
  const isCoSignerFlow =
    localResponses["5"] === "co_signer" || localResponses[5] === "co_signer";
  console.log(
    "Is co-signer flow:",
    isCoSignerFlow,
    "Response to Q5:",
    localResponses["5"] || localResponses[5]
  );

  // Map the questionnaire categories to our UI categories with dynamic starting question IDs
  // based on whether we're in the co-signer flow or not
  const categoryMapping = {
    basic: {
      id: "basic",
      label: "Basic",
      startQuestionId: 1, // Always starts at question 1 for basic info
    },
    personal_details: {
      id: "personal_details",
      label: "Your Personal Details",
      startQuestionId: isCoSignerFlow ? 100 : 6,
    },
    living_details: {
      id: "living_details",
      label: "Living",
      startQuestionId: isCoSignerFlow ? 104 : 8,
    },
    employment_details: {
      id: "employment_details",
      label: "Employment",
      startQuestionId: isCoSignerFlow ? 106 : 9,
    },
    income_details: {
      id: "income_details",
      label: "Income",
      startQuestionId: isCoSignerFlow ? 108 : 11,
    },
    banking_details: {
      id: "banking_details",
      label: "Banking",
      startQuestionId: isCoSignerFlow ? 114 : 12,
    },
    assets: {
      id: "assets",
      label: "Assets",
      startQuestionId: isCoSignerFlow ? 116 : 13,
    },
    properties: {
      id: "properties",
      label: "Properties",
      startQuestionId: isCoSignerFlow ? 118 : 14,
    },
    co_signer: {
      id: "co_signer",
      label: "Add Co-Signer",
      startQuestionId: 101, // Always starts at 100 regardless of flow
    },
  };

  let co_categoryMapping = null;

  // If we're in co-signer flow, we need to adjust the categories
  if (isCoSignerFlow) {
    co_categoryMapping = {
      personal_details: {
        id: "co_personal_details",
        label: "Your Personal Details",
        startQuestionId: 101, // Always starts at 101 for co-signer
      },
      living_details: {
        id: "co_living_details",
        label: "Living",
        startQuestionId: 105, // Always starts at 105 for co-signer
      },
      employment_details: {
        id: "co_employment_details",
        label: "Employment",
        startQuestionId: 110, // Always starts at 110 for co-signer
      },
      income_details: {
        id: "co_income_details",
        label: "Income",
        startQuestionId: 112, // Always starts at 115 for co-signer
      },
      banking_details: {
        id: "co_banking_details",
        label: "Banking",
        startQuestionId: 115, // Always starts at 120 for co-signer
      },
      assets: {
        id: "co_assets",
        label: "Assets",
        startQuestionId: 117, // Always starts at 125 for co-signer
      },
      properties: {
        id: "co_properties",
        label: "Properties",
        startQuestionId: 119, // Always starts at 127 for co-signer
      },
    };
  }

  // List of categories for the UI, ordered as they should appear
  const primaryCategories = [
    categoryMapping.basic,
    categoryMapping.personal_details,
    categoryMapping.employment_details,
    categoryMapping.living_details,
    categoryMapping.income_details,
    categoryMapping.banking_details,
    categoryMapping.assets,
    categoryMapping.properties,
  ];

  // Co-signer categories to use when toggle is on co-signer mode
  const coSignerCategories =
    isCoSignerFlow && co_categoryMapping
      ? [
          co_categoryMapping.personal_details,
          co_categoryMapping.employment_details,
          co_categoryMapping.living_details,
          co_categoryMapping.income_details,
          co_categoryMapping.banking_details,
          co_categoryMapping.assets,
          co_categoryMapping.properties,
        ]
      : [];

  // Use the appropriate categories based on the toggle state
  const categories =
    isCoSignerFlow && showCoSignerCategories
      ? coSignerCategories
      : primaryCategories;

  // Function to check if a category has missing fields required for pre-approval
  const isCategoryMissingPreApprovalFields = (categoryId) => {
    // Check Basic category - needs downPaymentAmount from question 2
    if (categoryId === "basic") {
      const response2 = localResponses["2"] || localResponses[2] || {};
      console.log("Validating Basic category for pre-approval:", response2);
      if (!response2.downPaymentAmount || response2.downPaymentAmount === "") {
        return true;
      }
    }

    // Check Income Details category for main applicant - needs income and bonuses from question 11
    if (categoryId === "income_details") {
      const response11 =
        localResponses["11"] ||
        localResponses[11] ||
        localResponses["108"] ||
        localResponses[108] ||
        {};

      if (
        !response11.income ||
        response11.income === "" ||
        ((response11.benefits === "yes" || response11.bonuses === "yes") &&
          (!response11.bonusComissionAnnualAmount ||
            response11.bonusComissionAnnualAmount === ""))
      ) {
        return true;
      }
    }

    // Check Income Details category for co-applicant - needs coIncome and coBonuses from question 112
    if (categoryId === "co_income_details" && isCoSignerFlow) {
      const response112 = localResponses["112"] || localResponses[112] || {};
      if (
        !response112.coIncome ||
        response112.coIncome === "" ||
        ((response112.coBenefits === "yes" ||
          response112.coBonuses === "yes") &&
          (!response112.coBonusComissionAnnualAmount ||
            response112.coBonusComissionAnnualAmount === ""))
      ) {
        return true;
      }
    }

    return false;
  };

  const handleAddCoSigner = () => {
    setIsFirstTimeCoSigner(true);
    // 1. Change response for question 5 from "just_me" to "co_signer"
    const updatedResponses = {
      ...localResponses,
      5: "co_signer",
    };

    // 2. Copy all responses from primary questions (6-14) to co-signer equivalent questions (100, 102, etc.)
    // Map of primary question IDs to their co-signer equivalents
    const primaryToCoSignerMap = {
      6: "100", // Personal details
      7: "102", // Email/phone in personal details
      8: "104", // Living situation
      9: "106", // Employment status
      10: "107", // Employment details
      11: "108", // Income
      12: "114", // Banking
      13: "116", // Assets
      14: "118", // Properties
    };

    // Copy responses from primary to co-signer questions
    Object.entries(primaryToCoSignerMap).forEach(([primaryId, coSignerId]) => {
      if (updatedResponses[primaryId]) {
        // Handle different types of responses appropriately
        if (typeof updatedResponses[primaryId] === "string") {
          // For string responses (like employment status), copy directly
          updatedResponses[coSignerId] = updatedResponses[primaryId];
        } else {
          // For object responses (like forms with multiple fields), spread the object
          updatedResponses[coSignerId] = { ...updatedResponses[primaryId] };
        }
        console.log(
          `Copied response from ${primaryId} to ${coSignerId}:`,
          updatedResponses[coSignerId]
        );
      }
    });

    // Update both local and global state with the updated responses
    setLocalResponses(updatedResponses);
    if (setResponses) {
      setResponses(updatedResponses);
    }

    // 3. Navigate to question 101 (co-signer details)
    setCurrentCategory("co_personal_details");
    setCurrentQuestionId("101");
    setShowQuestions(true);
    //setShowCoSignerCategories(true); // Show co-signer categories in the UI
  };

  // Handle category selection - show questions for that category
  const handleCategorySelect = (categoryId, startQuestionId) => {
    setCurrentCategory(categoryId);
    setCurrentQuestionId(startQuestionId.toString());
    setShowQuestions(true);
  };

  // Handle response change for questions
  const handleResponseChange = (value) => {
    setFieldErrors({});

    // Log the value being saved
    console.log(`Saving response for question ${currentQuestionId}:`, value);

    // Update our local state immediately
    setLocalResponses((prev) => {
      const updated = {
        ...prev,
        [currentQuestionId]: value,
      };
      console.log(
        `Updated local responses for question ${currentQuestionId}`,
        updated
      );
      return updated;
    });
  };

  // Get next question ID based on current question and response
  const getNextQuestionId = (responseValue) => {
    if (!currentQuestion) return null;

    // Determine the next question ID based on response
    let nextQuestionId = null;

    // Handle nextQuestionMap (conditional navigation)
    if (currentQuestion.nextQuestionMap && responseValue) {
      // For multiple choice questions, responseValue is a string
      let responseKey = responseValue;

      // If responseValue is an object (form data), we shouldn't be using nextQuestionMap
      if (typeof responseValue === "object" && responseValue !== null) {
        console.warn(
          "nextQuestionMap used with object response - this should not happen"
        );
        nextQuestionId = currentQuestion.nextQuestion;
      }
      // Check if the response key exists in the nextQuestionMap
      else if (currentQuestion.nextQuestionMap.hasOwnProperty(responseKey)) {
        nextQuestionId = currentQuestion.nextQuestionMap[responseKey];
      } else {
        console.warn("Response key not found in nextQuestionMap:", {
          questionId: currentQuestion.id,
          responseKey,
          availableKeys: Object.keys(currentQuestion.nextQuestionMap),
        });
        nextQuestionId = currentQuestion.nextQuestion;
      }
    } else {
      // Handle simple nextQuestion
      nextQuestionId = currentQuestion.nextQuestion;
    }

    if (
      isFirstTimeCoSigner &&
      nextQuestionId &&
      [
        "101",
        101,
        "103",
        103,
        "105",
        105,
        "110",
        110,
        "111",
        111,
        "113",
        113,
        "115",
        115,
        "117",
        117,
        "119",
        119,
      ].includes(nextQuestionId)
    ) {
      if (nextQuestionId === "121") {
        setIsFirstTimeCoSigner(false);
        return null;
      }
      return nextQuestionId;
    }

    // If we have a next question ID, check if it belongs to the same category
    if (nextQuestionId) {
      const nextQuestion = questions.find(
        (q) => q.id === parseInt(nextQuestionId) || q.id === nextQuestionId
      );

      // Only proceed if we found the next question
      if (nextQuestion) {
        // Compare categories directly from the question objects
        const currentCategory = currentQuestion.category;
        const nextCategory = nextQuestion.category;

        console.log(
          `Current category: ${currentCategory}, Next category: ${nextCategory}`
        );

        // Only return the next question ID if it's in the same category
        if (
          currentCategory &&
          nextCategory &&
          currentCategory === nextCategory
        ) {
          console.log(
            `Next question (${nextQuestionId}) is in the same category: ${currentCategory}`
          );
          return nextQuestionId;
        } else {
          console.log(
            `Next question is in a different category: Current=${currentCategory}, Next=${nextCategory}, QuestionID=${nextQuestionId}. Ending this section and saving...`
          );
          return null; // End of this category
        }
      }
    }

    return null; // No next question
  };

  // Go to next question
  const goToNextQuestion = (nextQuestionId) => {
    setCurrentQuestionId(nextQuestionId.toString());
  };

  // Go back to previous question
  const goToPreviousQuestion = () => {
    // This would require maintaining a navigation stack
    // For now, just go back to category selection
    handleBackToCategories();
  };

  // Handle going back to category selection
  const handleBackToCategories = () => {
    // Update the main context with our local changes before going back
    if (setResponses && Object.keys(localResponses).length > 0) {
      console.log(
        "Updating global responses before going back to categories:",
        localResponses
      );
      // Create a fresh copy to ensure we're not affected by reference issues
      const updatedResponses = { ...localResponses };

      // Force global state update with our latest local changes
      setResponses(updatedResponses);

      // Log confirmation of update
      console.log(
        "Global responses updated with local changes:",
        updatedResponses
      );
    } else {
      console.warn(
        "Not updating global responses - empty local responses or no setResponses function"
      );
    }

    setShowQuestions(false);
    setCurrentCategory(null);
    setCurrentQuestionId(null);

    // Removed the reset of showCoSignerCategories to preserve its state when going back
  };

  // Save and complete this section
  const handleSaveSection = async (arg = false) => {
    if (!validateNameFields()) return;
    if (!validateContactFields()) return;
    if (!validateRequiredFields()) return;

    // Validate pre-approval critical fields (Question 2, 11, 112)
    if (!validatePreApprovalCriticalFields()) return;

    // Support being called as an event handler (first arg is event) or with a boolean flag
    const withoutAlert = typeof arg === "boolean" ? arg : false;
    // Get auth context properly

    console.log("handleSaveSection withoutAlert:", withoutAlert);

    if (!auth?.client?.id) {
      console.log("No client ID available, cannot submit questionnaire");
      // Still update local state but don't submit to backend
      if (setResponses && Object.keys(localResponses).length > 0) {
        setResponses(localResponses);
      }
      if (!withoutAlert) {
        handleBackToCategories();
      }
      return;
    }
    console.log("Submitting questionnaire with responses:", localResponses);

    setIsSubmitting(true);

    try {
      // Get data from responses for API submission
      const currentDate = new Date().toISOString().split("T")[0];

      // Find employment status of self/primary applicant

      // First update the context with our local changes
      if (setResponses && Object.keys(localResponses).length > 0) {
        setResponses(localResponses);
        console.log("Updated responses in context:", localResponses);
      } else {
        console.error("localResponses is empty. Cannot update context.");
      }

      // Make the actual API call to save the questionnaire data with the correct endpoint
      const apiEndpoint = `https://signup.roostapp.io/client/questionnaire/${auth.client.id}`;

      // Create a fresh copy of responses to ensure we're using the most up-to-date data
      // Use the most recent localResponses state which should contain all changes
      const currentResponses = { ...localResponses };
      console.log("SUBMISSION - Current local responses:", currentResponses);

      // Double check if any values need to be updated from the global context
      // This ensures we have the most up-to-date data from both local and global state
      if (responses) {
        for (const key in responses) {
          if (!currentResponses[key] && responses[key]) {
            currentResponses[key] = responses[key];
            console.log(
              `Added missing response for question ${key} from global context`
            );
          }
        }
      }

      // Prepare the data for submission with the requested format
      const submissionData = {
        applyingbehalf: currentResponses["5"] === "just_me" ? "Self" : "other",
        employmentStatus: findEmploymentStatusofSelf(currentResponses),
        ownAnotherProperty: findOwnAnotherPropertySelf(currentResponses),
        otherDetails: findCoSignerDetails(currentResponses),
        responses: currentResponses,
      };

      // Make the API call
      console.log("Sending API request to:", apiEndpoint);
      console.log(
        "With submission data:",
        JSON.stringify(submissionData, null, 2)
      );

      const response = await fetch(apiEndpoint, {
        method: "PUT", // Using PUT as specified in your example
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Questionnaire responses saved successfully:", data);

      // Show success message (only when not silent)
      if (!withoutAlert) {
        // Alert.alert("Success", "Your changes have been saved successfully!");
      }
    } catch (error) {
      console.error("Error saving questionnaire responses:", error);
      // Keep error alert so users know if background save fails
      Alert.alert(
        "Error",
        "There was a problem saving your responses. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      if (!withoutAlert) {
        console.log("Returning to category selection after save attempt");
        handleBackToCategories();
      } else {
        console.log("Silent save finished; staying on current screen.");
      }
    }
  };

  // Handle next button click

  // Helper function to validate name fields for form questions (mirrors Questionnaire.js)
  const validateNameFields = () => {
    const isNameCollectionQuestion =
      currentQuestionId === "6" ||
      currentQuestionId === 6 ||
      currentQuestionId === "100" ||
      currentQuestionId === 100 ||
      currentQuestionId === "101" ||
      currentQuestionId === 101;

    if (!isNameCollectionQuestion) return true;

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
    }

    // For question 101 (co-signer details)
    if (currentQuestionId === "101" || currentQuestionId === 101) {
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

  // Helper function to validate email, phone, and SIN fields (mirrors Questionnaire.js)
  const validateContactFields = () => {
    const errors = {};

    if (
      currentQuestion?.type !== "form" &&
      currentQuestion?.type !== "complexForm"
    ) {
      return true;
    }

    if (!currentResponse) return true;

    if (currentQuestion?.type === "form") {
      // Email fields
      const emailFields = ["email", "coEmail"];
      for (const field of emailFields) {
        if (currentResponse[field]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(currentResponse[field])) {
            errors[field] = "Please enter a valid email address.";
          }
        }
      }

      // Phone fields
      const phoneFields = ["phone", "coPhone"];
      for (const field of phoneFields) {
        if (currentResponse[field]) {
          const cleanPhone = String(currentResponse[field]).replace(/\D/g, "");
          if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            errors[field] = "Please enter a valid phone number (10-11 digits).";
          }
        }
      }
    }

    if (currentQuestion?.type === "complexForm") {
      // SIN fields
      const sinFields = ["sinNumber", "coSinNumber"];
      for (const field of sinFields) {
        if (currentResponse[field]) {
          const cleanSIN = String(currentResponse[field]).replace(/\D/g, "");
          if (cleanSIN.length !== 9) {
            errors[field] = "SIN number must be exactly 9 digits.";
          }
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper for required questions (mirrors Questionnaire.js)
  const validateRequiredFields = () => {
    const errors = {};

    if (currentQuestion?.id === 5) {
      if (!currentResponse) {
        setFieldErrors({
          5: "Your selection is missing, don’t worry you can always add a co-signer later",
        });
        return false;
      }
    }

    if ([9, "9", 106, "106", 110, "110"].includes(currentQuestion?.id)) {
      if (!currentResponse) {
        errors[currentQuestion?.id] =
          "Your selection is missing, this field is mandatory for your application";
        setFieldErrors(errors);
        return false;
      }
    }

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
    if (currentQuestion?.id === 11 || currentQuestion?.id === "11") {
      const missingFields = [];

      // Always require income
      if (
        !currentResponse?.income ||
        currentResponse.income === "" ||
        currentResponse.income === undefined
      ) {
        missingFields.push("Annual Income");
        errors.income = "This field is crucial for pre-approval calculation";
      }

      // Only require bonus/commission amount if user selected "yes" for bonuses OR benefits
      const hasBonuses = currentResponse?.bonuses === "yes";
      const hasBenefits = currentResponse?.benefits === "yes";

      if (hasBonuses || hasBenefits) {
        if (
          !currentResponse?.bonusComissionAnnualAmount ||
          currentResponse.bonusComissionAnnualAmount === ""
        ) {
          missingFields.push("Bonus/Commission Amount");
          errors.bonusComissionAnnualAmount =
            "This field is crucial for pre-approval calculation";
        }
      }

      if (missingFields.length > 0) {
        Alert.alert(
          "Pre-Approval Required Fields",
          `The following fields are crucial for calculating your pre-approval:\n\n${missingFields.join(
            "\n"
          )}\n\nPlease enter this information to continue.`
        );
        setFieldErrors(errors);
        return false;
      }
    }

    // Question 112: Income details for co-applicant (critical for pre-approval if co-signer exists)
    if (currentQuestion?.id === 112 || currentQuestion?.id === "112") {
      const missingFields = [];
      console.log("Validating co-applicant income fields:", currentResponse);

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

  const hasNext = () => {
    if (!currentQuestion) return false;
    return !!getNextQuestionId(currentResponse);
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    // Run the same three validations as in Questionnaire.js
    if (!validateNameFields()) return;
    if (!validateContactFields()) return;
    if (!validateRequiredFields()) return;

    // Validate pre-approval critical fields (Question 2, 11, 112)
    if (!validatePreApprovalCriticalFields()) return;

    // First update the context with our local changes
    if (setResponses && Object.keys(localResponses).length > 0) {
      setResponses(localResponses);
      console.log("Updated responses in context:", localResponses);
    } else {
      console.error("localResponses is empty. Cannot update context.");
    }

    // Check if this is a question that needs validation
    const isFormQuestion =
      currentQuestion.type === "form" ||
      currentQuestion.type === "complexForm" ||
      currentQuestion.type === "conditionalForm";

    if (isFormQuestion) {
      // Additional per-field validation could go here if needed.
    }

    const nextQuestionId = getNextQuestionId(currentResponse);
    if (nextQuestionId) {
      if (
        isFirstTimeCoSigner &&
        !(nextQuestionId === "121" || nextQuestionId === 121)
      ) {
        console.log(
          "First time co-signer, saving silently and going to next question:",
          nextQuestionId
        );
        // Silent save for each step in first-time co-signer flow
        handleSaveSection(true);
      }
      goToNextQuestion(nextQuestionId);
    } else {
      // No more questions in this category - save changes and go back
      console.log("End of category reached. Saving changes...");
      handleSaveSection(); // This will save via API and then handle the navigation
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {!showQuestions ? (
            // Category selection view
            <View style={styles.container}>
              {/* Logo at the top */}
              <View style={styles.logoContainer}>
                <Logo
                  width={120}
                  height={42}
                  variant="black"
                  style={styles.brandLogo}
                />
              </View>

              {/* Toggle between primary and co-signer (only shown in co-signer flow) */}
              {isCoSignerFlow && (
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      !showCoSignerCategories && {
                        ...styles.toggleButtonActive,
                        backgroundColor: COLORS.blue,
                      },
                    ]}
                    onPress={() => setShowCoSignerCategories(false)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        !showCoSignerCategories && styles.toggleTextActive,
                      ]}
                    >
                      {generateInitials(
                        localResponses["6"]?.firstName ||
                          localResponses[6]?.firstName ||
                          localResponses["100"]?.firstName ||
                          localResponses[100]?.firstName ||
                          undefined,
                        localResponses["6"]?.lastName ||
                          localResponses[6]?.lastName ||
                          localResponses["100"]?.lastName ||
                          localResponses[100]?.lastName ||
                          undefined
                      )}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      showCoSignerCategories && {
                        ...styles.toggleButtonActive,
                        backgroundColor: "#A20E0E",
                      },
                    ]}
                    onPress={() => setShowCoSignerCategories(true)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        showCoSignerCategories && styles.toggleTextActive,
                      ]}
                    >
                      {generateInitials(
                        localResponses["101"]?.coFirstName ||
                          localResponses[101]?.coFirstName ||
                          responses["101"]?.coFirstName ||
                          responses[101]?.coFirstName ||
                          undefined,
                        localResponses["101"]?.coLastName ||
                          localResponses[101]?.coLastName ||
                          responses["101"]?.coLastName ||
                          responses[101]?.coLastName ||
                          undefined
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.title}>
                Which section do you want to add/edit?
              </Text>

              {/* Category buttons */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
                {categories.map((category) => {
                  const hasWarning = isCategoryMissingPreApprovalFields(
                    category.id
                  );

                  return (
                    <View key={category.id} style={styles.categoryWrapper}>
                      <TouchableOpacity
                        style={styles.categoryButton}
                        onPress={() =>
                          handleCategorySelect(
                            category.id,
                            category.startQuestionId
                          )
                        }
                      >
                        <Text style={styles.categoryText}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                      {hasWarning && (
                        <View style={styles.warningBadge}>
                          <Text style={styles.warningText}>
                            ⚠️ Required for Pre-Approval
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Add Co-Signer Button - Only show when viewing primary applicant categories */}
                {!isCoSignerFlow && (
                  <TouchableOpacity
                    style={styles.coSignerButton}
                    onPress={() => handleAddCoSigner()}
                  >
                    <View style={styles.coSignerButtonContainer}>
                      <Svg
                        width="59"
                        height="58"
                        viewBox="0 0 59 58"
                        fill="none"
                      >
                        <Rect
                          x="1"
                          y="1"
                          width="54"
                          height="54"
                          rx="27"
                          fill="#F0913A"
                        />
                        <Path
                          d="M31.8181 36.909C31.8181 34.0974 28.3992 31.8181 24.1818 31.8181C19.9643 31.8181 16.5454 34.0974 16.5454 36.909M36.909 33.0908V29.2727M36.909 29.2727V25.4545M36.909 29.2727H33.0909M36.909 29.2727H40.7272M24.1818 27.9999C21.3701 27.9999 19.0909 25.7207 19.0909 22.909C19.0909 20.0974 21.3701 17.8181 24.1818 17.8181C26.9934 17.8181 29.2727 20.0974 29.2727 22.909C29.2727 25.7207 26.9934 27.9999 24.1818 27.9999Z"
                          stroke="#FDFDFD"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                    <Text style={styles.coSignerButtonText}>ADD CO-SIGNER</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          ) : (
            // Question view - displays when a category is selected
            <View style={styles.container}>
              {/* Header with progress bar */}
              <View style={styles.header}>
                {/* Fixed progress for simplicity, can be dynamic */}
              </View>

              {/* Back button and logo for question view */}
              <View style={styles.headerContainer}>
                {/* <TouchableOpacity onPress={handleBackToCategories} style={{}}>
                  <Ionicons
                    name="arrow-back-outline"
                    size={24}
                    color={COLORS.black}
                  />
                </TouchableOpacity> */}
                {/* <View style={{ width: 24 }} /> */}
                <View style={styles.logoContainer}>
                  <Logo
                    width={120}
                    height={42}
                    variant="black"
                    style={styles.brandLogo}
                  />
                </View>
              </View>

              {/* Question content */}
              <ScrollView
                style={styles.questionScrollView}
                contentContainerStyle={styles.questionScrollViewContent}
              >
                {currentQuestion && (
                  <>
                    {/* Question Header with Initials and Question Text */}
                    <View style={styles.questionHeaderRow}>
                      {/* Display user initials */}
                      {(() => {
                        const userInfo = getUserInitials();
                        const hasInitials =
                          userInfo.initials && userInfo.initials.trim() !== "";
                        return hasInitials &&
                          currentQuestion.id > 5 &&
                          currentQuestion?.type !== "finalStep" ? (
                          <View
                            style={[
                              styles.initialsCircle,
                              !hasInitials && styles.emptyInitialsCircle,
                              userInfo.isCoSigner &&
                                styles.coSignerInitialsCircle,
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

                      {/* Question text header */}
                      <Text style={styles.questionTextHeader}>
                        {processDynamicText(
                          currentQuestion.text,
                          localResponses
                        )}
                      </Text>
                    </View>

                    {/* Question renderer */}
                    <View style={styles.questionContent}>
                      <QuestionRenderer
                        question={{
                          ...currentQuestion,
                          text: "", // Text is already displayed in the header
                        }}
                        value={currentResponse}
                        onValueChange={handleResponseChange}
                        allResponses={localResponses}
                        onAutoNavigate={null}
                        fieldErrors={fieldErrors}
                      />
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      {!showQuestions ? (
        <View style={styles.footer}>
          <View
            style={[
              styles.buttonContainer,
              { justifyContent: "center", transform: [{ rotate: "270deg" }] },
            ]}
          >
            <Button
              Icon={<BackButton width={30} height={30} color="#FFFFFF" />}
              onPress={onClose}
              variant="outline"
              style={styles.backButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <View style={{ transform: [{ rotate: "270deg" }] }}>
              <Button
                Icon={<BackButton width={30} height={30} color="#FFFFFF" />}
                onPress={handleBackToCategories}
                variant="outline"
                style={styles.backButton}
              />
            </View>

            {hasNext() ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}> Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, isSubmitting && { opacity: 0.6 }]}
                onPress={() => {
                  if (!isSubmitting) handleSaveSection(false);
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator
                      color={COLORS.white}
                      size="small"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.nextButtonText}>Saving...</Text>
                  </>
                ) : (
                  <Text style={styles.nextButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </Modal>
  );
};

// Define colors based on your design system
const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  blue: "#2271B1",
  orange: "#F0913A",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  logoContainer: {
    marginVertical: 20,
    alignSelf: "center",
  },
  logoText: {
    fontFamily: "Futura",
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.black,
    textDecorationLine: "underline",
    textDecorationColor: COLORS.orange,
  },
  title: {
    fontSize: 16,
    fontFamily: "Futura",
    color: COLORS.slate,
    marginBottom: 24,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    // height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    marginBottom: 20,
    padding: 4,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontFamily: "Futura",
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.slate,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  // Initials and question header styles
  questionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  initialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A7EC0", // Blue color for primary applicant
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyInitialsCircle: {
    backgroundColor: COLORS.silver,
  },
  coSignerInitialsCircle: {
    backgroundColor: "#A20E0E", // Red color for co-signer
  },
  initialsText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  questionTextHeader: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.black,
    flex: 1,
  },
  questionContent: {
    width: "100%",
    marginBottom: 24,
  },
  scrollView: {
    width: "100%",
    paddingBottom: 64,
    flex: 1,
  },
  scrollViewContent: {
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  categoryWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  categoryText: {
    color: COLORS.green,
    fontFamily: "Futura",
    fontSize: 12,
    fontWeight: "700",
  },
  warningBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  warningText: {
    color: "#F0913A",
    fontFamily: "Futura",
    fontSize: 10,
    fontWeight: "500",
  },
  coSignerButton: {
    minWidth: 271,
    height: 56,
    borderRadius: 30,
    backgroundColor: "#F0913A", // Orange color
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  coSignerButtonContainer: {},
  coSignerButtonText: {
    color: COLORS.white,
    fontFamily: "Futura",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomIndicator: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    alignItems: "center",
  },
  footer: {
    position: Platform.OS === "ios" ? "absolute" : "relative",
    bottom: 0,
    width: "100%",
    height: 100,
    justifyContent: "center",
    backgroundColor: COLORS.black,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  cancelButton: {
    backgroundColor: COLORS.green,
    color: COLORS.white,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    maxWidth: 300,
  },
  cancelText: {
    color: COLORS.white,
    fontFamily: "Futura",
    fontSize: 16,
    fontWeight: "700",
  },

  // Question view styles
  header: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 0,
    width: "100%",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backButton: {
    borderWidth: 0,
    backgroundColor: COLORS.black,
    shadowOpacity: 0,
    elevation: 0,
  },
  questionLogoContainer: {
    alignItems: "center",
  },
  questionScrollView: {
    width: "100%",
    flex: 1,
  },
  questionScrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  navigationButton: {
    backgroundColor: COLORS.white,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 113,
  },
  navigationButtonText: {
    color: COLORS.green,
    fontFamily: "Futura",
    fontSize: 12,
    fontWeight: "700",
  },
  nextButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "48%",
  },
  nextButtonText: {
    color: COLORS.white,
    fontFamily: "Futura",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },
});

export default CategorySelectionModal;
