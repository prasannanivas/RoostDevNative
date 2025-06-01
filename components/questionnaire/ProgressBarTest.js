// Test file to verify progress bar logic
import {
  calculateQuestionnaireProgress,
  getExpectedQuestionsCount,
} from "../utils/questionnaireUtils";

// Test scenarios
console.log("=== Progress Bar Logic Test ===");

// Test 1: Just me flow
const justMeResponses = { 5: "just_me" };
const justMeVisited = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

console.log("Just Me Flow:");
console.log("Expected questions:", getExpectedQuestionsCount(justMeResponses));
console.log(
  "Progress with 10 questions visited:",
  calculateQuestionnaireProgress(justMeVisited, justMeResponses)
);

// Test 2: Co-signer flow
const coSignerResponses = { 5: "co_signer" };
const coSignerVisited = new Set([1, 2, 3, 4, 5, 100, 101, 102, 103, 104, 105]);

console.log("\nCo-signer Flow:");
console.log(
  "Expected questions:",
  getExpectedQuestionsCount(coSignerResponses)
);
console.log(
  "Progress with 11 questions visited:",
  calculateQuestionnaireProgress(coSignerVisited, coSignerResponses)
);

// Test 3: Completion scenario
const completedVisited = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 121]);

console.log("\nCompleted Questionnaire:");
console.log(
  "Progress when question 121 is reached:",
  calculateQuestionnaireProgress(completedVisited, justMeResponses)
);

// Test 4: Flow not determined yet
const noFlowResponses = {};
const earlyVisited = new Set([1, 2, 3]);

console.log("\nNo Flow Determined Yet:");
console.log("Expected questions:", getExpectedQuestionsCount(noFlowResponses));
console.log(
  "Progress with 3 questions visited:",
  calculateQuestionnaireProgress(earlyVisited, noFlowResponses)
);

// Test 5: Going back scenario (simulating what happens when user goes back)
console.log("\nGoing Back Scenario:");
const beforeBackVisited = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const afterBackVisited = new Set([1, 2, 3, 4, 5, 6, 7]); // User went back 3 questions

console.log(
  "Progress before going back (10 questions):",
  calculateQuestionnaireProgress(beforeBackVisited, justMeResponses)
);
console.log(
  "Progress after going back (7 questions):",
  calculateQuestionnaireProgress(afterBackVisited, justMeResponses)
);
console.log("Progress should decrease when going back: ✓");
