import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useQuestionnaire } from "../../context/QuestionnaireContext";
import { questions } from "../../data/questionnaireData";
import QuestionRenderer from "./QuestionRenderer";
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

const Questionnaire = ({ navigation }) => {
  const { auth } = useAuth();
  const {
    currentQuestionId,
    responses,
    updateResponse,
    goToNextQuestion,
    goToPreviousQuestion,
    markAsCompleted,
    getProgress,
    canGoBack,
    isCompleted,
  } = useQuestionnaire();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const userInfo = getUserInitials();
  console.log("Questionnaire Debug:", {
    currentQuestionId,
    currentResponse,
    responseType: typeof currentResponse,
    hasNextQuestionMap: !!currentQuestion?.nextQuestionMap,
    userInfo, // Log the current user info with initials and type
  });

  // Debug specifically for initials
  console.log("Initials Debug:", {
    initials: userInfo.initials,
    isCoSigner: userInfo.isCoSigner,
    currentQuestionId,
    isCoSignerQuestion: isCoSignerQuestion(
      currentQuestionId,
      currentQuestion?.text
    ),
    q101Data: responses["101"] || responses[101],
    currentResponseData: {
      firstName: currentResponse?.firstName,
      lastName: currentResponse?.lastName,
      coFirstName: currentResponse?.coFirstName,
      coLastName: currentResponse?.coLastName,
    },
  });
  const handleResponseChange = (value) => {
    // For all other questions, update normally
    updateResponse(currentQuestionId, value);
  };
  const getNextQuestionId = (requireResponse = false) => {
    console.log(
      "Questionnaire: Using nextQuestionMap for question",
      currentQuestion,
      currentResponse,
      "requireResponse:",
      requireResponse
    );

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
    console.log(
      "Questionnaire: getNextQuestionIdWithResponse called with:",
      responseValue
    );

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
    console.log(
      "Questionnaire: handleAutoNavigate called with selectedValue:",
      selectedValue
    );
    console.log(
      "Questionnaire: Current question has nextQuestionMap:",
      !!currentQuestion?.nextQuestionMap
    );
    console.log(
      "Questionnaire: nextQuestionMap:",
      currentQuestion?.nextQuestionMap
    );
    console.log(
      "Questionnaire: currentResponse for auto-nav:",
      currentResponse
    );

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

  const handleNext = () => {
    // First validate name fields if applicable
    if (!validateNameFields()) {
      return; // Stop if validation fails
    }

    const nextQuestionId = getNextQuestionId();

    if (nextQuestionId) {
      goToNextQuestion(nextQuestionId);
    } else {
      // This is the final question
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!auth?.client?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(
        `http://159.203.58.60:5000/client/questionnaire/${auth.client.id}`,
        { responses }
      );

      markAsCompleted();
      Alert.alert("Success", "Questionnaire submitted successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      Alert.alert("Error", "Failed to submit questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (!currentResponse) return true;

    // For form types, check if all required fields are filled
    if (
      currentQuestion?.type === "form" ||
      currentQuestion?.type === "complexForm"
    ) {
      if (typeof currentResponse === "object" && currentResponse !== null) {
        const requiredFields = currentQuestion.fields || [];
        if (currentQuestion.sections) {
          // Flatten fields from sections
          requiredFields.push(
            ...currentQuestion.sections.flatMap((s) => s.fields || [])
          );
        }

        return requiredFields.some((field) => !currentResponse[field.key]);
      }
    }

    return false;
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

          <View style={styles.footer}>
            <Button
              title={currentQuestion.submitButtonText || "Complete"}
              onPress={() => navigation.goBack()}
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
        <ProgressBar progress={getProgress()} />
      </View>
      <View style={styles.logoContainer}>
        <Logo
          width={120}
          height={42}
          variant="black"
          style={styles.brandLogo}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.content}>
          <View style={styles.contentWrapper}>
            {/* Question Header with Initials and Question Text */}
            <View style={styles.questionHeaderRow}>
              {/* Always render the circle, but conditionally style based on type */}
              {(() => {
                const userInfo = getUserInitials();
                const hasInitials =
                  userInfo.initials && userInfo.initials.trim() !== "";
                return hasInitials ? (
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
              <Text style={styles.questionTextHeader}>
                {processDynamicText(currentQuestion.text, responses)}
              </Text>
            </View>
            {/* Question Content */}
            <View style={styles.questionContent}>
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
              />
            </View>
            {/* "Looks Good" button after questions */}
            {currentQuestion?.type !== "multipleChoice" && (
              <Button
                title="Looks Good"
                onPress={handleNext}
                variant="secondary"
                loading={isSubmitting}
                style={styles.looksGoodButton}
              />
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {canGoBack && (
            <Button
              Icon={<BackButton width={26} height={26} color="#FFFFFF" />}
              onPress={goToPreviousQuestion}
              variant="outline"
              style={styles.backButton}
            />
          )}
        </View>
      </View>
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
    paddingBottom: 32, // Add padding at the bottom for better scrolling experience
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 48, // 8px increment spacing
    marginBottom: 32,
  },
  brandLogo: {
    // Logo component will handle its own styling
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  content: {
    minHeight: "70%", // Ensure content takes up most of the screen
    paddingHorizontal: 48, // 8px increment spacing
    paddingVertical: 24,
    paddingBottom: 120, // No bottom padding to align with footer
    justifyContent: "center", // Center questions vertically
  },
  contentWrapper: {
    maxWidth: 500, // Consistent maximum width
    alignItems: "stretch", // Stretch items to fill container width
    justifyContent: "space-between", // Space between vertically
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
  looksGoodButton: {
    backgroundColor: "#F6F6F6",
    color: COLORS.green,
    borderColor: COLORS.green,
    borderWidth: 1,
    marginTop: 32, // Add space between questions and button
    alignSelf: "flex-end", // Right align button
    marginRight: 0, // Ensure it's positioned at the right edge
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
    flexDirection: "row",
  },
  backButton: {
    borderWidth: 0,
    marginLeft: 24, // 8px increment spacing
  },
  fullWidthButton: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Questionnaire;
