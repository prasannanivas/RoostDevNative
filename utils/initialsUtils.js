/**
 * Utility functions for generating user initials with color differentiation
 */

/**
 * Generate initials from firstName and lastName
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} - Two character initials (e.g., "DS")
 */
export const generateInitials = (firstName, lastName) => {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || "";
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";
  return `${firstInitial}${lastInitial}` || "??";
};

/**
 * Generate initials from full name (fallback for existing data)
 * @param {string} fullName - User's full name
 * @returns {string} - Initials from full name
 */
export const generateInitialsFromFullName = (fullName) => {
  if (!fullName) return "??";
  return fullName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2); // Limit to 2 characters
};

/**
 * Get background color for initials based on user type
 * @param {string} userType - Either "self" or "co-signee"
 * @returns {string} - Hex color code
 */
export const getInitialsBackgroundColor = (userType) => {
  switch (userType?.toLowerCase()) {
    case "self":
    case "primary":
      return "#4A7EC0"; // Blue - primary applicant color (matching styles in Questionnaire.js)
    case "co-signee":
    case "cosigner":
    case "co-signer":
      return "#FF3B30"; // Red - co-signer color (matching styles in Questionnaire.js)
    default:
      return "#E0E0E0"; // Light gray for empty state (matching emptyInitialsCircle)
  }
};

/**
 * Get text color for initials (always white for good contrast)
 * @param {string} userType - User type (not used but kept for consistency)
 * @returns {string} - Hex color code
 */
export const getInitialsTextColor = (userType) => {
  return "#FFFFFF"; // Always white for good contrast
};

/**
 * Complete initials object with styling
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} userType - Either "self" or "co-signee"
 * @returns {object} - Object with initials, backgroundColor, and textColor
 */
export const getInitialsWithStyling = (
  firstName,
  lastName,
  userType = "self"
) => {
  return {
    initials: generateInitials(firstName, lastName),
    backgroundColor: getInitialsBackgroundColor(userType),
    textColor: getInitialsTextColor(userType),
    userType: userType,
  };
};

/**
 * Component style object for initials circle
 * @param {string} userType - Either "self" or "co-signee"
 * @param {number} size - Circle diameter (default: 60)
 * @returns {object} - Style object for React Native
 */
export const getInitialsCircleStyle = (userType = "self", size = 60) => {
  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: getInitialsBackgroundColor(userType),
    justifyContent: "center",
    alignItems: "center",
  };
};

/**
 * Component style object for initials text
 * @param {number} fontSize - Font size (default: 18)
 * @returns {object} - Style object for React Native
 */
export const getInitialsTextStyle = (fontSize = 18) => {
  return {
    color: "#FFFFFF",
    fontSize: fontSize,
    fontWeight: "600",
  };
};

/**
 * Determine if the current question is related to a co-signer
 * @param {string|number} questionId - Current question ID
 * @param {object} questionText - Text of the current question
 * @returns {boolean} - Whether the question is co-signer related
 */
export const isCoSignerQuestion = (questionId, questionText) => {
  // Convert questionId to number for comparison
  const numericId = parseInt(questionId);
  // Known co-signer related question IDs
  const coSignerQuestionIds = [
    101,
    103,
    105,
    110,
    111,
    112,
    113,
    115,
    117,
    119,
    125,
    127,
    130,
    132,
    135,
    140,
    145, // Additional co-signer questions
    698,
    717,
    740,
    771,
    810,
    865,
    943,
  ];

  // Check if question ID is in the list of co-signer questions
  const isIdCoSigner = coSignerQuestionIds.includes(numericId);

  // Check if question text contains placeholder for co-signer name
  const textHasCoSignerRef = questionText?.includes("[coFirstName]");

  // Check if the question text directly mentions co-signer
  const textMentionsCoSigner =
    questionText?.toLowerCase().includes("co-signer") ||
    questionText?.toLowerCase().includes("cosigner") ||
    questionText?.toLowerCase().includes("co-signee");

  return isIdCoSigner || textHasCoSignerRef || textMentionsCoSigner;
};
