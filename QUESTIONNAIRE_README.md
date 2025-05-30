# Questionnaire System Documentation

## Overview

This is a comprehensive questionnaire system for the RoostDevNative app that displays one question per page and supports various question types. The system is built with React Native and manages 121 questions covering the mortgage application flow.

## Architecture

### Context Management

- **QuestionnaireContext** (`context/QuestionnaireContext.js`): Manages questionnaire state including current question, responses, navigation history, and progress tracking.

### Components

#### Core Components

- **Questionnaire** (`components/questionnaire/Questionnaire.js`): Main questionnaire screen that orchestrates the entire flow
- **QuestionRenderer** (`components/questionnaire/QuestionRenderer.js`): Routes to appropriate question type components based on question data
- **ProgressBar** (`components/questionnaire/ProgressBar.js`): Visual progress indicator

#### Question Type Components (`components/questionnaire/question-types/`)

- **MultipleChoice**: Handle single-selection from multiple options
- **NumericInput**: Numeric input fields with custom keyboards
- **Form**: Simple forms with multiple text fields
- **ComplexForm**: Multi-section forms with various field types
- **ConditionalForm**: Forms with conditional field display
- **Dropdown**: Select dropdowns with modal overlays
- **TextArea**: Multi-line text input
- **ToggleButtonGroup**: Toggle button selections
- **FinalStep**: Completion screen

#### Common Components (`components/common/`)

- **Button**: Reusable button with loading states and variants
- **TextInput**: Enhanced text input with labels and validation
- **Select**: Dropdown component with search-friendly modal

### Data Structure

- **questionnaireData.js** (`data/questionnaireData.js`): Contains all 121 questions with their types, options, and navigation logic

### Utilities

- **questionnaireUtils.js** (`utils/questionnaireUtils.js`): Helper functions for date options, validation, and dynamic text processing

## Question Types Supported

1. **multipleChoice**: Single selection from multiple options
2. **numericInput**: Numeric input with custom keyboards
3. **form**: Simple forms with text fields
4. **complexForm**: Multi-section forms with mixed field types
5. **conditionalForm**: Forms with conditional field display
6. **conditionalMultipleItems**: Conditional forms with multiple item support (Add Another functionality)
7. **dropdown**: Select dropdowns
8. **textArea**: Multi-line text input
9. **toggleButtonGroup**: Toggle button selections
10. **finalStep**: Completion screen

## Features

### Navigation

- Sequential question flow with Previous/Next buttons
- **Auto-navigation for multiple choice questions** - selections automatically advance to next question
- Smart navigation based on question responses
- Progress tracking with visual indicator
- Support for conditional navigation via `nextQuestionMap`
- Next button is hidden for multiple choice questions since they auto-advance

### State Management

- Automatic response saving to context
- Navigation history tracking
- Progress calculation based on visited questions
- Data persistence via API integration

### Dynamic Content

- Support for dynamic text replacement (e.g., `[coFirstName]`)
- Auto-generated options for dates (month/day/year)
- Conditional field display based on previous responses

### Validation

- Required field validation for forms
- Custom validation for different field types
- Prevents progression without completing required fields

### UI/UX

- Modern, clean interface with app theme colors
- Loading states for form submissions
- Error handling and user feedback
- Responsive design for different screen sizes

## Usage

### Integration

The questionnaire is integrated into the main app flow via `Home.js`:

```javascript
import ClientQuestionaire from "./ClientQuestionaire.js";

// Shows questionnaire if not completed
{
  showQuestionnaire ? (
    <ClientQuestionaire />
  ) : (
    <ClientHome questionnaireData={clientQuestionaire} />
  );
}
```

### Starting the Questionnaire

The questionnaire automatically starts from question 1 and guides users through the complete flow.

### Data Flow

1. User responds to questions
2. Responses stored in QuestionnaireContext
3. Navigation logic determines next question
4. Progress tracked and displayed
5. Final submission to API endpoint

## API Integration

### Endpoints

- **Submit**: `PUT /client/questionnaire/{clientId}` - Submits complete questionnaire responses
- **Fetch**: Used by Home.js to determine if questionnaire is complete

### Data Format

Responses are stored as an object with question IDs as keys:

```javascript
{
  1: "still_looking",
  2: "500000",
  3: "100000",
  // ... more responses
}
```

## Configuration

### Adding New Question Types

1. Create component in `question-types/` directory
2. Add import and case to `QuestionRenderer.js`
3. Export from `question-types/index.js`

### Modifying Questions

Edit `data/questionnaireData.js` to:

- Add/remove questions
- Change question types
- Modify navigation logic
- Update options and validation

### Styling

All components use consistent styling with:

- Primary color: `#019B8E`
- Text color: `#23231A`
- Background: `#FFFFFF`
- Consistent spacing and typography

## Development Notes

### Testing

- All components pass error checking
- No syntax errors found
- Ready for integration testing

### Performance

- Efficient re-rendering with proper state management
- Optimized navigation with minimal re-computation
- Lazy loading of question components

### Accessibility

- Proper touch targets for mobile
- Clear visual feedback for selections
- Logical tab order for form navigation

## Future Enhancements

### Potential Additions

1. **Offline Support**: Cache responses locally
2. **Analytics**: Track completion rates and drop-off points
3. **Conditional Logic**: More complex branching scenarios
4. **File Uploads**: Support for document attachments
5. **Multi-language**: Internationalization support
6. **Themes**: Customizable color schemes
7. **Animations**: Smooth transitions between questions

### Known Limitations

1. Currently supports single-path progression (no complex branching)
2. No built-in validation for complex business rules
3. Limited support for nested conditional forms

## Maintenance

### Regular Tasks

1. Update question data as requirements change
2. Add new question types as needed
3. Monitor API integration for errors
4. Update styling to match app theme changes

### Troubleshooting

- Check console for navigation errors
- Verify API endpoint responses
- Ensure question data structure is valid
- Test on different device sizes

This questionnaire system provides a robust, scalable solution for collecting complex user data in a mobile-friendly, one-question-per-page format.
