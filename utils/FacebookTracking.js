/**
 * Facebook Tracking Utility
 * 
 * This module provides easy-to-use functions for tracking events with Facebook Pixel/SDK
 * 
 * Usage:
 * 1. Import in App.js and call initializeFacebook() on app start
 * 2. Use tracking functions throughout your app to log user actions
 */

let Facebook = null;
let isFacebookAvailable = false;

// Try to import Facebook SDK, but don't crash if unavailable
try {
  Facebook = require('expo-facebook');
  isFacebookAvailable = true;
} catch (error) {
  console.warn('⚠️ expo-facebook not available. Facebook tracking disabled.');
  isFacebookAvailable = false;
}

// Initialize Facebook SDK
export const initializeFacebook = async () => {
  if (!isFacebookAvailable || !Facebook) {
    console.warn('⚠️ Facebook SDK not available. Skipping initialization.');
    return false;
  }
  
  try {
    await Facebook.initializeAsync({
      appId: '902644532531488',
      appName: 'Roost App',
    });
    console.log('✅ Facebook SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Facebook SDK:', error);
    isFacebookAvailable = false;
    return false;
  }
};

// Generic event logging function
export const logEvent = async (eventName, parameters = {}) => {
  if (!isFacebookAvailable || !Facebook) {
    return; // Silently skip if Facebook is unavailable
  }
  
  try {
    await Facebook.logEventAsync(eventName, parameters);
    console.log(`📊 Facebook Event Logged: ${eventName}`, parameters);
  } catch (error) {
    console.error('❌ Failed to log Facebook event:', error);
  }
};

// ====================
// STANDARD FACEBOOK EVENTS
// ====================

/**
 * Track App Activation (App Open)
 * Use: Call when app becomes active
 */
export const trackAppOpen = async () => {
  await logEvent('fb_mobile_activate_app');
};

/**
 * Track Screen/Content View
 * @param {string} screenName - Name of the screen being viewed
 * @param {object} additionalParams - Optional additional parameters
 */
export const trackScreenView = async (screenName, additionalParams = {}) => {
  await logEvent('fb_mobile_content_view', {
    fb_content_type: 'screen',
    fb_content: screenName,
    ...additionalParams,
  });
};

/**
 * Track User Registration
 * @param {string} method - Registration method (e.g., 'email', 'phone', 'google', 'facebook')
 */
export const trackRegistration = async (method = 'email') => {
  await logEvent('fb_mobile_complete_registration', {
    fb_registration_method: method,
  });
};

/**
 * Track Purchase/Transaction
 * @param {number} amount - Purchase amount
 * @param {string} currency - Currency code (default: 'USD')
 * @param {object} additionalParams - Optional parameters (content_type, content_id, etc.)
 */
export const trackPurchase = async (amount, currency = 'USD', additionalParams = {}) => {
  await logEvent('fb_mobile_purchase', {
    fb_currency: currency,
    _valueToSum: amount,
    ...additionalParams,
  });
};

/**
 * Track Add to Cart
 * @param {string} contentType - Type of content (e.g., 'product', 'service')
 * @param {string} contentId - ID of the content
 * @param {number} value - Value of the item
 */
export const trackAddToCart = async (contentType, contentId, value) => {
  await logEvent('fb_mobile_add_to_cart', {
    fb_content_type: contentType,
    fb_content_id: contentId,
    fb_currency: 'USD',
    _valueToSum: value,
  });
};

/**
 * Track Search
 * @param {string} searchString - Search query
 * @param {object} additionalParams - Optional parameters
 */
export const trackSearch = async (searchString, additionalParams = {}) => {
  await logEvent('fb_mobile_search', {
    fb_search_string: searchString,
    ...additionalParams,
  });
};

/**
 * Track Achievement Unlocked
 * @param {string} achievementId - ID of the achievement
 */
export const trackAchievement = async (achievementId) => {
  await logEvent('fb_mobile_achievement_unlocked', {
    fb_description: achievementId,
  });
};

// ====================
// CUSTOM EVENTS FOR ROOST APP
// ====================

/**
 * Track User Login
 * @param {string} method - Login method (email, google, facebook, apple)
 */
