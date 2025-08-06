import { questions } from "../data/questionnaireData";

/**
 * Determines if a category is complete based on the questionnaire flow
 *
 * @param {Object} responses - The questionnaire responses
 * @param {String} categoryId - The category ID to check
 * @param {Boolean} isCoSigner - Whether checking for co-signer flow
 * @returns {Object} - Object with completion status and statistics
 */
export const isCategoryComplete = (
  responses,
  categoryId,
  isCoSigner = false
) => {
  if (!responses || !categoryId) {
    return {
      isComplete: false,
      completedQuestions: 0,
      totalQuestions: 0,
      completionPercentage: 0,
    };
  }

  // First, determine the flow based on question 5
  const flowType = responses["5"] || "just_me"; // Default to just_me if not specified

  // Determine if we need to look at co-signer questions based on the flow type
  // and the category being checked
  const checkCoSignerQuestions =
    flowType === "co_signer" && (isCoSigner || categoryId === "co_signer");

  // Get the relevant questions for this category based on the flow
  const relevantQuestions = getRelevantQuestionsForCategory(
    categoryId,
    checkCoSignerQuestions,
    flowType
  );

  if (relevantQuestions.length === 0) {
    return {
      isComplete: false,
      completedQuestions: 0,
      totalQuestions: 0,
      completionPercentage: 0,
      answeredQuestions: [],
      unansweredQuestions: [],
    };
  }

  // Track answered and unanswered questions
  const answeredQuestions = [];
  const unansweredQuestions = [];

  // Check each relevant question to see if it has a valid response
  for (const question of relevantQuestions) {
    const questionId = question.id.toString();
    const response = responses[questionId];
    const isAnswered = isQuestionAnswered(response, question);

    if (isAnswered) {
      answeredQuestions.push(questionId);
    } else {
      unansweredQuestions.push(questionId);
    }
  }

  // Statistics
  const completedQuestions = answeredQuestions.length;
  const totalQuestions = relevantQuestions.length;

  // Calculate completion percentage
  const completionPercentage =
    totalQuestions > 0
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0;

  // Category is complete if all required questions are answered
  const isComplete =
    answeredQuestions.length === totalQuestions && totalQuestions > 0;

  return {
    isComplete,
    completedQuestions,
    totalQuestions,
    completionPercentage,
    answeredQuestions,
    unansweredQuestions,
  };
};

/**
 * Gets relevant questions for a specific category based on the flow type
 *
 * @param {String} categoryId - The category ID from the UI
 * @param {Boolean} checkCoSignerQuestions - Whether to check co-signer questions
 * @param {String} flowType - The flow type (just_me or co_signer)
 * @returns {Array} - Array of question objects belonging to the category
 */
