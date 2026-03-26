# META Pixel (Facebook SDK) Implementation Guide

## Overview
This guide covers the complete setup of Facebook SDK and META Pixel for the Roost mobile app on both iOS and Android platforms.

---

## ✅ What Has Been Completed

### 1. Package Installation
- ✅ Installed `expo-facebook` package (v14.0.2)

### 2. App Configuration
- ✅ Added Facebook App ID: `902644532531488`
- ✅ Configured Facebook Display Name: `Roost App`
- ✅ Enabled Auto-Initialization and Event Logging
- ✅ iOS URL Schemes configured
- ✅ Android package name configured
- ✅ Facebook plugin added to Expo plugins

---

## 📋 Facebook Developer Console Setup Required

### Step 1: Complete Facebook App Settings
Visit: https://developers.facebook.com/apps/902644532531488/settings/basic/

#### Android Configuration:
1. Go to **Settings** → **Basic** → **Add Platform** → **Android**
2. Fill in the required fields:
   - **Package Name**: `com.roostapp.roost`
   - **Default Activity Class Name**: `com.roostapp.roost.MainActivity`
   - **Key Hash**: Generate using the command below

3. Generate Android Key Hash:
```bash
# For Windows (using PowerShell):
keytool -exportcert -alias androiddebugkey -keystore "%USERPROFILE%\.android\debug.keystore" | openssl sha1 -binary | openssl base64

# For Mac/Linux:
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
```
*Default password is: `android`*

4. For **Production Key Hash** (when submitting to Play Store):
```bash
keytool -exportcert -alias <YOUR-KEY-ALIAS> -keystore <PATH-TO-PRODUCTION-KEYSTORE> | openssl sha1 -binary | openssl base64
```

#### iOS Configuration:
1. Go to **Settings** → **Basic** → **Add Platform** → **iOS**
2. Fill in the required fields:
   - **Bundle ID**: `com.roostapp.roost`
   - **iPhone Store ID**: (Get this from App Store Connect after app submission)

---

## 🔧 Using Facebook SDK in Your Code

### Initialize Facebook SDK

Create a utility file for Facebook tracking:

**File**: `utils/FacebookTracking.js`

```javascript
import * as Facebook from 'expo-facebook';

// Initialize Facebook SDK
export const initializeFacebook = async () => {
  try {
    await Facebook.initializeAsync({
      appId: '902644532531488',
      appName: 'Roost App',
    });
    console.log('Facebook SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Facebook SDK:', error);
  }
};

// Track App Events
export const logEvent = async (eventName, parameters = {}) => {
  try {
    await Facebook.logEventAsync(eventName, parameters);
    console.log(`Facebook Event Logged: ${eventName}`, parameters);
  } catch (error) {
    console.error('Failed to log Facebook event:', error);
  }
};

// Standard Facebook Events
export const trackAppOpen = async () => {
  await logEvent('fb_mobile_activate_app');
};

export const trackScreenView = async (screenName) => {
  await logEvent('fb_mobile_content_view', {
    fb_content_type: 'screen',
    fb_content: screenName,
  });
};

export const trackPurchase = async (amount, currency = 'USD') => {
  await logEvent('fb_mobile_purchase', {
    fb_currency: currency,
    fb_content_type: 'product',
    _valueToSum: amount,
  });
};

export const trackRegistration = async (method = 'email') => {
  await logEvent('fb_mobile_complete_registration', {
    fb_registration_method: method,
  });
};

export const trackAddToCart = async (contentType, contentId, value) => {
  await logEvent('fb_mobile_add_to_cart', {
    fb_content_type: contentType,
    fb_content_id: contentId,
    fb_currency: 'USD',
    _valueToSum: value,
  });
};

export const trackSearch = async (searchString) => {
  await logEvent('fb_mobile_search', {
    fb_search_string: searchString,
  });
};

export const trackCustomEvent = async (eventName, params = {}) => {
  await logEvent(eventName, params);
};
```

### Integrate in App.js

```javascript
import React, { useEffect } from 'react';
import { initializeFacebook, trackAppOpen } from './utils/FacebookTracking';

export default function App() {
  useEffect(() => {
    // Initialize Facebook SDK when app starts
    const initFacebook = async () => {
      await initializeFacebook();
      await trackAppOpen();
    };
    
    initFacebook();
  }, []);

  // ... rest of your app code
}
```

### Track Screen Views

```javascript
import { trackScreenView } from '../utils/FacebookTracking';
import { useFocusEffect } from '@react-navigation/native';

function HomeScreen() {
  useFocusEffect(
    React.useCallback(() => {
      trackScreenView('Home');
    }, [])
  );

  return (
    // ... your screen content
  );
}
```

### Track User Actions

```javascript
import { trackCustomEvent, trackPurchase, trackRegistration } from '../utils/FacebookTracking';

// Track user registration
const handleSignup = async (userData) => {
  // ... your signup logic
  await trackRegistration('email');
};

// Track important user actions
const handleDocumentUpload = async () => {
  // ... your upload logic
  await trackCustomEvent('document_uploaded', {
    document_type: 'mortgage',
    user_type: 'client',
  });
};

// Track purchases/transactions
const handleTransaction = async (amount) => {
  // ... your transaction logic
  await trackPurchase(amount, 'USD');
};
```

---

## 🧪 Testing Facebook Integration

