import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNotification } from "./context/NotificationContext";
import { CloseButton } from "./components/icons";

// Warning icon SVG for orange notification
const approvedBlueSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
  <path d="M12.6961 1.08673C13.0958 0.54636 13.9042 0.54636 14.3039 1.08673L15.6823 2.94997C15.9593 3.32437 16.458 3.45801 16.8851 3.27225L19.0104 2.34783C19.6268 2.07973 20.3269 2.48391 20.4029 3.15176L20.6649 5.45455C20.7176 5.91728 21.0827 6.28239 21.5454 6.33506L23.8482 6.59714C24.5161 6.67315 24.9203 7.37321 24.6522 7.98959L23.7277 10.1149C23.542 10.542 23.6756 11.0407 24.05 11.3177L25.9133 12.6961C26.4536 13.0958 26.4536 13.9042 25.9133 14.3039L24.05 15.6823C23.6756 15.9593 23.542 16.458 23.7277 16.8851L24.6522 19.0104C24.9203 19.6268 24.5161 20.3269 23.8482 20.4029L21.5454 20.6649C21.0827 20.7176 20.7176 21.0827 20.6649 21.5454L20.4029 23.8482C20.3269 24.5161 19.6268 24.9203 19.0104 24.6522L16.8851 23.7277C16.458 23.542 15.9593 23.6756 15.6823 24.05L14.3039 25.9133C13.9042 26.4536 13.0958 26.4536 12.6961 25.9133L11.3177 24.05C11.0407 23.6756 10.542 23.542 10.1149 23.7277L7.98959 24.6522C7.37321 24.9203 6.67315 24.5161 6.59714 23.8482L6.33506 21.5454C6.28239 21.0827 5.91728 20.7176 5.45455 20.6649L3.15176 20.4029C2.48391 20.3269 2.07973 19.6268 2.34783 19.0104L3.27225 16.8851C3.45801 16.458 3.32437 15.9593 2.94997 15.6823L1.08673 14.3039C0.54636 13.9042 0.54636 13.0958 1.08673 12.6961L2.94997 11.3177C3.32437 11.0407 3.45801 10.542 3.27225 10.1149L2.34783 7.98959C2.07973 7.37321 2.48391 6.67315 3.15176 6.59714L5.45455 6.33506C5.91728 6.28239 6.28239 5.91728 6.33506 5.45455L6.59714 3.15176C6.67315 2.48391 7.37321 2.07973 7.98959 2.34783L10.1149 3.27225C10.542 3.45801 11.0407 3.32437 11.3177 2.94997L12.6961 1.08673Z" fill="#1D2327"/>
  <path d="M8 13L12 16.5L18.5 10" stroke="#FDFDFD" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// Approved icon SVG for green notification
const warningSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="29" height="25" viewBox="0 0 29 25" fill="none">
  <path d="M13.634 1.5C14.0189 0.833332 14.9811 0.833333 15.366 1.5L27.4904 22.5C27.8753 23.1667 27.3942 24 26.6244 24H2.37564C1.60584 24 1.12472 23.1667 1.50962 22.5L13.634 1.5Z" fill="#1D2327"/>
  <rect x="13.5" y="9" width="2" height="7" rx="1" fill="#FDFDFD"/>
  <rect x="13.5" y="18" width="2" height="2" rx="1" fill="#FDFDFD"/>
</svg>`;

// Approved icon SVG for blue notification
const approvedGreenSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="29" height="25" viewBox="0 0 29 25" fill="none">
  <path d="M13.634 1.5C14.0189 0.833332 14.9811 0.833333 15.366 1.5L27.4904 22.5C27.8753 23.1667 27.3942 24 26.6244 24H2.37564C1.60584 24 1.12472 23.1667 1.50962 22.5L13.634 1.5Z" fill="#1D2327"/>
  <rect x="13.5" y="9" width="2" height="7" rx="1" fill="#FDFDFD"/>
  <rect x="13.5" y="18" width="2" height="2" rx="1" fill="#FDFDFD"/>
</svg>`;