export const trackLogin = async (method = 'email') => {
  await logEvent('user_login', {
    login_method: method,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Property View
 * @param {string} propertyId - Property ID
 * @param {string} propertyType - Type of property (house, condo, apartment, etc.)
 * @param {number} price - Property price
 */
export const trackPropertyView = async (propertyId, propertyType, price) => {
  await logEvent('property_viewed', {
    property_id: propertyId,
    property_type: propertyType,
    price: price,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Document Upload
 * @param {string} documentType - Type of document (id, mortgage, contract, etc.)
 * @param {string} userType - Type of user (client, realtor)
 */
export const trackDocumentUpload = async (documentType, userType) => {
  await logEvent('document_uploaded', {
    document_type: documentType,
    user_type: userType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Realtor Assignment
 * @param {string} realtorId - Realtor's user ID
 * @param {string} clientId - Client's user ID
 */
export const trackRealtorAssignment = async (realtorId, clientId) => {
  await logEvent('realtor_assigned', {
    realtor_id: realtorId,
    client_id: clientId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Transaction Started
 * @param {string} transactionType - Type (purchase, sale, rent)
 * @param {number} propertyValue - Property value
 */
export const trackTransactionStarted = async (transactionType, propertyValue) => {
  await logEvent('transaction_started', {
    transaction_type: transactionType,
    property_value: propertyValue,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Message Sent
 * @param {string} conversationType - Type (client_realtor, client_client, etc.)
 * @param {boolean} isFirstMessage - Is this the first message in conversation
 */
export const trackMessageSent = async (conversationType, isFirstMessage = false) => {
  await logEvent('message_sent', {
    conversation_type: conversationType,
    is_first_message: isFirstMessage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Appointment Scheduled
 * @param {string} appointmentType - Type (viewing, consultation, signing, etc.)
 * @param {string} scheduledDate - Date of appointment
 */
export const trackAppointmentScheduled = async (appointmentType, scheduledDate) => {
  await logEvent('appointment_scheduled', {
    appointment_type: appointmentType,
    scheduled_date: scheduledDate,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Profile Completion
 * @param {number} completionPercentage - Percentage of profile completed (0-100)
 */
export const trackProfileCompletion = async (completionPercentage) => {
  await logEvent('profile_completed', {
    completion_percentage: completionPercentage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Questionnaire Completion
 * @param {string} questionnaireType - Type of questionnaire
 * @param {number} score - Score if applicable
 */
export const trackQuestionnaireCompleted = async (questionnaireType, score = null) => {
  const params = {
    questionnaire_type: questionnaireType,
    timestamp: new Date().toISOString(),
  };
  
  if (score !== null) {
    params.score = score;
  }
  
  await logEvent('questionnaire_completed', params);
};

/**
 * Track Reward Earned
 * @param {string} rewardType - Type of reward
 * @param {number} rewardValue - Value of reward
 */
export const trackRewardEarned = async (rewardType, rewardValue) => {
  await logEvent('reward_earned', {
    reward_type: rewardType,
    reward_value: rewardValue,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Pre-Approval Request
 * @param {number} loanAmount - Requested loan amount
 * @param {string} propertyType - Type of property
 */
export const trackPreApprovalRequest = async (loanAmount, propertyType) => {
  await logEvent('pre_approval_requested', {
    loan_amount: loanAmount,
    property_type: propertyType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Custom Event
 * @param {string} eventName - Name of the custom event
 * @param {object} params - Event parameters
 */
export const trackCustomEvent = async (eventName, params = {}) => {
  await logEvent(eventName, {
    ...params,
    timestamp: new Date().toISOString(),
  });
};

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Set User ID for tracking
 * @param {string} userId - User's unique identifier
 */
export const setUserId = async (userId) => {
  try {
    await Facebook.setUserIDAsync(userId);
    console.log(`✅ Facebook User ID set: ${userId}`);
  } catch (error) {
    console.error('❌ Failed to set Facebook User ID:', error);
  }
};

/**
 * Clear User Data (for logout)
 */
export const clearUserData = async () => {
  try {
    await Facebook.setUserIDAsync(null);
    console.log('✅ Facebook user data cleared');
  } catch (error) {
    console.error('❌ Failed to clear Facebook user data:', error);
  }
};

/**
 * Set User Properties
 * @param {object} properties - User properties (email, phone, firstName, lastName, etc.)
 */
export const setUserProperties = async (properties) => {
  try {
    await Facebook.setUserDataAsync(properties);
    console.log('✅ Facebook user properties set:', properties);
  } catch (error) {
    console.error('❌ Failed to set Facebook user properties:', error);
  }
};

// Export all functions
export default {
  initializeFacebook,
  logEvent,
  trackAppOpen,
  trackScreenView,
  trackRegistration,
  trackPurchase,
  trackAddToCart,
  trackSearch,
  trackAchievement,
  trackLogin,
  trackPropertyView,
  trackDocumentUpload,
  trackRealtorAssignment,
  trackTransactionStarted,
  trackMessageSent,
  trackAppointmentScheduled,
  trackProfileCompletion,
  trackQuestionnaireCompleted,
  trackRewardEarned,
  trackPreApprovalRequest,
  trackCustomEvent,
  setUserId,
  clearUserData,
  setUserProperties,
};
