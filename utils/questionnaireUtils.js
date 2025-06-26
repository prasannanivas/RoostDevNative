// Utility functions for questionnaire

export const getMonthOptions = () => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return months.map((month, index) => ({
    value: (index + 1).toString(),
    label: month,
  }));
};

export const getDayOptions = () => {
  const days = [];
  for (let i = 1; i <= 31; i++) {
    days.push({
      value: i.toString(),
      label: i.toString(),
    });
  }
  return days;
};

export const getYearOptions = (
  startYear = 1940,
  endYear = new Date().getFullYear()
) => {
  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push({
      value: year.toString(),
      label: year.toString(),
    });
  }
  return years;
};

export const getDependentOptions = () => [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
];

// Function to process dynamic text in questions
export const processDynamicText = (text, responses) => {
  if (!text) return text;

  let processedText = text;

  // Replace [coFirstName] with the actual co-signer's first name
  // First check in the specific question response (question 101)
  if (responses && responses[101]) {
    if (responses[101].coFirstName) {
      processedText = processedText.replace(
        /\[coFirstName\]/g,
        responses[101].coFirstName
      );
    } else if (responses[101].firstName) {
      // Some implementations might store without the 'co' prefix
      processedText = processedText.replace(
        /\[coFirstName\]/g,
        responses[101].firstName
      );
    }
  }
  // Check string key format too
  else if (responses && responses["101"]) {
    if (responses["101"].coFirstName) {
      processedText = processedText.replace(
        /\[coFirstName\]/g,
        responses["101"].coFirstName
      );
    } else if (responses["101"].firstName) {
      // Some implementations might store without the 'co' prefix
      processedText = processedText.replace(
        /\[coFirstName\]/g,
        responses["101"].firstName
      );
    }
  }
  // Check if coFirstName is at the root level of responses
  else if (responses && responses.coFirstName) {
    processedText = processedText.replace(
      /\[coFirstName\]/g,
      responses.coFirstName
    );
  } // If no co-signer name is found, use a generic placeholder with no specific name
  else {
    processedText = processedText.replace(/\[coFirstName\]/g, "Co-signer");
  }

  // Add more dynamic replacements as needed

  return processedText;
};

// Validation helpers
export const validateField = (field, value) => {
  // Check for required fields first
  if (field.required && (!value || value.trim() === "")) {
    return { isValid: false, error: `${field.label} is required` };
  }

  // Skip further validation if field is not required and empty
  if (!field.required && (!value || value.trim() === "")) {
    return { isValid: true };
  }

  // Specific field type validations
  switch (field.type) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(value);
      return {
        isValid: isValidEmail,
        error: isValidEmail ? null : "Please enter a valid email address",
      };

    case "phone":
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const isValidPhone = phoneRegex.test(value.replace(/\D/g, ""));
      return {
        isValid: isValidPhone,
        error: isValidPhone ? null : "Please enter a valid phone number",
      };
    case "numeric":
      const isValidNumeric = !isNaN(value) && value.length > 0;
      return {
        isValid: isValidNumeric,
        error: isValidNumeric ? null : "Please enter a valid number",
      };
    default:
      const isValidDefault = value && value.length > 0;
      return {
        isValid: isValidDefault,
        error: isValidDefault ? null : "This field is required",
      };
  }
};

export const validateForm = (fields, formData) => {
  const errors = {};

  fields.forEach((field) => {
    const value = formData[field.key];
    if (!validateField(field, value)) {
      errors[field.key] = `${field.label} is required or invalid`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Calculate the expected total number of questions based on the questionnaire flow
 * @param {object} responses - Current questionnaire responses
 * @returns {number} - Expected total questions for the current flow
 */
export const getExpectedQuestionsCount = (responses) => {
  const question5Response = responses[5] || responses["5"];

  if (question5Response === "co_signer") {
    // Co-signer flow includes additional questions
    // Primary applicant questions: 1-5, 100, 102, 104, 106-109, 114, 116, 118, 120, 121
    // Plus co-signer specific questions: 101, 103, 105, 110-113, 115, 117, 119
    // Total estimated: ~35-40 questions depending on conditional logic
    return 25;
  } else if (question5Response === "just_me") {
    // Just me flow: shorter path
    // Questions: 1-5, 6, 7-99 (subset based on conditional logic), 121
    // Total estimated: ~25-30 questions depending on conditional responses
    return 13;
  } else {
    // Flow not determined yet, use conservative estimate
    return 13;
  }
};

/**
 * Get progress percentage for the questionnaire
 * @param {Set} visitedQuestions - Set of visited question IDs
 * @param {object} responses - Current questionnaire responses
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateQuestionnaireProgress = (visitedQuestions, responses) => {
  const totalExpected = getExpectedQuestionsCount(responses);

  // Calculate base progress
  let progress = (visitedQuestions.size / totalExpected) * 100;

  // If we've reached question 121 (final step), show 100%
  if (visitedQuestions.has(121)) {
    return 100;
  }

  // For smoother progress, allow natural progression but ensure we don't exceed 98%
  // before reaching the final question. This prevents the jarring jump from 95% to 100%
  const maxProgressBeforeFinal = 98;

  // If progress exceeds the max allowed before final, cap it
  if (progress > maxProgressBeforeFinal) {
    return maxProgressBeforeFinal;
  }

  // Return the natural progress
  return Math.round(progress * 10) / 10; // Round to 1 decimal place for smoother display
};

/**
 * Get the question ranges for different questionnaire flows
 * @param {string} flowType - "just_me", "co_signer", or "common"
 * @returns {object} - Object with question ranges and specific question lists
 */
export const getFlowQuestionRanges = (flowType) => {
  const commonQuestions = [1, 2, 3, 4, 5]; // Questions common to both flows
  const finalQuestion = 121;

  if (flowType === "just_me") {
    return {
      startAfterDecision: 6,
      endBeforeFinal: 99,
      specificQuestions: [
        ...commonQuestions,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,

        finalQuestion,
      ],
      excludeRanges: [[100, 120]], // Exclude co-signer questions
    };
  } else if (flowType === "co_signer") {
    return {
      startAfterDecision: 100,
      coSignerQuestions: [101, 103, 105, 110, 111, 112, 113, 115, 117, 119],
      specificQuestions: [
        ...commonQuestions,
        100,
        102,
        104,
        106,
        107,
        108,
        109,
        114,
        116,
        118,
        120,
        finalQuestion,
      ],
      excludeRanges: [[6, 99]], // Exclude just-me path questions
    };
  }

  return {
    commonQuestions,
    finalQuestion,
  };
};

/**
 * Check if a question belongs to a specific flow
 * @param {number} questionId - The question ID to check
 * @param {string} flowType - "just_me" or "co_signer"
 * @returns {boolean} - Whether the question belongs to the flow
 */
export const isQuestionInFlow = (questionId, flowType) => {
  const qId = parseInt(questionId);
  const ranges = getFlowQuestionRanges(flowType);

  // Common questions (1-5) and final question (121) belong to both flows
  if (qId <= 5 || qId === 121) {
    return true;
  }

  if (flowType === "just_me") {
    // Just me flow: questions 6-99, excluding co-signer specific questions
    return qId >= 6 && qId <= 99;
  } else if (flowType === "co_signer") {
    // Co-signer flow: questions 100-120
    return qId >= 100 && qId <= 120;
  }

  return false;
};
