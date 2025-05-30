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
      return !isNaN(value) && value.length > 0;
    default:
      return value && value.length > 0;
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