const getRelevantQuestionsForCategory = (
  categoryId,
  checkCoSignerQuestions,
  flowType
) => {
  // First, let's check the available categories in the questions data for debugging
  const availableCategories = [...new Set(questions.map((q) => q.category))];
  console.log("Available categories in questions data:", availableCategories);

  // Map categoryIds from UI to actual category values in questions data
  // IMPORTANT: These must match exactly with the categories in your questionnaireData.js
  const categoryMap = {
    // Primary applicant categories
    personal_details: "personal",
    living_details: "living",
    employment_details: "employment",
    income_details: "income",
    banking_details: "banking",
    assets: "assets",
    properties: "properties",
    co_signer: "coSigner", // Special case for co-signer button

    // Co-signer categories
    co_personal_details: "co-personal",
    co_living_details: "co-living",
    co_employment_details: "co-employment",
    co_income_details: "co-income",
    co_banking_details: "co-banking",
    co_assets: "co-assets",
    co_properties: "co-properties",
  };

  // Get the actual category name used in the questions data
  const actualCategory = categoryMap[categoryId];

  if (!actualCategory) {
    console.warn(`Category mapping not found for: ${categoryId}`);
    return [];
  }

  // Log for debugging
  console.log(
    `Looking for questions in category "${actualCategory}" (UI: ${categoryId}), checkCoSignerQuestions: ${checkCoSignerQuestions}`
  );

  // Special case for "co_signer" button/category
  if (categoryId === "co_signer") {
    if (flowType === "just_me") {
      // For the co-signer button in just_me flow, let's consider it complete if there's no co-signer
      return [
        {
          id: "co_signer_button",
          type: "button",
          text: "Add Co-Signer",
          category: "coSigner",
        },
      ];
    }
    return [];
  }

  // Define question ranges based on flow type
  const getQuestionsInCategory = () => {
    // Filter questions by category
    const filteredQuestions = questions.filter((q) => {
      const isCoQuestion = isCoSignerQuestion(q.id);
      const matchesCategory = q.category === actualCategory;

      // Return questions that match the category and the right flow
      if (checkCoSignerQuestions) {
        // Looking for co-signer questions in this category
        return matchesCategory && isCoQuestion;
      } else {
        // Looking for primary applicant questions in this category
        return matchesCategory && !isCoQuestion;
      }
    });

    console.log(
      `Found ${
        filteredQuestions.length
      } questions for category ${actualCategory} (${
        checkCoSignerQuestions ? "co-signer" : "primary"
      })`
    );
    if (filteredQuestions.length === 0) {
      console.log(
        "Questions sample:",
        questions.slice(0, 5).map((q) => ({ id: q.id, category: q.category }))
      );
    }

    return filteredQuestions;
  };

  // Get the questions and filter out any nulls
  const result = getQuestionsInCategory().filter(
    (q) => q !== null && q !== undefined
  );

  // If we still have no questions, use a fallback approach
  if (result.length === 0) {
    console.log(
      "Fallback: Using question IDs to determine category membership"
    );

    // Fallback approach based on question IDs
    const fallbackQuestions = (() => {
      // Define question ranges based on flow type
      const justMeRanges = {
        personal_details: [6, 7],
        living_details: [8],
        employment_details: [9, 10],
        income_details: [11],
        banking_details: [12],
        assets: [13],
        properties: [14],
      };

      // In co_signer flow:
      // - Main applicant questions are even numbers: 100, 102, etc.
      // - Co-applicant questions are odd numbers: 101, 103, etc.
      const coSignerRanges = {
        // Main applicant uses even-numbered questions
        personal_details: [100, 102],
        living_details: [104],
        employment_details: [106, 107],
        income_details: [108],
        banking_details: [114],
        assets: [116],
        properties: [118],

        // Co-applicant uses odd-numbered questions
        co_personal_details: [101, 103],
        co_living_details: [105],
        co_employment_details: [110, 111],
        co_income_details: [112],
        co_banking_details: [115],
        co_assets: [117],
        co_properties: [119],
      };

      // Select the appropriate question ranges based on flow type
      const questionRanges =
        flowType === "co_signer" ? coSignerRanges : justMeRanges;

      const idRange = questionRanges[categoryId] || [];

      return idRange.map((id) => {
        const question = questions.find(
          (q) => q.id === id || q.id === id.toString()
        );
        return (
          question || {
            id: id.toString(),
            type: "unknown",
            text: `Question ${id}`,
            category: actualCategory,
          }
        );
      });
    })();

    console.log(
      `Fallback found ${fallbackQuestions.length} questions for ${categoryId}`
    );
    return fallbackQuestions;
  }

  return result;
};

/**
 * Check if a question ID belongs to co-signer flow
 *
 * @param {String|Number} questionId - Question ID to check
 * @returns {Boolean} - True if question is for co-signer
 */
const isCoSignerQuestion = (questionId) => {
  // Convert to number for comparison if it's a string
  const qId =
    typeof questionId === "string" ? parseInt(questionId, 10) : questionId;

  // In co_signer flow:
  // - Main applicant questions are even numbers: 100, 102, etc.
  // - Co-applicant questions are odd numbers: 101, 103, etc.
  // So co-signer questions are odd numbered in the 100+ range
  return qId >= 100 && qId < 200 && qId % 2 !== 0;
};

