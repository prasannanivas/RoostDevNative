# META Pixel Setup - Quick Checklist ✅

## 🎯 What We've Done

✅ **Installed expo-facebook package**
✅ **Configured app.json** with Facebook SDK settings
✅ **Created FacebookTracking.js** utility with all tracking functions
✅ **Provided code examples** for integration

---

## 🚀 What You Need to Do Next

### STEP 1: Complete Facebook Developer Console Setup

#### 🔗 Facebook App Dashboard
Visit: https://developers.facebook.com/apps/902644532531488

#### For Android:
1. Click **"Add Platform"** → Select **"Android"**
2. Enter these details:
   - **Package Name**: `com.roostapp.roost`
   - **Default Activity Class Name**: `com.roostapp.roost.MainActivity`
   - **Key Hash**: Generate using command below

**Generate Android Key Hash (Run in PowerShell/Terminal):**
```bash
# Windows PowerShell:
keytool -exportcert -alias androiddebugkey -keystore "%USERPROFILE%\.android\debug.keystore" | openssl sha1 -binary | openssl base64

# Mac/Linux:
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
```
*Password: `android`*

3. Click **"Save Changes"**

#### For iOS:
1. Click **"Add Platform"** → Select **"iOS"**
2. Enter these details:
   - **Bundle ID**: `com.roostapp.roost`
   - **iPhone Store ID**: (Add after app is live on App Store)

3. Click **"Save Changes"**

---

### STEP 2: Integrate Tracking Code in Your App

#### A. Initialize in App.js

Add these lines to your [App.js](d:\Roost Full Stack\RoostDevNative\App.js):

```javascript
// At the top with other imports
import { initializeFacebook, trackAppOpen } from "./utils/FacebookTracking";

// Inside your App component, add this useEffect:
useEffect(() => {
  const initializeFacebookSDK = async () => {
    try {
      const initialized = await initializeFacebook();
      if (initialized) {
        await trackAppOpen();
      }
    } catch (error) {
      console.error('Facebook SDK error:', error);
    }
  };
  
  initializeFacebookSDK();
}, []);
```

See full example: [App.js.FACEBOOK_INTEGRATION_EXAMPLE.js](d:\Roost Full Stack\RoostDevNative\App.js.FACEBOOK_INTEGRATION_EXAMPLE.js)

#### B. Track Screen Views

Add to any screen component:

```javascript
import { trackScreenView } from '../utils/FacebookTracking';
import { useFocusEffect } from '@react-navigation/native';

// Inside your component:
useFocusEffect(
  React.useCallback(() => {
    trackScreenView('Screen_Name_Here');
  }, [])
);
```

#### C. Track User Actions

```javascript
import { trackRegistration, trackLogin, setUserId } from '../utils/FacebookTracking';

// After successful signup:
await trackRegistration('email');
await setUserId(userId);

// After successful login:
await trackLogin('email');
await setUserId(userId);

// After document upload:
await trackDocumentUpload('mortgage', 'client');
```

See more examples: [FACEBOOK_TRACKING_EXAMPLES.js](d:\Roost Full Stack\RoostDevNative\FACEBOOK_TRACKING_EXAMPLES.js)

---

### STEP 3: Build Your App

**IMPORTANT**: You must create a new build after adding Facebook SDK. Expo Go won't work!

```bash
# For iOS:
eas build --platform ios

# For Android:
eas build --platform android

# Or for both:
eas build --platform all
```

---

### STEP 4: Test Your Implementation

#### A. Use Facebook Test Events Tool

1. Visit: https://developers.facebook.com/apps/902644532531488/test-events/
2. Run your app on a device
3. Perform actions (open app, navigate, etc.)
4. Check if events appear in Test Events dashboard

#### B. Check Events Manager

1. Visit: https://business.facebook.com/events_manager2/
2. Select your Roost App
3. View real-time events

---

## 📱 Current Configuration

```
✅ Facebook App ID: 902644532531488
✅ Display Name: Roost App
✅ iOS Bundle ID: com.roostapp.roost
✅ Android Package: com.roostapp.roost
✅ URL Scheme: fb902644532531488
```

---

## 🎯 Recommended Events to Track

### High Priority (Implement First):
- ✅ App Open (Already configured in setup)
- 📱 Screen Views (Add to all major screens)
- 👤 User Registration
- 🔐 User Login
- 📄 Document Upload
- 💬 Message Sent
- 📅 Appointment Scheduled

### Medium Priority:
- 🏠 Property View
- 👔 Realtor Assignment
- 💰 Pre-Approval Request
- 📋 Questionnaire Completed
- ✍️ Profile Completion

### Optional:
- 🎁 Reward Earned
- 🔍 Search
- 📤 Document Share
- ⭐ Rating/Review

---

## 📚 Files Created

1. **[META_PIXEL_IMPLEMENTATION_GUIDE.md](d:\Roost Full Stack\RoostDevNative\META_PIXEL_IMPLEMENTATION_GUIDE.md)**
   - Complete implementation guide
   - Detailed setup instructions
   - Troubleshooting tips

2. **[utils/FacebookTracking.js](d:\Roost Full Stack\RoostDevNative\utils\FacebookTracking.js)**
   - Ready-to-use tracking functions
   - All standard Facebook events
   - Custom events for Roost app

3. **[FACEBOOK_TRACKING_EXAMPLES.js](d:\Roost Full Stack\RoostDevNative\FACEBOOK_TRACKING_EXAMPLES.js)**
   - Real-world code examples
   - Integration patterns
   - Best practices

4. **[App.js.FACEBOOK_INTEGRATION_EXAMPLE.js](d:\Roost Full Stack\RoostDevNative\App.js.FACEBOOK_INTEGRATION_EXAMPLE.js)**
   - App.js integration example
   - Shows exact changes needed

---

## ⚠️ Important Reminders

1. **Build Required**: You MUST create a new build. Expo Go doesn't support Facebook SDK
2. **Test First**: Use Facebook Test Events before going live
3. **Key Hash**: Must generate BOTH debug and production key hashes for Android
4. **Privacy**: Update your privacy policy to mention Facebook data collection
5. **iOS Tracking**: Request tracking permission on iOS 14.5+ for better results

---

## 🆘 Need Help?

- **Facebook Documentation**: https://developers.facebook.com/docs/
- **Expo Facebook Docs**: https://docs.expo.dev/versions/latest/sdk/facebook/
- **Support**: https://stackoverflow.com/questions/tagged/facebook-sdk

---

## ✅ Final Checklist

Before submitting to app stores:

- [ ] Facebook Developer Console fully configured (iOS + Android)
- [ ] Added key hashes to Facebook Console
- [ ] Integrated tracking code in App.js
- [ ] Added screen view tracking to major screens
- [ ] Added event tracking for key user actions
- [ ] Built new production version
- [ ] Tested events in Facebook Test Events tool
- [ ] Verified events appear in Events Manager
- [ ] Updated privacy policy
- [ ] Tested on both iOS and Android devices

---

**You're all set! 🎉**

Once you complete the Facebook Developer Console setup and integrate the tracking code, META Pixel will be fully functional in your Roost app.
