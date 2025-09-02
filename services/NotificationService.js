import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import axios from "axios";

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show notification as an alert
    shouldPlaySound: true, // Play sound with notification
    shouldSetBadge: true, // Update app badge count
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  // Check if device is a physical device (not an emulator/simulator)
  if (Device.isDevice) {
    // Check if we have permission to send notifications
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If we don't have permission, request it
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission is not granted, return null
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    // Get the Expo push token
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
      console.log("Push token:", token);
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  } else {
    console.log("Must use physical device for push notifications");
  }

  // For Android, set notification channel
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#019B8E",
    });
  }

  return token;
}

// Send the device token to your server
export async function registerDeviceOnServer(
  userId,
  token,
  userType = "client"
) {
  try {
    const response = await axios.post(
      "https://signup.roostapp.io/notifications/register-device",
      {
        userId,
        token,
        userType, // 'client' or 'realtor'
        platform: Platform.OS,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error registering device:", error);
    throw error;
  }
}

// Show a local notification immediately
export async function showLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Immediately
  });
}

// Schedule a local notification for later
export async function scheduleLocalNotification(
  title,
  body,
  seconds,
  data = {}
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: {
      seconds,
    },
  });
}

// Get all scheduled notifications
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel specific notification
export async function cancelScheduledNotification(identifier) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}
