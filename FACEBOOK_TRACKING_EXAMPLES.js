/**
 * EXAMPLE: Screen Component with Facebook Tracking
 * 
 * This example shows how to:
 * 1. Track screen views automatically
 * 2. Track user actions and events
 * 3. Integrate Facebook Pixel tracking in your components
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  trackScreenView,
  trackDocumentUpload,
  trackMessageSent,
  trackCustomEvent,
  trackPropertyView,
  trackAppointmentScheduled,
} from '../utils/FacebookTracking';

// ====================
// EXAMPLE 1: Client Home Screen with Auto Screen Tracking
// ====================
export const ClientHomeScreen = ({ navigation }) => {
  // ✅ Track screen view when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Client_Home');
    }, [])
  );

  const handleUploadDocument = async () => {
    try {
      // Your document upload logic here
      // ...
      
      // ✅ Track the document upload event
      await trackDocumentUpload('mortgage_document', 'client');
      
      console.log('Document uploaded and tracked');
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleViewProperty = async (propertyId, propertyType, price) => {
    try {
      // Navigate to property details
      navigation.navigate('PropertyDetails', { propertyId });
      
      // ✅ Track property view
      await trackPropertyView(propertyId, propertyType, price);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client Dashboard</Text>
      
      <TouchableOpacity onPress={handleUploadDocument} style={styles.button}>
        <Text style={styles.buttonText}>Upload Document</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handleViewProperty('prop123', 'house', 500000)} 
        style={styles.button}
      >
        <Text style={styles.buttonText}>View Property</Text>
      </TouchableOpacity>
    </View>
  );
};

// ====================
// EXAMPLE 2: Signup Screen with Registration Tracking
// ====================
import { trackRegistration, setUserId, setUserProperties } from '../utils/FacebookTracking';

export const SignupScreen = ({ navigation }) => {
  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Signup');
    }, [])
  );

  const handleSignup = async (userData) => {
    try {
      // Your signup API call
      const response = await signupAPI(userData);
      
      if (response.success) {
        // ✅ Track successful registration
        await trackRegistration('email');
        
        // ✅ Set user ID for future tracking
        await setUserId(response.userId);
        
        // ✅ Set user properties (optional, for better targeting)
        await setUserProperties({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
        });
        
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your signup form */}
    </View>
  );
};

// ====================
// EXAMPLE 3: Chat Screen with Message Tracking
// ====================
export const ChatScreen = ({ route }) => {
  const { conversationType, isFirstMessage } = route.params;

  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Chat', { conversation_type: conversationType });
    }, [conversationType])
  );

  const handleSendMessage = async (message) => {
    try {
      // Your message sending logic
      // ...
      
      // ✅ Track message sent
      await trackMessageSent(conversationType, isFirstMessage);
      
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your chat UI */}
    </View>
  );
};

// ====================
// EXAMPLE 4: Appointment Scheduling with Event Tracking
// ====================
export const ScheduleAppointmentScreen = () => {
  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Schedule_Appointment');
    }, [])
  );

  const handleScheduleAppointment = async (appointmentData) => {
    try {
      // Your appointment scheduling logic
      // ...
      
      // ✅ Track appointment scheduled
      await trackAppointmentScheduled(
        appointmentData.type, // e.g., 'property_viewing'
        appointmentData.date  // e.g., '2024-03-15'
      );
      
      // Also track as custom event with more details
      await trackCustomEvent('appointment_confirmed', {
        appointment_type: appointmentData.type,
        scheduled_date: appointmentData.date,
        realtor_id: appointmentData.realtorId,
        property_id: appointmentData.propertyId,
      });
      
    } catch (error) {
      console.error('Schedule error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your scheduling UI */}
    </View>
  );
};

// ====================
// EXAMPLE 5: Using useEffect for Screen Tracking (Alternative)
// ====================
export const AlternativeTrackingExample = () => {
  // Alternative: Use useEffect instead of useFocusEffect
  // Good for screens that are never unmounted or don't need refocus tracking
  useEffect(() => {
    trackScreenView('Settings');
  }, []);

  return (
    <View style={styles.container}>
      <Text>Settings Screen</Text>
    </View>
  );
};

// ====================
// EXAMPLE 6: Questionnaire Completion
// ====================
import { trackQuestionnaireCompleted } from '../utils/FacebookTracking';

export const QuestionnaireScreen = () => {
  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Questionnaire');
    }, [])
  );

  const handleQuestionnaireSubmit = async (answers) => {
    try {
      // Calculate score or process answers
      const score = calculateScore(answers);
      
      // Submit to API
      // ...
      
      // ✅ Track questionnaire completion
      await trackQuestionnaireCompleted('pre_approval', score);
      
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your questionnaire UI */}
    </View>
  );
};

