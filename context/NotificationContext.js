import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  registerForPushNotificationsAsync,
  registerDeviceOnServer,
  showLocalNotification,
} from "../services/NotificationService";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]); // Placeholder for notifications array
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);

  const { auth } = useAuth(); // Assuming you have a useAuth hook to get the current user
  const userId = auth?.client?.id || auth?.realtor?.id || null; // Adjust this based on your auth structure
  const userType = auth?.client ? "client" : auth?.realtor ? "realtor" : null;

  // Register for push notifications when the app is first loaded
  useEffect(() => {
    if (userId) {
      registerForNotifications();
    }

    // Set up notification listeners
    setupNotificationListeners();

    // Set up app state listener to refresh notifications when app comes to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        fetchNotifications();
      }
      appState.current = nextAppState;
    });

    return () => {
      // Clean up listeners - using subscription.remove() as per updated API
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription.remove();
    };
  }, [userId]);

  // Register for push notifications
  const registerForNotifications = async () => {
    try {
      // Check if we already have a token stored
      const storedToken = await AsyncStorage.getItem("expoPushToken");

      // Get a new token or use the stored one
      const token = storedToken || (await registerForPushNotificationsAsync());

      if (token) {
        setExpoPushToken(token);

        // Store the token for future app launches
        if (!storedToken) {
          await AsyncStorage.setItem("expoPushToken", token);
        }

        // Register the device with your backend
        if (userId) {
          await registerDeviceOnServer(userId, token, userType);
        }
      }
    } catch (error) {
      console.error("Error setting up push notifications:", error);
    }
  };

  // Set up notification listeners
  const setupNotificationListeners = () => {
    // This listener is called when a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const { title, body, data } = notification.request.content;
        console.log("Notification received in foreground:", {
          title,
          body,
          data,
        });

        // Handle chat notifications differently
        if (
          data.type === "CHAT_MESSAGE" ||
          data.notificationType === "chat_message"
        ) {
          console.log("📨 Chat message notification received:", data);
          // The ChatUnreadContext will handle updating the unread count via socket
          // No need to refresh all notifications for chat messages
        } else {
          // For other notifications, refresh the notification list
          fetchNotifications();
        }
      });

    // This listener is called when a user taps on a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { title, body, data } = response.notification.request.content;
        console.log("Notification response received:", { title, body, data });

        // Handle notification tap - navigate to relevant screen
        handleNotificationTap(data);
      });
  };

  // Handle when user taps on a notification
  const handleNotificationTap = (data) => {
    // Handle navigation or other actions based on notification data
    // This will depend on your app's navigation structure
    console.log("Handling notification tap with data:", data);

    // Example: navigate to a specific document if the notification is about a document
    if (data.type === "DOCUMENT_REQUESTED" && data.documentId) {
      // Navigate to document screen
      // navigation.navigate('Document', { id: data.documentId });
    }

    // Mark the notification as read
    if (data.notificationId) {
      markNotificationAsRead(data.notificationId);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://signup.roostapp.io/notifications?userId=${userId}`
      );

      const formattedNotifications = response.data.notifications.map(
        (notification) => ({
          id: notification._id,
          title: notification.title,
          message: notification.message,
          time: formatTimeAgo(new Date(notification.createdAt)),
          read: notification.read,
          category: notification.type,
          icon: getIconForNotificationType(notification.type),
          urgent: notification.type.includes("REQUESTED"),
          metadata: notification.metadata,
        })
      );

      setNotifications(formattedNotifications);
      setUnreadCount(response.data.pagination.unreadCount);
      updateGlobalUnreadCount(response.data.pagination.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getIconForNotificationType = (type) => {
    const iconMap = {
      DOCUMENT_APPROVED: "checkmark-circle",
      DOCUMENT_REJECTED: "close-circle",
      DOCUMENT_REQUESTED: "alert-circle",
      APPLICATION_UPDATE: "refresh-circle",
      MORTGAGE_COMPLETED: "checkmark-circle",
      PRE_APPROVED: "checkmark-circle",
      GENERAL: "notifications",
    };

    return iconMap[type] || "document-text";
  };

  // Update the global badge count (app icon badge)
  const updateGlobalUnreadCount = async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("Error updating badge count:", error);
    }
  };

  // Function to mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(
        `https://signup.roostapp.io/notifications/${notificationId}/read`,
        {}
      );
      // Decrease unread count by 1
      setUnreadCount((prev) => Math.max(0, prev - 1));
      fetchNotifications(); // Refresh notifications
      return true;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      return false;
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return false;

    try {
      await axios.put(
        `https://signup.roostapp.io/notifications/mark-all-read?userId=${userId}`
      );
      setUnreadCount(0);
      updateGlobalUnreadCount(0);
      fetchNotifications();
      return true;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      return false;
    }
  };

  // Function to send a test local notification (for development testing)
  const sendTestNotification = async () => {
    try {
      await showLocalNotification(
        "Test Notification",
        "This is a test notification from Roost",
        { type: "TEST", notificationId: "test-123" }
      );
      return true;
    } catch (error) {
      console.error("Error sending test notification:", error);
      return false;
    }
  };
  // Remove a specific notification
  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Reset when logged out
  const resetNotifications = () => {
    setUnreadCount(0);
    updateGlobalUnreadCount(0);
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading: isLoading,
        error,
        expoPushToken,
        markNotificationAsRead,
        markAllAsRead,
        resetNotifications,
        removeNotification,
        setUnreadCount,
        sendTestNotification, // Include this for testing
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