### 1. Test Events in Development

Facebook provides a **Test Events** tool in the developer console:
1. Go to: https://developers.facebook.com/apps/902644532531488/test-events/
2. Run your app on a device/emulator
3. Perform actions (open app, navigate screens, etc.)
4. Check if events appear in the Test Events dashboard

### 2. Test on Physical Devices
- **iOS**: Test on TestFlight or a registered development device
- **Android**: Test with a debug build or internal testing release

### 3. Verify Pixel Events
1. Open Facebook Events Manager: https://business.facebook.com/events_manager2/
2. Select your app
3. View real-time events and custom conversions

---

## 📱 Building the App

### Development Build
```bash
# Build for development
npx expo run:ios
npx expo run:android
```

### Production Build with EAS
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

**Important**: After changing native configurations (like Facebook SDK), you must create a new build. Hot reload won't apply these changes.

---

## 🎯 Common Facebook Pixel Events for Real Estate App

Here are recommended events to track:

```javascript
// User Registration
trackRegistration('email')

// User Login
trackCustomEvent('user_login', { method: 'email' })

// Property View
trackCustomEvent('property_viewed', {
  property_id: '123',
  property_type: 'house',
  price: 500000
})

// Document Upload
trackCustomEvent('document_uploaded', {
  document_type: 'id_verification',
  user_type: 'client'
})

// Realtor Assignment
trackCustomEvent('realtor_assigned', {
  realtor_id: 'abc123'
})

// Transaction Started
trackCustomEvent('transaction_started', {
  transaction_type: 'purchase',
  property_value: 500000
})

// Chat/Communication
trackCustomEvent('message_sent', {
  conversation_type: 'client_realtor'
})

// Appointment Scheduled
trackCustomEvent('appointment_scheduled', {
  appointment_type: 'property_viewing'
})
```

---

## 🔒 Privacy Considerations

### 1. Update Privacy Policy
Ensure your privacy policy covers Facebook data collection:
- What data is collected
- How it's used for advertising
- User's opt-out options

### 2. iOS App Tracking Transparency
For iOS 14.5+, you must request tracking permission:

```javascript
import * as Tracking from 'expo-tracking-transparency';

const requestTrackingPermission = async () => {
  const { status } = await Tracking.requestTrackingPermissionsAsync();
  if (status === 'granted') {
    console.log('Tracking permission granted');
  }
};
```

Install the package:
```bash
npm install expo-tracking-transparency
```

Add to app.json:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserTrackingUsageDescription": "This allows us to provide you with personalized content and improve your experience."
      }
    }
  }
}
```

---

## 📊 Facebook Pixel Dashboard

Access your pixel data:
- **Events Manager**: https://business.facebook.com/events_manager2/
- **Analytics**: https://business.facebook.com/analytics/
- **Ads Manager**: https://business.facebook.com/adsmanager/

---

## 🐛 Troubleshooting

### Issue: Events not appearing in Facebook
**Solution**: 
- Verify App ID is correct
- Check Test Events tool first
- Ensure app is in development mode in Facebook Console
- Wait 5-10 minutes for events to appear

### Issue: Build fails after adding Facebook SDK
**Solution**:
- Run `npx expo prebuild --clean`
- Delete `node_modules` and reinstall
- Ensure you're using EAS Build, not Expo Go

### Issue: iOS URL scheme not working
**Solution**:
- Verify `fb902644532531488` is in CFBundleURLSchemes
- Rebuild the app (clean build)
- Check Facebook app settings has correct Bundle ID

### Issue: Android Key Hash invalid
**Solution**:
- Regenerate key hash using the correct keystore
- For production, use your production keystore
- Add multiple key hashes for different build variants

---

## 📚 Additional Resources

- [Expo Facebook Documentation](https://docs.expo.dev/versions/latest/sdk/facebook/)
- [Facebook SDK for iOS](https://developers.facebook.com/docs/ios/)
- [Facebook SDK for Android](https://developers.facebook.com/docs/android/)
- [Facebook App Events Reference](https://developers.facebook.com/docs/app-events/)
- [Facebook Pixel Documentation](https://www.facebook.com/business/help/952192354843755)

---

## ✅ Next Steps

1. **Complete Facebook Developer Console Setup**
   - Add Android platform with package name and key hash
   - Add iOS platform with bundle identifier

2. **Create Facebook Tracking Utility**
   - Create `utils/FacebookTracking.js`
   - Implement event tracking functions

3. **Integrate into Your App**
   - Initialize SDK in App.js
   - Add tracking to key user flows
   - Track screen views in navigation

4. **Test Implementation**
   - Use Facebook Test Events tool
   - Verify events in Events Manager
   - Test on both iOS and Android devices

5. **Build and Deploy**
   - Create new production build
   - Submit to App Store and Play Store
   - Monitor pixel data in Facebook dashboard

---

## 🎉 You're All Set!

Your Roost app is now configured with META Pixel tracking. Make sure to complete the Facebook Developer Console setup and implement the tracking code in your app.

**Current Configuration:**
- ✅ Facebook App ID: 902644532531488
- ✅ iOS Bundle ID: com.roostapp.roost
- ✅ Android Package: com.roostapp.roost
- ✅ expo-facebook: Installed and configured

Need help? Contact your development team or refer to the Facebook Developer documentation.