// ====================
// EXAMPLE 7: Login with Method Tracking
// ====================
import { trackLogin } from '../utils/FacebookTracking';

export const LoginScreen = () => {
  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Login');
    }, [])
  );

  const handleEmailLogin = async (email, password) => {
    try {
      const response = await loginAPI(email, password);
      
      if (response.success) {
        // ✅ Track login
        await trackLogin('email');
        
        // ✅ Set user ID
        await setUserId(response.userId);
        
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await googleLoginAPI();
      
      if (response.success) {
        // ✅ Track Google login
        await trackLogin('google');
        await setUserId(response.userId);
        
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const response = await appleLoginAPI();
      
      if (response.success) {
        // ✅ Track Apple login
        await trackLogin('apple');
        await setUserId(response.userId);
        
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Apple login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your login UI */}
    </View>
  );
};

// ====================
// EXAMPLE 8: Pre-Approval Request
// ====================
import { trackPreApprovalRequest } from '../utils/FacebookTracking';

export const PreApprovalScreen = () => {
  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Pre_Approval_Request');
    }, [])
  );

  const handleSubmitPreApproval = async (formData) => {
    try {
      // Submit pre-approval request
      // ...
      
      // ✅ Track pre-approval request
      await trackPreApprovalRequest(
        formData.loanAmount,    // e.g., 500000
        formData.propertyType    // e.g., 'single_family'
      );
      
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your pre-approval form */}
    </View>
  );
};

// ====================
// EXAMPLE 9: Logout with Data Cleanup
// ====================
import { clearUserData } from '../utils/FacebookTracking';

export const logout = async () => {
  try {
    // Your logout logic
    // ...
    
    // ✅ Clear Facebook user data
    await clearUserData();
    
    // Navigate to login
    navigation.navigate('Login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// ====================
// STYLES
// ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#CB003F',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * KEY POINTS TO REMEMBER:
 * 
 * 1. USE useFocusEffect FOR SCREEN TRACKING
 *    - Tracks every time screen comes into focus
 *    - Better for tab navigation and back navigation
 * 
 * 2. USE useEffect FOR ONE-TIME TRACKING
 *    - Tracks only on first mount
 *    - Good for screens that are rarely revisited
 * 
 * 3. TRACK USER ACTIONS AFTER SUCCESS
 *    - Call tracking functions after successful operations
 *    - Include relevant context data
 * 
 * 4. SET USER ID ON LOGIN/SIGNUP
 *    - Helps Facebook connect events to specific users
 *    - Call setUserId() after authentication
 * 
 * 5. CLEAR USER DATA ON LOGOUT
 *    - Protects user privacy
 *    - Call clearUserData() when user logs out
 * 
 * 6. USE CUSTOM EVENTS FOR APP-SPECIFIC ACTIONS
 *    - Track unique features of your app
 *    - Include meaningful parameters
 * 
 * 7. HANDLE ERRORS GRACEFULLY
 *    - Tracking failures shouldn't break app functionality
 *    - Log errors for debugging
 */