/**
 * Check if a question has a valid answer
 *
 * @param {any} response - The response value
 * @param {Object} question - The question definition
 * @returns {Boolean} - True if the question has a valid answer
 */
const isQuestionAnswered = (response, question) => {
  // No response at all
  if (response === undefined || response === null) {
    return false;
  }

  // For the special co_signer button case
  if (question.id === "co_signer_button") {
    return true;
  }

  // Special handling for Personal Details and Income questions
  // These are considered complete if they have any data at all
  const personalAndIncomeQuestionIds = [
    // Just_me flow - Personal and Income
    "6",
    "7",
    "11",
    6,
    7,
    11,

    // Co_signer flow - Main applicant (even numbers)
    "100",
    "102",
    "108",
    100,
    102,
    108,

    // Co_signer flow - Co-applicant (odd numbers)
    "101",
    "103",
    "109",
    "112",
    "113",
    101,
    103,
    109,
    112,
    113,
  ];

  if (personalAndIncomeQuestionIds.includes(question.id)) {
    // For personal details forms, check all expected fields exist
    if (typeof response === "object") {
      // Find the actual question definition from questionnaireData.js
      const fullQuestion = questions.find(
        (q) => q.id === question.id || q.id === question.id.toString()
      );

      let fieldsToCheck = [];

      // If we found the question and it has field definitions, use those
      if (fullQuestion && fullQuestion.fields) {
        fieldsToCheck = fullQuestion.fields.map((field) => field.name);
      } else {
        // If we can't find fields in the question definition, use response keys
        fieldsToCheck = Object.keys(response);
      }

      // Ensure all fields have values
      if (fieldsToCheck.length > 0) {
        return fieldsToCheck.every(
          (field) =>
            response[field] !== undefined &&
            response[field] !== null &&
            response[field] !== ""
        );
      }

      // If we somehow still have no fields to check, ensure all response fields are filled
      const allFields = Object.keys(response);
      return (
        allFields.length > 0 &&
        allFields.every(
          (field) =>
            response[field] !== undefined &&
            response[field] !== null &&
            response[field] !== ""
        )
      );
    }
    return response !== "" && response !== null && response !== undefined;
  }

  // Log the response and question type for debugging
  console.log(`Checking response for question ${question.id}:`, {
    responseType: typeof response,
    questionType: question.type,
    hasResponse: !!response,
  });

  switch (question.type) {
    case "form":
    case "complexForm":
    case "conditionalForm":
      // For forms, check if all fields have values (treat all as required)
      if (typeof response !== "object") return false;

      // Get all field names from the form, treating all as required
      let allFields = [];

      // If question has fields defined in its structure, use those
      if (question.fields) {
        // Get all fields from the question definition, treating all as required
        allFields = question.fields.map((field) => field.name);
      } else {
        // If we don't have fields defined, try to find the question in questions array
        const fullQuestion = questions.find(
          (q) => q.id === question.id || q.id === question.id.toString()
        );

        if (fullQuestion && fullQuestion.fields) {
          // Get fields from the found question
          allFields = fullQuestion.fields.map((field) => field.name);
        }
      }

      // If we still don't have fields, use the response object keys
      if (allFields.length === 0 && typeof response === "object") {
        allFields = Object.keys(response);
      }

      // If we still don't have any fields to check, consider it incomplete
      if (allFields.length === 0) {
        return false;
      }

      // Check if all fields have values (treating all fields as required)
      const allFieldsPresent = allFields.every((fieldName) => {
        const value = response[fieldName];
        return value !== undefined && value !== null && value !== "";
      });

      return allFieldsPresent;

    case "multipleChoice":
      // For multiple choice, any valid string value is considered complete
      return typeof response === "string" && response.trim() !== "";

    case "textInput":
      // For text input, any non-empty string is valid
      return typeof response === "string" && response.trim() !== "";

    case "finalStep":
      // Final step doesn't require a response
      return true;

    case "button":
      // Special case for buttons
      return true;

    case "unknown":
      // For fallback questions where we don't know the type
      // Check if there's any response at all
      return true;

    default:
      // For other types, just check that response exists
      console.log(
        `Unknown question type: ${question.type} for question ${question.id}`
      );
      return true;
  }
};

