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
    text: "Let's talk about your budget",
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
    text: "What are your details?",
    type: "form",
    fields: [
      { key: "firstName", label: "First Name", required: true },
      { key: "lastName", label: "Last Name", required: true },
      {
        key: "email",
        label: "Email",
        keyboard: "email-address",
      },
      { key: "phone", label: "Phone", keyboard: "phone-pad" },
    ],

    nextQuestion: 7,
  },
  {
    id: 7,
    page: 6,
    text: "What are your details?",
    type: "complexForm",
    profileInitials: "", // Will be dynamically generated from name
    sections: [
      {
        title: "Date of birth",
        fields: [
          { key: "birthMonth", label: "Month", type: "select" },
          { key: "birthDay", label: "Day", type: "select" },
          { key: "birthYear", label: "Year", type: "select" },
        ],
      },
      {
        fields: [
          { key: "sinNumber", label: "SIN Number" },
          {
            key: "dependents",
            label: "Number of Dependents",
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
    text: "Where are you currently living?",
    type: "complexForm",
    profileInitials: "", // This could be dynamically generated from name
    sections: [
      {
        fields: [
          { key: "address", label: "Address", type: "text" },
          {
            key: "livingStatus",
            label: "Living Status",
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
        title: "How long have you lived here?",
        fields: [
          { key: "months", label: "Month", type: "select" },
          { key: "years", label: "Year", type: "select" },
        ],
      },
    ],

    nextQuestion: 9, // Proceed to next question
  },
  {
    id: 9,
    page: 8,
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
      self_employed: 11,
      pension: 12,
      other: 12,
    },
  },

  {
    id: 10,
    page: 9,
    text: "Where do you work?",
    type: "complexForm",
    fields: [
      {
        key: "companyName",
        label: "Company Name",
        type: "text",
      },
      {
        key: "companyAddress",
        label: "Company Address",
        type: "text",
      },
      {
        key: "jobTitle",
        label: "Your Job Title",
        type: "text",
      },
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

    nextQuestion: 12,
  },

  {
    id: 11,
    page: 10,
    text: "Where do you work?",
    type: "complexForm",
    fields: [
      {
        key: "income",
        label: "Income",
        type: "text",
        keyboard: "numeric",
      },
      {
        key: "companyAddress",
        label: "Company Address",
        type: "text",
      },
      {
        key: "jobTitle",
        label: "Your Job Title",
        type: "text",
      },
      {
        key: "bonuses",
        label: "Bonuses or Commissions?",
        type: "toggleButtonGroup",

        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Nope" },
        ],
      },
      {
        key: "benefits",
        label: "Benefits?",
        type: "toggleButtonGroup",

        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Nope" },
        ],
      },
    ],

    nextQuestion: 12,
  },
  {
    id: 12,
    page: 8,
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
    text: "Do you have any assets?",
    type: "conditionalMultipleItems",
    profileInitials: "",
    initialField: {
      key: "hasAssets",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "Nope" },
        { value: "yes", label: "Yes" },
      ],
    },
    itemFields: [
      { key: "item", label: "Item", type: "text" },
      {
        key: "value",
        label: "Value",
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
    text: "Do you have any other properties?",
    type: "conditionalForm",
    profileInitials: "",
    initialField: {
      key: "hasOtherProperties",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "Nope" },
        { value: "yes", label: "Yes" },
      ],
    },
    conditionalFields: {
      yes: [
        { key: "address", label: "Address", type: "text" },
        {
          key: "value",
          label: "Value",
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
          label: "Amount",
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
    text: "What are your details?",
    type: "form",
    fields: [
      { key: "firstName", label: "First Name", required: true },
      { key: "lastName", label: "Last Name", required: true },
      { key: "email", label: "Email", keyboard: "email-address" },
      { key: "phone", label: "Phone", keyboard: "phone-pad" },
    ],
    nextQuestion: 102,
  },
  {
    id: 102,
    page: 102,
    text: "What are your details?",
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        title: "Date of birth",
        fields: [
          { key: "birthMonth", label: "Month", type: "select" },
          { key: "birthDay", label: "Day", type: "select" },
          { key: "birthYear", label: "Year", type: "select" },
        ],
      },
      {
        fields: [
          { key: "sinNumber", label: "SIN Number" },
          {
            key: "dependents",
            label: "Number of Dependents",
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
    text: "Where are you currently living?",
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        fields: [
          { key: "address", label: "Address", type: "text" },
          {
            key: "livingStatus",
            label: "Living Status",
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
        title: "How long have you lived here?",
        fields: [
          { key: "months", label: "Month", type: "select" },
          { key: "years", label: "Year", type: "select" },
        ],
      },
    ],
    nextQuestion: 106,
  },
  {
    id: 106,
    page: 106,
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
      self_employed: 108,
      pension: 109,
      other: 109,
    },
  },
  {
    id: 107,
    page: 107,
    text: "Where do you work?",
    type: "complexForm",
    profileInitials: "",
    fields: [
      { key: "companyName", label: "Company Name", type: "text" },
      { key: "companyAddress", label: "Company Address", type: "text" },
      { key: "jobTitle", label: "Your Job Title", type: "text" },
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
    nextQuestion: 108, // Skip to co-signer income question
  },
  {
    id: 108,
    page: 108,
    text: "Where do you work?",
    type: "complexForm",
    profileInitials: "",
    fields: [
      { key: "income", label: "Income", type: "text", keyboard: "numeric" },
      { key: "companyAddress", label: "Company Address", type: "text" },
      { key: "jobTitle", label: "Your Job Title", type: "text" },
      {
        key: "bonuses",
        label: "Bonuses or Commissions?",
        type: "toggleButtonGroup",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Nope" },
        ],
      },
      {
        key: "benefits",
        label: "Benefits?",
        type: "toggleButtonGroup",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Nope" },
        ],
      },
    ],
    nextQuestion: 109, // Skip to co-signer income question
  },
  {
    id: 109,
    page: 109,
    text: "What is your monthly income?",
    type: "numericInput",
    profileInitials: "",
    placeholder: "Enter amount",
    prefix: "$",
    keyboard: "numeric",
    nextQuestion: 114,
  },
  {
    id: 114,
    page: 114,
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
    text: "Do you have any assets?",
    type: "conditionalMultipleItems",
    profileInitials: "",
    initialField: {
      key: "hasAssets",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "Nope" },
        { value: "yes", label: "Yes" },
      ],
    },
    itemFields: [
      { key: "item", label: "Item", type: "text" },
      {
        key: "value",
        label: "Value",
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
    text: "Do you have any other properties?",
    type: "conditionalForm",
    profileInitials: "",
    initialField: {
      key: "hasOtherProperties",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "Nope" },
        { value: "yes", label: "Yes" },
      ],
    },
    conditionalFields: {
      yes: [
        { key: "address", label: "Address", type: "text" },
        {
          key: "value",
          label: "Value",
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
          label: "Amount",
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
    text: "What are your co-signer's details?",
    type: "form",
    fields: [
      { key: "coFirstName", label: "First Name", required: true },
      { key: "coLastName", label: "Last Name", required: true },
      { key: "coEmail", label: "Email", keyboard: "email-address" },
      { key: "coPhone", label: "Phone", keyboard: "phone-pad" },
    ],
    nextQuestion: 103,
  },
  {
    id: 103,
    page: 103,
    text: "What is [coFirstName]'s details?", // This would be dynamically populated with co-signer's name
    type: "complexForm",
    profileInitials: "", // Would be dynamically generated from co-signer's name
    sections: [
      {
        title: "Date of birth",
        fields: [
          { key: "coBirthMonth", label: "Month", type: "select" },
          { key: "coBirthDay", label: "Day", type: "select" },
          { key: "coBirthYear", label: "Year", type: "select" },
        ],
      },
      {
        fields: [
          { key: "coSinNumber", label: "SIN Number" },
          {
            key: "coDependents",
            label: "Number of Dependents",
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
    text: "Where is [coFirstName] currently living?", // Dynamically populated
    type: "complexForm",
    profileInitials: "",
    sections: [
      {
        fields: [
          { key: "coAddress", label: "Address", type: "text" },
          {
            key: "coLivingStatus",
            label: "Living Status",
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
        fields: [
          { key: "coMonths", label: "Month", type: "select" },
          { key: "coYears", label: "Year", type: "select" },
        ],
      },
    ],
    nextQuestion: 110,
  },
  {
    id: 110,
    page: 110,
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
      self_employed: 112,
      pension: 113,
      other: 113,
    },
  },
  {
    id: 111,
    page: 111,
    text: "Where does [coFirstName] work?",
    type: "complexForm",
    profileInitials: "",
    fields: [
      { key: "coCompanyName", label: "Company Name", type: "text" },
      { key: "coCompanyAddress", label: "Company Address", type: "text" },
      { key: "coJobTitle", label: "Job Title", type: "text" },
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
    nextQuestion: 115, // Continue with banking questions
  },
  {
    id: 112,
    page: 112,
    text: "Where does [coFirstName] work?",
    type: "complexForm",
    profileInitials: "",
    fields: [
      { key: "coIncome", label: "Income", type: "text", keyboard: "numeric" },
      { key: "coCompanyAddress", label: "Company Address", type: "text" },
      { key: "coJobTitle", label: "Job Title", type: "text" },
      {
        key: "coBonuses",
        label: "Bonuses or Commissions?",
        type: "toggleButtonGroup",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Nope" },
        ],
      },
      {
        key: "coBenefits",
        label: "Benefits?",
        type: "toggleButtonGroup",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "Nope" },
        ],
      },
    ],
    nextQuestion: 115, // Continue with banking questions
  },
  {
    id: 113,
    page: 113,
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
    text: "Does [coFirstName] have any assets?",
    type: "conditionalMultipleItems",
    profileInitials: "",
    initialField: {
      key: "coHasAssets",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "Nope" },
        { value: "yes", label: "Yes" },
      ],
    },
    itemFields: [
      { key: "coItem", label: "Item", type: "text" },
      {
        key: "coValue",
        label: "Value",
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
    text: "Does [coFirstName] have any other properties?",
    type: "conditionalForm",
    profileInitials: "",
    initialField: {
      key: "coHasOtherProperties",
      type: "toggleButtonGroup",
      options: [
        { value: "no", label: "Nope" },
        { value: "yes", label: "Yes" },
      ],
    },
    conditionalFields: {
      yes: [
        { key: "coAddress", label: "Address", type: "text" },
        {
          key: "coValue",
          label: "Value",
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
          label: "Amount",
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
    text: "Thanks! We'll be in touch shortly",
    type: "finalStep",
    submitButtonText: "Submit Application",
  },
];

export { questions };
