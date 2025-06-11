# RoostDevNative - Complete Components List

## Main Application Components

### Root Components

- **App.js** - Main app component with navigation
- **Home.js** - Home wrapper component that routes to client/realtor/login
- **index.js** - App entry point

### Home Components

- **ClientHome.js** - Client dashboard/home screen
- **RealtorHome.js** - Realtor dashboard/home screen
- **ClientQuestionaire.js** - Client questionnaire wrapper

### Profile Components

- **ClientProfile.js** - Client profile management screen
- **RealtorProfile.js** (screens/RealtorProfile.js) - Realtor profile management screen

### Authentication Screens

- **LoginScreen.js** (screens/LoginScreen.js) - Login form
- **PasswordResetScreen.js** (screens/PasswordResetScreen.js) - Password reset screen
- **PasswordScreen.js** (screens/PasswordScreen.js) - Password creation screen

### Signup Flow Screens

- **SignupScreen.js** (screens/SignupScreen.js) - Account type selection
- **SignupScreen2.js** (screens/SignupScreen2.js) - User details form
- **SignupScreen3PhoneVerification.js** (screens/SignupScreen3PhoneVerification.js) - Email verification
- **SignupSuccess.js** (screens/SignupSuccess.js) - Signup success screen

### Client Screens

- **ClientDetails.js** (screens/ClientDetails.js) - Individual client details view
- **WrappedClientDetails.js** (screens/WrappedClientDetails.js) - Client details with context wrapper

### Realtor Screens

- **RealtorRewards.js** (screens/RealtorRewards.js) - Rewards management screen
- **AddProfilePic.js** (screens/AddProfilePic.js) - Profile picture upload screen

## Component Library

### Common UI Components

- **Button.js** (components/common/Button.js) - Reusable button component
- **FigmaButton.js** (components/common/FigmaButton.js) - Figma design system button component
- **TextInput.js** (components/common/TextInput.js) - Styled text input component
- **Select.js** (components/common/Select.js) - Dropdown selection component

### Brand Components

- **Logo.js** (components/Logo.js) - Logo component with variants

### Feature Components

- **NotificationComponent.js** - Notification panel/modal
- **NetworkStatusIndicator.js** (components/NetworkStatusIndicator.js) - Network status display
- **OfflineGame.js** (components/OfflineGame.js) - Snake game for offline mode
- **RequestDocumentModal.js** (components/RequestDocumentModal.js) - Document request modal
- **RequestDocumentModal.js** (screens/RequestDocumentModal.js) - Duplicate document modal

## Questionnaire Components

### Main Questionnaire Components

- **Questionnaire.js** (components/questionnaire/Questionnaire.js) - Main questionnaire container
- **QuestionRenderer.js** (components/questionnaire/QuestionRenderer.js) - Question type renderer
- **ProgressBar.js** (components/questionnaire/ProgressBar.js) - Progress indicator
- **QuestionnaireTest.js** (components/questionnaire/QuestionnaireTest.js) - Test component

### Question Type Components

Located in `components/questionnaire/question-types/`:

- **ComplexForm.js** - Complex form with multiple fields
- **ConditionalForm.js** - Conditional form fields
- **ConditionalMultipleItems.js** - Conditional multiple selection
- **Dropdown.js** - Dropdown question type
- **FinalStep.js** - Final questionnaire step
- **Form.js** - Basic form question type
- **MultipleChoice.js** - Multiple choice questions
- **NumericInput.js** - Numeric input questions
- **TextArea.js** - Text area questions
- **ToggleButtonGroup.js** - Toggle button group questions
- **index.js** - Question types export file

## Navigation Components

- **SignupStack.js** (navigation/SignupStack.js) - Signup flow navigation stack

## Context Providers

Located in `context/`:

- **AuthContext.js** - Authentication state management
- **ClientContext.js** - Client data management
- **NetworkContext.js** - Network status management
- **NotificationContext.js** - Notification management
- **QuestionnaireContext.js** - Questionnaire state management
- **RealtorContext.js** - Realtor data management

## Utility Services

Located in `services/`:

- **NotificationService.js** - Push notification utilities

## Custom Icons

Located in `components/icons/`:

- **ClientAddFloatingButton.js** - Client add floating action button SVG
- **NotificationBellIcon.js** - Notification bell with badge (complex SVG version)
- **NotificationBell.js** - Notification bell with badge (Ionicons version)
- **HelpButtonIcon.js** - Help button SVG component
- **HelpButton.js** - Help button with customizable styles

## Debug Components

Located in `components/debug/`:

- _(Debug components if any)_

---

## Styling Notes

### Common Color Palette Used Across Components:

```javascript
const COLORS = {
  // Core colors
  green: "#377473",
  orange: "#F0913A",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",

  // Accent colors
  blue: "#2271B1",
  yellow: "#F0DE3A",
  red: "#A20E0E",
  error: "#FF3B30",
};
```

### Typography:

- Primary font: "Futura"
- Used consistently across forms, buttons, and text elements

## Components Status for Style Verification

### ✅ Main App Components (5)

- [ ] App.js
- [ ] Home.js
- [ ] ClientHome.js
- [ ] RealtorHome.js
- [ ] ClientQuestionaire.js

### ✅ Authentication Flow (8)

- [ ] LoginScreen.js
- [ ] PasswordResetScreen.js
- [ ] PasswordScreen.js
- [ ] SignupScreen.js
- [ ] SignupScreen2.js
- [ ] SignupScreen3PhoneVerification.js
- [ ] SignupSuccess.js
- [ ] SignupStack.js

### ✅ Profile Components (3)

- [ ] ClientProfile.js
- [ ] RealtorProfile.js
- [ ] AddProfilePic.js

### ✅ Client/Realtor Screens (4)

- [ ] ClientDetails.js
- [ ] WrappedClientDetails.js
- [ ] RealtorRewards.js

### ✅ Common UI Components (4)

- [ ] Button.js
- [ ] FigmaButton.js
- [ ] TextInput.js
- [ ] Select.js

### ✅ Feature Components (5)

- [ ] Logo.js
- [ ] NotificationComponent.js
- [ ] NetworkStatusIndicator.js
- [ ] OfflineGame.js
- [ ] RequestDocumentModal.js

### ✅ Questionnaire System (14)

- [ ] Questionnaire.js
- [ ] QuestionRenderer.js
- [ ] ProgressBar.js
- [ ] QuestionnaireTest.js
- [ ] ComplexForm.js
- [ ] ConditionalForm.js
- [ ] ConditionalMultipleItems.js
- [ ] Dropdown.js
- [ ] FinalStep.js
- [ ] Form.js
- [ ] MultipleChoice.js
- [ ] NumericInput.js
- [ ] TextArea.js
- [ ] ToggleButtonGroup.js

### ✅ Icons & Custom Graphics (6)

- [ ] ClientAddFloatingButton.js
- [ ] NotificationBellIcon.js
- [ ] NotificationBell.js
- [ ] HelpButtonIcon.js
- [ ] HelpButton.js
- [ ] FigmaButton.js

**Total Components: 48**

---

_Generated on: ${new Date().toLocaleDateString()}_
_Use this checklist to systematically verify and update styles for each component._