/**
 * Get completion status for all categories
 *
 * @param {Object} responses - All questionnaire responses
 * @param {Boolean} isCoSignerFlow - Whether in co-signer flow (can be overridden by responses["5"])
 * @returns {Object} - Map of category IDs to completion status
 */
export const getAllCategoriesCompletionStatus = (
  responses,
  isCoSignerFlow = false
) => {
  // Handle empty responses
  if (!responses || Object.keys(responses).length === 0) {
    console.log("No responses provided to check completion status");
    return {};
  }

  // First check flow type directly from responses
  const flowType = responses["5"] || (isCoSignerFlow ? "co_signer" : "just_me");
  const actualCoSignerFlow = flowType === "co_signer";

  console.log(
    `Flow type detected from responses: ${flowType}, isCoSignerFlow passed: ${isCoSignerFlow}`
  );
  console.log("Sample responses:", Object.keys(responses).slice(0, 10));

  // Define all categories we want to check
  const primaryCategories = [
    "personal_details",
    "living_details",
    "employment_details",
    "income_details",
    "banking_details",
    "assets",
    "properties",
  ];

  // If not in co-signer flow, add the co-signer button category
  if (flowType === "just_me") {
    primaryCategories.push("co_signer");
  }

  const coSignerCategories =
    flowType === "co_signer"
      ? [
          "co_personal_details",
          "co_living_details",
          "co_employment_details",
          "co_income_details",
          "co_banking_details",
          "co_assets",
          "co_properties",
        ]
      : [];

  // Determine which categories to check based on flow
  const categoriesToCheck = actualCoSignerFlow
    ? [...primaryCategories, ...coSignerCategories]
    : primaryCategories;

  // Create a map of category ID to completion status
  const completionStatus = {};

  for (const categoryId of categoriesToCheck) {
    const isCoSigner = categoryId.startsWith("co_");
    try {
      completionStatus[categoryId] = isCategoryComplete(
        responses,
        categoryId,
        isCoSigner
      );

      // Apply manual overrides for categories based on question patterns
      // This is a fallback in case our category detection isn't working perfectly
      applyManualStatusOverrides(
        responses,
        categoryId,
        completionStatus[categoryId]
      );

      // Add some debug logging for development
      console.log(`Category ${categoryId} status:`, {
        isComplete: completionStatus[categoryId].isComplete,
        completed: completionStatus[categoryId].completedQuestions,
        total: completionStatus[categoryId].totalQuestions,
        percentage: completionStatus[categoryId].completionPercentage,
        answeredQs: completionStatus[categoryId].answeredQuestions,
        unansweredQs: completionStatus[categoryId].unansweredQuestions,
      });

      // Special debug logging for Personal Details and Income categories
      if (
        categoryId === "personal_details" ||
        categoryId === "income_details" ||
        categoryId === "co_personal_details" ||
        categoryId === "co_income_details"
      ) {
        // Determine which question IDs to check based on flow type and category
        let qIds = [];
        const flowType = responses["5"] || "just_me";

        if (flowType === "just_me") {
          // Just me flow
          qIds = categoryId === "personal_details" ? ["6", "7"] : ["11"];
        } else {
          // Co-signer flow
          if (categoryId === "personal_details") {
            qIds = ["100", "102"]; // Main applicant personal details
          } else if (categoryId === "income_details") {
            qIds = ["108"]; // Main applicant income
          } else if (categoryId === "co_personal_details") {
            qIds = ["101", "103"]; // Co-signer personal details
          } else if (categoryId === "co_income_details") {
            qIds = ["109", "113"]; // Co-signer income
          }
        }

        console.log(`Special category ${categoryId} check:`, {
          flowType,
          responses: qIds.map((id) => ({ id, hasResponse: !!responses[id] })),
          override: completionStatus[categoryId].manualOverrideApplied,
        });
      }
    } catch (error) {
      console.error(`Error checking category ${categoryId}:`, error);
      completionStatus[categoryId] = {
        isComplete: false,
        completedQuestions: 0,
        totalQuestions: 0,
        completionPercentage: 0,
        answeredQuestions: [],
        unansweredQuestions: [],
        error: error.message,
      };
    }
  }

  return completionStatus;
};

