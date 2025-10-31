import { generateInitials } from "../utils/initialsUtils";

/**
 * Generate dynamic profile initials based on responses
 * @param {object} responses - Current questionnaire responses
 * @param {string} questionId - Current question ID to determine context
 * @returns {object} - Object with initials and userType
 */
export const getProfileInitialsForQuestion = (responses, questionId) => {
  // Questions related to primary applicant (Self)

  // Questions related to co-signee (now all at the end of questionnaire)
  const coSigneeQuestions = [101, 103, 105, 110, 111, 112, 113, 115, 117, 119];

  // Determine user type based on question
  let userType = "self";
  if (coSigneeQuestions.includes(parseInt(questionId))) {
    userType = "co-signee";
  }

  // Debug: Log responses to see what's available
  console.log("getProfileInitialsForQuestion - questionId:", questionId);
  console.log("getProfileInitialsForQuestion - userType:", userType);
  console.log("getProfileInitialsForQuestion - responses:", responses);
  // Get name data from responses - check both direct keys and nested objects
  let firstName, lastName;

  if (userType === "self") {
    // Try different possible keys for self (question 6)
    firstName =
      responses.firstName ||
      responses["6"]?.firstName ||
      responses[6]?.firstName;
    lastName =
      responses.lastName || responses["6"]?.lastName || responses[6]?.lastName;
  } else {
    // Try different possible keys for co-signee (question 101)
    firstName =
      responses.coFirstName ||
      responses["101"]?.coFirstName ||
      responses[101]?.coFirstName;
    lastName =
      responses.coLastName ||
      responses["101"]?.coLastName ||
      responses[101]?.coLastName;
  }

  console.log("getProfileInitialsForQuestion - firstName:", firstName);
  console.log("getProfileInitialsForQuestion - lastName:", lastName);
  // Initialize initials as empty string
  let initials = "";

  // Generate initials only if we have name data
  if (firstName && lastName) {
    initials = generateInitials(firstName, lastName);
    console.log(
      "getProfileInitialsForQuestion - generated initials:",
      initials
    );
  } else if (firstName) {
    // Use just the first initial if we only have firstName
    initials = firstName.charAt(0).toUpperCase();
    console.log("getProfileInitialsForQuestion - partial initial:", initials);
  } else {
    console.log(
      "getProfileInitialsForQuestion - no name data, using empty initials"
    );
  }

  return {
    initials,
    userType,
  };
};