// NotificationMessage component with different variants
export const NotificationMessage = ({
  type = "warning",
  date = "01/01/2025",
  title,
  message,
  onPress,
  read = true,
}) => {
  // Choose styling and icon based on type
  let containerStyle, iconSvg;

  console.log("NotificationMessage rendered with type:", {
    type,
    date,
    title,
    message,
    read,
  });

  // Ensure type is a valid string to prevent React errors
  const notificationType = typeof type === "string" ? type : "warning";

  switch (notificationType) {
    case "success-green":
      containerStyle = styles.notificationMessageGreen;
      iconSvg = approvedBlueSvgXml;
      break;
    case "success-blue":
      containerStyle = styles.notificationMessageBlue;
      iconSvg = approvedBlueSvgXml;
      break;
    case "warning-orange":
      containerStyle = styles.notificationMessageOrange;
      iconSvg = warningSvgXml;
      break;
    case "warning-red":
      containerStyle = styles.notificationMessageRed;
      iconSvg = warningSvgXml; // Use the same warning icon for red
      break;
    default:
      containerStyle = styles.notificationMessageOrange;
      iconSvg = warningSvgXml;
      break;
  }

  return (
    <TouchableOpacity
      style={[
        styles.notificationMessageContainer,
        containerStyle,
        !read && styles.unreadNotificationMessage,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.notificationMessageIcon}>
        <SvgXml xml={iconSvg} width={21} height={21} />
      </View>
      <View style={styles.notificationMessageContent}>
        <Text style={styles.notificationMessageDate}>{date}</Text>
        <Text style={styles.notificationMessageTitle}>{title}</Text>
        <Text style={styles.notificationMessageText}>{message}</Text>
        {!read && <View style={styles.unreadDotMessage} />}
      </View>
    </TouchableOpacity>
  );
};

// NotificationItem component to render each notification
const NotificationItem = ({ notification, markNotificationAsRead }) => {
  // Handle notification press - mark as read and navigate if needed
  const handleNotificationPress = () => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    // You can add navigation logic here based on notification type
    // For example, navigate to document details if it's a document request
    if (
      notification.category === "DOCUMENT_REQUESTED" &&
      notification.metadata?.documentRequestId
    ) {
      console.log(
        "Navigate to document request:",
        notification.metadata.documentRequestId
      );
      // Navigate to document screen with documentRequestId
    }
  };

  // Determine notification type based on the notification data
  let notificationType = "warning";
  if (
    notification.category === "DOCUMENT_REJECTED" ||
    notification.category === ""
  ) {
    notificationType = "warning-red";
  } else if (
    notification.category === "DOCUMENT_REQUESTED" ||
    notification.category === "POINTS_DEDUCTED"
  ) {
    notificationType = "warning-orange";
  } else if (
    notification.category === "DOCUMENT_SUBMITTED" ||
    notification.category === "NEW_CLIENT" ||
    notification.category === "POINTS_AWARDED" ||
    notification.category === "REWARD_APPROVED"
  ) {
    notificationType = "success-green";
  } else if (notification.category === "DOCUMENT_APPROVED") {
    notificationType = "success-blue";
  } else if (notification.category === "MORTGAGE_COMPLETED") {
    notificationType = "success-blue";
  } else if (notification.category === "PRE_APPROVED") {
    notificationType = "success-blue";
  } else if (notification.category === "FULLY_APPROVED") {
    notificationType = "success-green";
  }

  return (
    <>
      {notification.category === "DOCUMENT_SUBMITTED" ? null : (
        <NotificationMessage
          key={
            notificationType +
            notification.time +
            notification.title +
            notification.message
          }
          type={notificationType}
          date={notification.time} // Using the time field from the new format
          title={notification.title}
          message={notification.message}
          onPress={handleNotificationPress}
          read={notification.read}
        />
      )}
    </>
  );
};

const NotificationComponent = ({ visible, onClose, userId }) => {
  const {
    notifications,
    loading,
    error,
    markNotificationAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications,
  } = useNotification();

  console.log("Notificatioons", notifications);

  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Mark notification as read - update both locally and on the server
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    console.log("Closing notifications");
    markAllAsRead();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!visible) {
    return null;
  }

  return (
    <BlurView
      intensity={Platform.OS === "ios" ? 20 : 25}
      tint="dark"
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 100 },
        styles.notificationsBlurView,
      ]}
    >
      <Animated.View
        style={[
          styles.notificationsContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View style={styles.notificationsHeader}>
          <Text style={styles.notificationsTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleClose}>
            <CloseButton onPress={handleClose} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#019B8E" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load notifications</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={refreshNotifications}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                markNotificationAsRead={markNotificationAsRead}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
        </ScrollView>
        <TouchableOpacity
          style={styles.bottomCloseButton}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text style={styles.bottomCloseButtonText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  notificationsBlurView: {
    justifyContent: "center",
    alignItems: "center",
  },
  notificationsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginTop: 60,
    width: "100%",
    height: "100%",
    paddingBottom: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#23231A",
  },
  notificationsList: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#FF4D4F",
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#019B8E",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
  },
  notificationMessageContainer: {
    flexDirection: "row",
    minHeight: 105,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
    position: "relative",
  },
  notificationMessageOrange: {
    backgroundColor: "#F0913A1A",
  },
  notificationMessageRed: {
    backgroundColor: "#F24E1A1A",
  },
  notificationMessageGreen: {
    backgroundColor: "#3774731A",
  },
  notificationMessageBlue: {
    backgroundColor: "#2271B11A",
  },
  unreadNotificationMessage: {
    transform: [{ scale: 1.05 }],
  },
  notificationMessageContent: {
    flex: 1,
    padding: 16,
    position: "relative",
  },
  notificationMessageDate: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  notificationMessageTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#23231A",
    marginBottom: 4,
  },
  notificationMessageText: {
    fontSize: 14,
    color: "#23231A",
  },
  notificationMessageIcon: {
    width: 50,
    //height: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  unreadDotMessage: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#019B8E",
    position: "absolute",
    top: 16,
    right: 0,
  },
  bottomCloseButton: {
    position: "absolute",
    bottom: 63,
    alignSelf: "center",
    backgroundColor: "#2271B1",
    width: 82,
    paddingTop: 13,
    paddingRight: 24,
    paddingBottom: 13,
    paddingLeft: 24,
    borderRadius: 33,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomCloseButtonText: {
    color: "#FBFBFB",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Futura",
    textAlign: "center",
  },
});

export default NotificationComponent;