/**
 * Apply manual status overrides based on question patterns
 * This is a fallback in case our category detection isn't working perfectly
 *
 * @param {Object} responses - The questionnaire responses
 * @param {String} categoryId - The category ID
 * @param {Object} status - The current status object to modify
 */
function applyManualStatusOverrides(responses, categoryId, status) {
  // Quick function to check if a response exists and is valid
  const hasValidResponse = (questionIds) => {
    return questionIds.some((id) => {
      const response = responses[id];
      return (
        response !== undefined &&
        response !== null &&
        (typeof response === "object" ? Object.keys(response).length > 0 : true)
      );
    });
  };

  // Define question IDs for each category based on the flow type
  const justMeQuestions = {
    personal_details: ["6", "7"],
    living_details: ["8"],
    employment_details: ["9", "10"],
    income_details: ["11"],
    banking_details: ["12"],
    assets: ["13"],
    properties: ["14"],
  };

  // In co_signer flow:
  // - Main applicant questions are even numbers: 100, 102, etc.
  // - Co-applicant questions are odd numbers: 101, 103, etc.
  const coSignerQuestions = {
    // Main applicant uses even-numbered questions
    personal_details: ["100", "102"],
    living_details: ["104"],
    employment_details: ["106", "110"],
    income_details: ["108", "112"],
    banking_details: ["114"],
    assets: ["116"],
    properties: ["118"],

    // Co-applicant uses odd-numbered questions
    co_personal_details: ["101", "103"],
    co_living_details: ["105"],
    co_employment_details: ["107", "111"],
    co_income_details: ["109", "113"],
    co_banking_details: ["115"],
    co_assets: ["117"],
    co_properties: ["119"],
  };

  // Determine which question mapping to use based on responses
  const flowType = responses["5"] || "just_me";
  const categoryQuestions =
    flowType === "co_signer" ? coSignerQuestions : justMeQuestions;

  // If the category has no questions detected but we know it should have some
  if (status.totalQuestions === 0 && categoryQuestions[categoryId]) {
    const questionIds = categoryQuestions[categoryId];
    const isValid = hasValidResponse(questionIds);
    const totalQuestions = questionIds.length;

    // Count answered questions
    let answered = 0;
    const answeredQuestions = [];
    const unansweredQuestions = [];

    for (const id of questionIds) {
      const response = responses[id];
      // Special handling for Personal Details and Income which should be 100% if any response exists
      if (
        (categoryId === "personal_details" ||
          categoryId === "income_details") &&
        response
      ) {
        // Consider as fully answered if there's any valid data
        answered = totalQuestions; // Force to all questions answered
        answeredQuestions.push(...questionIds); // Add all question IDs as answered
        unansweredQuestions.length = 0; // Clear unanswered questions
        break; // No need to continue checking
      } else if (response) {
        // Normal handling for other categories
        answered++;
        answeredQuestions.push(id);
      } else {
        unansweredQuestions.push(id);
      }
    }
    // If we found valid responses, update the status

    // Update the status
    status.completedQuestions = answered;
    status.totalQuestions = totalQuestions;
    status.completionPercentage =
      totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
    status.isComplete =
      categoryId === "personal_details" ||
      categoryId === "income_details" ||
      categoryId === "co_personal_details" ||
      categoryId === "co_income_details"
        ? answered > 0 // For these categories, mark as complete if any question is answered
        : answered === totalQuestions && totalQuestions > 0;
    status.answeredQuestions = answeredQuestions;
    status.unansweredQuestions = unansweredQuestions;
    status.manualOverrideApplied = true;
  }
}
