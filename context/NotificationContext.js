import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]); // Placeholder for notifications array
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { auth } = useAuth(); // Assuming you have a useAuth hook to get the current user
  console.log("Auth in NotificationProvider:", auth);
  const userId = auth?.client?.id || auth?.realtor?.id || null; // Adjust this based on your auth structure

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://54.89.183.155:5000/notifications?userId=${userId}`
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
      GENERAL: "notifications",
    };

    return iconMap[type] || "document-text";
  };
  // Function to mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(
        `http://54.89.183.155:5000/notifications/${notificationId}/read`,
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
        `http://54.89.183.155:5000/notifications/mark-all-read?userId=${userId}`
      );
      setUnreadCount(0);
      fetchNotifications();
      return true;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      return false;
    }
  };

  // Reset when logged out
  const resetNotifications = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        isLoading,
        markNotificationAsRead,
        markAllAsRead,
        resetNotifications,
        setUnreadCount, // Expose setUnreadCount to allow direct updates
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