const questions = [
  {
    id: 1,
    page: 1,
    category: "basic",
    text: "Have you found a property yet?",
    type: "multipleChoice",
    options: [
      { value: "still_looking", label: "Still looking" },
      { value: "yes", label: "Yes" },
    ],

    nextQuestion: 2,
  },
  {
    id: 2,
    page: 2,
    category: "basic",
    text: "",
    type: "form",
    fields: [
      {
        key: "purchaseAmount",
        label: "How much do you consider spending?",
        type: "numericInput",
        placeholder: "Amount",
        prefix: "$",
        keyboard: "numeric",
        required: true,
      },
      {
        key: "downPaymentAmount",
        label: "What is the amount of downpayment you have?",
        type: "numericInput",
        placeholder: "Amount",
        prefix: "$",
        keyboard: "numeric",
        required: true,
      },
    ],
    nextQuestion: 4,
  },

  {
    id: 4,
    page: 3,
    category: "basic",
    text: "Do you plan on",
    type: "multipleChoice",
    options: [
      { value: "living_here", label: "Living here" },
      { value: "renting_out", label: "Renting it out" },
      {
        value: "living_and_renting",
        label: "Living and renting out some space",
      },
      { value: "secondary_home", label: "Secondary home" },
    ],

    nextQuestion: 5,
  },
  {
    id: 5,
    page: 4,
    category: "choice",
    text: "Is it just you? or another person applying too?",
    type: "multipleChoice",
    options: [
      { value: "just_me", label: "Just me" },
      { value: "co_signer", label: "Me and a co-signer" },
    ],
    nextQuestionMap: {
      just_me: 6, // Continue with primary applicant flow
      co_signer: 100, // Jump to co-applicant flow
    },
  },
  {
    id: 6,
    page: 5,
    category: "personal_details",
    text: "What are your details?",
    type: "form",
    fields: [
      {
        key: "firstName",
        label: "",
        required: true,
        placeholder: "First Name",
      },
      { key: "lastName", label: "", required: true, placeholder: "Last Name" },
      {
        key: "email",
        label: "",
        placeholder: "Email",
        keyboard: "email-address",
      },
      { key: "phone", label: "", keyboard: "phone-pad", placeholder: "Phone" },
    ],

    nextQuestion: 7,
  },
  {
    id: 7,
    page: 6,
    category: "personal_details",
    text: "What are your details?",
    type: "complexForm",
    profileInitials: "", // Will be dynamically generated from name
    sections: [
      {
        title: "Date of birth",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "birthMonth",
            label: "",
            type: "select",
            placeholder: "Month",
            accommodateWidth: 3,
          },
          {
            key: "birthDay",
            label: "",
            type: "select",
            placeholder: "Day",
            accommodateWidth: 3,
          },
          {
            key: "birthYear",
            label: "",
            type: "select",
            placeholder: "Year",
            accommodateWidth: 3,
          },
        ],
      },
      {
        fields: [
          {
            key: "sinNumber",
            label: "",
            placeholder: "SIN Number (Optional)",
            keyboard: "numeric",
            infoText: "SIN is not required, but can speed up the pre-approval",
          },
          {
            key: "dependents",
            label: "",
            placeholder: "Number of Dependents",
            type: "select",

            options: [
              { value: "0", label: "0" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4+", label: "4+" },
            ],
          },
        ],
      },
    ],

    nextQuestion: 8,
  },
  {
    id: 8,
    page: 7,
    category: "living_details",
    text: "Where are you currently living?",
    type: "complexForm",
    profileInitials: "", // This could be dynamically generated from name
    sections: [
      {
        fields: [
          { key: "address", label: "", type: "text", placeholder: "Address" },
          {
            key: "livingStatus",
            placeholder: "Living Status",
            label: "",
            type: "select",
            options: [
              { value: "own", label: "I Own" },
              { value: "rent", label: "I Rent" },
              { value: "with_parents", label: "I Live with Parents" },
            ],
          },
        ],
      },
      {
        title: "You've been living here since?",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "months",
            label: "",
            type: "select",
            placeholder: "Month",
            accommodateWidth: 2,
          },
          {
            key: "years",
            label: "",
            type: "select",
            placeholder: "Year",
            accommodateWidth: 2,
          },
        ],
      },
    ],

    nextQuestion: 9, // Proceed to next question
  },
  {
    id: 9,
    page: 8,
    category: "employment_details",
    text: "Currently what type of income do you have?",
    type: "multipleChoice",
    options: [
      { value: "employed", label: "Employed" },
      { value: "self_employed", label: "Self-Employed" },
      { value: "pension", label: "Pension" },
      { value: "other", label: "Other" },
    ],

    nextQuestionMap: {
      employed: 10,
      self_employed: 10,
      pension: 12,
      other: 12,
    },
  },

  {
    id: 10,
    page: 9,
    category: "employment_details",
    text: "Where do you work?",
    type: "complexForm",
    sections: [
      {
        fields: [
          {
            key: "companyName",
            label: "",
            placeholder: "Company Name",
            type: "text",
          },
          {
            key: "companyAddress",
            placeholder: "Company Address",
            label: "",
            type: "text",
          },
          {
            key: "jobTitle",
            placeholder: "Your Job Title",
            label: "",
            type: "text",
          },
          {
            key: "employmentType",
            label: "Employment Type",
            placeholder: "Employment Type",
            type: "buttonGroup",
            options: [
              { value: "full_time", label: "Full Time" },
              { value: "part_time", label: "Part time" },
              { value: "seasonal", label: "Seasonal" },
            ],
          },
        ],
      },
      {
        title: "When did you start here?",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "months",
            label: "",
            type: "select",
            placeholder: "Month",
            accommodateWidth: 2,
          },
          {
            key: "years",
            label: "",
            type: "select",
            placeholder: "Year",
            accommodateWidth: 2,
          },
        ],
      },
    ],

    nextQuestion: 11,
  },

  {
    id: 11,
    category: "income_details",
    page: 10,

    text: "How much do you make?",
    type: "complexForm",
    fields: [
      {
        prefix: "$",
        key: "income",
        placeholder: "Annual Income",
        label: "",
        type: "text",
        keyboard: "numeric",
        validation: {
          min: 15000,
          errorMessage:
            "Sorry, The minimum income should be $15,000 a year or greater",
        },
      },
      {
        key: "bonuses",
        label: "Bonuses or Commissions?",
        type: "toggleButtonGroup",

        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        key: "benefits",
        label: "Benefits?",
        type: "toggleButtonGroup",

        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        key: "bonusComissionAnnualAmount",
        placeholder: "Annual Amount",
        prefix: "$",
        type: "text",
        keyboard: "numeric",
        condition: {
          anyOf: [
            { key: "bonuses", value: "yes" },
            { key: "benefits", value: "yes" },
          ],
        },
      },
    ],

    nextQuestion: 12,
  },
  {
    id: 12,
    page: 8,
    category: "banking_details",
    text: "Who do you bank with?",
    type: "dropdown",
    profileInitials: "",
    placeholder: "Bank Name",
    options: [
      { value: "td", label: "TD Canada Trust" },
      { value: "rbc", label: "Royal Bank of Canada (RBC)" },
      { value: "bmo", label: "Bank of Montreal (BMO)" },
      { value: "scotiabank", label: "Scotiabank" },
      { value: "cibc", label: "CIBC" },
      { value: "national", label: "National Bank" },
      { value: "desjardins", label: "Desjardins" },
      { value: "tangerine", label: "Tangerine" },
      { value: "vancity", label: "Vancity" },
      { value: "atb", label: "ATB Financial" },
      { value: "simplii", label: "Simplii" },
      { value: "meridian", label: "Meridian" },
      { value: "laurentian", label: "Laurentian" },
      { value: "coast_capital", label: "Coast Capital" },
      { value: "hsbc", label: "HSBC" },
      { value: "eq", label: "EQ Bank" },
      { value: "other", label: "Other" },
    ],

    nextQuestion: 13,
  },
  {
    id: 13,
    page: 13,
    category: "assets",
    text: "Do you have any assets?",
    type: "conditionalMultipleItems",
    profileInitials: "",
    initialField: {
      key: "hasAssets",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ],
    },
    itemFields: [
      { key: "item", placeholder: "Item", type: "text" },
      {
        key: "value",
        placeholder: "Value",
        type: "text",
        keyboard: "numeric",
        prefix: "$",
      },
    ],
    addButtonText: "Add another",

    nextQuestion: 14,
  },
  {
    id: 14,
    page: 14,
    category: "properties",
    text: "Do you have any other properties?",
    type: "conditionalForm",
    profileInitials: "",
    initialField: {
      key: "hasOtherProperties",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ],
    },
    conditionalFields: {
      yes: [
        { key: "address", placeholder: "Address", type: "text" },
        {
          key: "value",
          placeholder: "Value",
          type: "text",
          keyboard: "numeric",
          prefix: "$",
        },
        {
          key: "planningSelling",
          label: "Planning on selling?",
          type: "toggleButtonGroup",

          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ],
        },
        {
          key: "hasMortgage",
          label: "Does it have a mortgage?",
          type: "toggleButtonGroup",

          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ],
        },
        {
          key: "mortgageAmount",
          placeholder: "Amount",
          type: "text",
          keyboard: "numeric",
          prefix: "$",
          condition: { key: "hasMortgage", value: "yes" },
        },
      ],
    },

    nextQuestion: 121,
  },
  {
    id: 100,
    page: 100,
    category: "personal_details",
    text: "What are your details?",
    type: "form",
    fields: [
      {
        key: "firstName",
        label: "",
        placeholder: "First Name",
        required: true,
      },
      { key: "lastName", label: "", placeholder: "Last Name", required: true },
      {
        key: "email",
        label: "",
        placeholder: "Email",
        keyboard: "email-address",
      },
      { key: "phone", label: "", placeholder: "Phone", keyboard: "phone-pad" },
    ],
    nextQuestion: 102,
  },
  {
    id: 102,
    page: 102,
    category: "personal_details",
    text: "What are your details?",
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        accommodateAllInOneLine: true,
        title: "Date of birth",
        fields: [
          {
            key: "birthMonth",
            placeholder: "Month",
            type: "select",
            accommodateWidth: 3,
          },
          {
            key: "birthDay",
            placeholder: "Day",
            type: "select",
            accommodateWidth: 3,
          },
          {
            key: "birthYear",
            placeholder: "Year",
            type: "select",
            accommodateWidth: 3,
          },
        ],
      },
      {
        fields: [
          {
            key: "sinNumber",
            placeholder: "SIN Number (Optional)",
            keyboard: "numeric",
            infoText: "SIN is not required, but can speed up the pre-approval",
          },
          {
            key: "dependents",
            placeholder: "Number of Dependents",
            type: "select",
            options: [
              { value: "0", label: "0" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4+", label: "4+" },
            ],
          },
        ],
      },
    ],
    nextQuestion: 104,
  },
  {
    id: 104,
    page: 104,
    category: "living_details",
    text: "Where are you currently living?",
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        fields: [
          { key: "address", placeholder: "Address", type: "text" },
          {
            key: "livingStatus",
            placeholder: "Living Status",
            type: "select",
            options: [
              { value: "own", label: "I Own" },
              { value: "rent", label: "I Rent" },
              { value: "with_parents", label: "I Live with Parents" },
            ],
          },
        ],
      },
      {
        title: "You've been living here since?",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "months",
            placeholder: "Month",
            type: "select",
            accommodateWidth: 2,
          },
          {
            key: "years",
            placeholder: "Year",
            type: "select",
            accommodateWidth: 2,
          },
        ],
      },
    ],
    nextQuestion: 106,
  },
  {
    id: 106,
    page: 106,
    category: "employment_details",
    text: "Currently what type of income do you have?",
    type: "multipleChoice",
    profileInitials: "",
    options: [
      { value: "employed", label: "Employed" },
      { value: "self_employed", label: "Self-Employed" },
      { value: "pension", label: "Pension" },
      { value: "other", label: "Other" },
    ],
    nextQuestionMap: {
      employed: 107,
      self_employed: 107,
      pension: 114,
      other: 114,
    },
  },
  {
    id: 107,
    page: 107,
    category: "employment_details",
    text: "Where do you work?",
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        fields: [
          { key: "companyName", placeholder: "Company Name", type: "text" },
          {
            key: "companyAddress",
            placeholder: "Company Address",
            type: "text",
          },
          { key: "jobTitle", placeholder: "Your Job Title", type: "text" },
          {
            key: "employmentType",
            label: "Employment Type",
            type: "buttonGroup",
            options: [
              { value: "full_time", label: "Full Time" },
              { value: "part_time", label: "Part time" },
              { value: "seasonal", label: "Seasonal" },
            ],
          },
        ],
      },
      {
        title: "When did you start here?",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "months",
            label: "",
            type: "select",
            placeholder: "Month",
            accommodateWidth: 2,
          },
          {
            key: "years",
            label: "",
            type: "select",
            placeholder: "Year",
            accommodateWidth: 2,
          },
        ],
      },
    ],
    nextQuestion: 108, // Skip to co-signer income question
  },
  {
    id: 108,
    page: 108,
    category: "income_details",
    text: "How much do you make?",
    type: "complexForm",
    profileInitials: "",
    fields: [
      {
        key: "income",
        prefix: "$",
        placeholder: "Annual Income",
        type: "text",
        keyboard: "numeric",
        validation: {
          min: 15000,
          errorMessage:
            "Sorry, The minimum income should be $15,000 a year or greater",
        },
      },
      {
        key: "bonuses",
        label: "Bonuses or Commissions?",
        type: "toggleButtonGroup",
        options: [
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
        ],
      },
      {
        key: "benefits",
        label: "Benefits?",
        type: "toggleButtonGroup",
        options: [
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
        ],
      },
      {
        key: "bonusComissionAnnualAmount",
        placeholder: "Annual Amount",
        prefix: "$",
        type: "text",
        keyboard: "numeric",
        condition: {
          anyOf: [
            { key: "bonuses", value: "yes" },
            { key: "benefits", value: "yes" },
          ],
        },
      },
    ],
    nextQuestion: 114, // Skip to co-signer income question
  },
  {
    id: 114,
    page: 114,
    category: "banking_details",
    text: "Who do you bank with?",
    type: "dropdown",
    profileInitials: "",
    placeholder: "Bank Name",
    options: [
      { value: "td", label: "TD Canada Trust" },
      { value: "rbc", label: "Royal Bank of Canada (RBC)" },
      { value: "bmo", label: "Bank of Montreal (BMO)" },
      { value: "scotiabank", label: "Scotiabank" },
      { value: "cibc", label: "CIBC" },
      { value: "national", label: "National Bank" },
      { value: "desjardins", label: "Desjardins" },
      { value: "tangerine", label: "Tangerine" },
      { value: "vancity", label: "Vancity" },
      { value: "atb", label: "ATB Financial" },
      { value: "simplii", label: "Simplii" },
      { value: "meridian", label: "Meridian" },
      { value: "laurentian", label: "Laurentian" },
      { value: "coast_capital", label: "Coast Capital" },
      { value: "hsbc", label: "HSBC" },
      { value: "eq", label: "EQ Bank" },
      { value: "other", label: "Other" },
    ],
    nextQuestion: 116,
  },
  {
    id: 116,
    page: 116,
    category: "assets",
    text: "Do you have any assets?",
    type: "conditionalMultipleItems",
    profileInitials: "",
    initialField: {
      key: "hasAssets",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ],
    },
    itemFields: [
      { key: "item", placeholder: "Item", type: "text" },
      {
        key: "value",
        placeholder: "Value",
        type: "text",
        keyboard: "numeric",
        prefix: "$",
      },
    ],
    addButtonText: "Add another",
    nextQuestion: 118,
  },
  {
    id: 118,
    page: 118,
    category: "properties",
    text: "Do you have any other properties?",
    type: "conditionalForm",
    profileInitials: "",
    initialField: {
      key: "hasOtherProperties",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ],
    },
    conditionalFields: {
      yes: [
        { key: "address", placeholder: "Address", type: "text" },
        {
          key: "value",
          placeholder: "Value",
          type: "text",
          keyboard: "numeric",
          prefix: "$",
        },
        {
          key: "planningSelling",
          label: "Planning on selling?",
          type: "toggleButtonGroup",
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ],
        },
        {
          key: "hasMortgage",
          label: "Does it have a mortgage?",
          type: "toggleButtonGroup",
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ],
        },
        {
          key: "mortgageAmount",
          placeholder: "Amount",
          type: "text",
          keyboard: "numeric",
          prefix: "$",
          condition: { key: "hasMortgage", value: "yes" },
        },
      ],
    },
    nextQuestion: 101,
  },
  // === CO-SIGNER QUESTIONS SECTION ===
  // All co-signer questions are now grouped together at the end
  {
    id: 101,
    page: 101,
    category: "co_personal_details",
    text: "What are your co-signer's details?",
    type: "form",
    fields: [
      {
        key: "coFirstName",
        label: "",
        placeholder: "First Name",
        required: true,
      },
      {
        key: "coLastName",
        label: "",
        placeholder: "Last Name",
        required: true,
      },
      {
        key: "coEmail",
        label: "",
        placeholder: "Email",
        keyboard: "email-address",
      },
      {
        key: "coPhone",
        label: "",
        placeholder: "Phone",
        keyboard: "phone-pad",
      },
    ],
    nextQuestion: 103,
  },
  {
    id: 103,
    page: 103,
    category: "co_personal_details",
    text: "What is [coFirstName]'s details?", // This would be dynamically populated with co-signer's name
    type: "complexForm",
    profileInitials: "", // Would be dynamically generated from co-signer's name
    sections: [
      {
        title: "Date of birth",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "coBirthMonth",
            placeholder: "Month",

            type: "select",
            accommodateWidth: 3,
          },
          {
            key: "coBirthDay",
            placeholder: "Day",
            type: "select",
            accommodateWidth: 3,
          },
          {
            key: "coBirthYear",
            placeholder: "Year",
            type: "select",
            accommodateWidth: 3,
          },
        ],
      },
      {
        fields: [
          {
            key: "coSinNumber",
            placeholder: "SIN Number (Optional)",
            keyboard: "numeric",
            infoText: "SIN is not required, but can speed up the pre-approval",
          },
          {
            key: "coDependents",
            placeholder: "Number of Dependents",
            type: "select",
            options: [
              { value: "0", label: "0" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4+", label: "4+" },
            ],
          },
        ],
      },
    ],
    nextQuestion: 105,
  },
  {
    id: 105,
    page: 105,
    category: "co_living_details",
    text: "Where is [coFirstName] currently living?", // Dynamically populated
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        fields: [
          { key: "coAddress", placeholder: "Address", type: "text" },
          {
            key: "coLivingStatus",
            placeholder: "Living Status",
            type: "select",
            options: [
              { value: "own", label: "I Own" },
              { value: "rent", label: "I Rent" },
              { value: "with_parents", label: "I Live with Parents" },
            ],
          },
        ],
      },
      {
        title: "How long have they lived here?",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "coMonths",
            placeholder: "Month",
            type: "select",
            accommodateWidth: 2,
          },
          {
            key: "coYears",
            placeholder: "Year",
            type: "select",
            accommodateWidth: 2,
          },
        ],
      },
    ],
    nextQuestion: 110,
  },
  {
    id: 110,
    page: 110,
    category: "co_employment_details",
    text: "Currently what type of income does [coFirstName] have?",
    type: "multipleChoice",
    profileInitials: "",
    options: [
      { value: "employed", label: "Employed" },
      { value: "self_employed", label: "Self-Employed" },
      { value: "pension", label: "Pension" },
      { value: "other", label: "Other" },
    ],
    nextQuestionMap: {
      employed: 111,
      self_employed: 111,
      pension: 113,
      other: 113,
    },
  },
  {
    id: 111,
    page: 111,
    category: "co_employment_details",
    text: "Where does [coFirstName] work?",
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        fields: [
          { key: "coCompanyName", placeholder: "Company Name", type: "text" },
          {
            key: "coCompanyAddress",
            placeholder: "Company Address",
            type: "text",
          },
          { key: "coJobTitle", placeholder: "Job Title", type: "text" },
          {
            key: "coEmploymentType",
            label: "Employment Type",
            type: "buttonGroup",
            options: [
              { value: "full_time", label: "Full Time" },
              { value: "part_time", label: "Part time" },
              { value: "seasonal", label: "Seasonal" },
            ],
          },
        ],
      },
      {
        title: "When did you start here?",
        accommodateAllInOneLine: true,
        fields: [
          {
            key: "months",
            label: "",
            type: "select",
            placeholder: "Month",
            accommodateWidth: 2,
          },
          {
            key: "years",
            label: "",
            type: "select",
            placeholder: "Year",
            accommodateWidth: 2,
          },
        ],
      },
    ],
    nextQuestion: 112, // Continue with banking questions
  },
  {
    id: 112,
    page: 112,
    category: "co_income_details",
    text: "How much does [coFirstName] make?",
    type: "complexForm",
    profileInitials: "",
    fields: [
      {
        key: "coIncome",
        placeholder: "Annual Income",
        prefix: "$",
        type: "text",
        keyboard: "numeric",
      },
      {
        key: "coBonuses",
        label: "Bonuses or Commissions?",
        type: "toggleButtonGroup",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        key: "coBenefits",
        label: "Benefits?",
        type: "toggleButtonGroup",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        key: "coBonusComissionAnnualAmount",
        placeholder: "Annual Amount",
        prefix: "$",
        type: "text",
        keyboard: "numeric",
        condition: {
          anyOf: [
            { key: "coBonuses", value: "yes" },
            { key: "coBenefits", value: "yes" },
          ],
        },
      },
    ],
    nextQuestion: 115, // Continue with banking questions
  },
  {
    id: 113,
    page: 113,
    category: "co_income_details",
    text: "What is [coFirstName]'s monthly income?",
    type: "numericInput",
    profileInitials: "",
    placeholder: "Enter amount",
    prefix: "$",
    keyboard: "numeric",
    nextQuestion: 115,
  },
  {
    id: 115,
    page: 115,
    category: "co_banking_details",
    text: "Who does [coFirstName] bank with?",
    type: "dropdown",
    profileInitials: "",
    placeholder: "Bank Name",
    options: [
      { value: "td", label: "TD Canada Trust" },
      { value: "rbc", label: "Royal Bank of Canada (RBC)" },
      { value: "bmo", label: "Bank of Montreal (BMO)" },
      { value: "scotiabank", label: "Scotiabank" },
      { value: "cibc", label: "CIBC" },
      { value: "national", label: "National Bank" },
      { value: "desjardins", label: "Desjardins" },
      { value: "tangerine", label: "Tangerine" },
      { value: "vancity", label: "Vancity" },
      { value: "atb", label: "ATB Financial" },
      { value: "simplii", label: "Simplii" },
      { value: "meridian", label: "Meridian" },
      { value: "laurentian", label: "Laurentian" },
      { value: "coast_capital", label: "Coast Capital" },
      { value: "hsbc", label: "HSBC" },
      { value: "eq", label: "EQ Bank" },
      { value: "other", label: "Other" },
      { value: "same", label: "Same as primary applicant" },
    ],
    nextQuestion: 117,
  },
  {
    id: 117,
    page: 117,
    category: "co_assets",
    text: "Does [coFirstName] have any assets?",
    type: "conditionalMultipleItems",
    profileInitials: "",
    initialField: {
      key: "coHasAssets",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ],
    },
    itemFields: [
      { key: "coItem", placeholder: "Item", type: "text" },
      {
        key: "coValue",
        placeholder: "Value",
        type: "text",
        keyboard: "numeric",
        prefix: "$",
      },
    ],
    addButtonText: "Add another",
    nextQuestion: 119,
  },
  {
    id: 119,
    page: 119,
    category: "co_properties",
    text: "Does [coFirstName] have any other properties?",
    type: "conditionalForm",
    profileInitials: "",
    initialField: {
      key: "coHasOtherProperties",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ],
    },
    conditionalFields: {
      yes: [
        { key: "coAddress", placeholder: "Address", type: "text" },
        {
          key: "coValue",
          placeholder: "Value",
          type: "text",
          keyboard: "numeric",
          prefix: "$",
        },
        {
          key: "coPlanningSelling",
          label: "Planning on selling?",
          type: "toggleButtonGroup",
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ],
        },
        {
          key: "coHasMortgage",
          label: "Does it have a mortgage?",
          type: "toggleButtonGroup",
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ],
        },
        {
          key: "coMortgageAmount",
          placeholder: "Amount",
          type: "text",
          keyboard: "numeric",
          prefix: "$",
          condition: { key: "coHasMortgage", value: "yes" },
        },
      ],
    },
    nextQuestion: 121,
  },
  // === END CO-SIGNER QUESTIONS SECTION ===
  {
    id: 121,
    page: 121,
    text: "Thanks! Your application has been submitted.",
    type: "finalStep",
    submitButtonText: "Submit Application",
  },
];

export { questions };
