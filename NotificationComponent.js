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
const warningSvgXml = `
<svg width="62" height="63" viewBox="0 0 62 63" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect x="16" y="16.5" width="30" height="30" fill="url(#pattern0_500_8083)"/>
<circle cx="41" cy="21.5" r="5" fill="#F0913A"/>
<defs>
<pattern id="pattern0_500_8083" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_500_8083" transform="scale(0.0333333)"/>
</pattern>
<image id="image0_500_8083" width="30" height="30" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABQklEQVR4nO2Vu0oDQRiFP0QRBLGwtBRsBBsrC2u10ELxAfQJ7M0TpNY38Am0s7C3sDBCgprGFRWFFBoLjWJk4B8Yktm5mJ0QJAdOs/+Z8+1lhoWhBlwbwKN4vV/QaaABtMUNuZZchwZU+yA1dB74soC/gYWU4FMLVPssFXTLAdXeLBo6DtwGgO+AiSLBpQCo9n5R0Bmg2VFeB7bF9Y7Zu6zpWUeWp7o05hXLXK3pSUvAj6X42sjcWOZqzfJfoSPAuWMTaWU5mQvpiNauYwM9G7kXR24nFjopP4C8wlcj++a5wakYcNlzZFrAorjlyaquIM0CHxHn1udPYC4EfBxY+CQOyZ74oCuBReocjwJjwFXgmtU8qCqpBpZUJB8Drkm+S3uR3y7mVbfFitEl1/Epyg828H0fwJkNvJYYnrk22FD/T7//yEweBhd1sgAAAABJRU5ErkJggg=="/>
</defs>
</svg>`;

// Approved icon SVG for green notification
const approvedGreenSvgXml = `
<svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect x="16" y="16" width="30" height="30" fill="url(#pattern0_500_8086)"/>
<circle cx="41" cy="21" r="5" fill="#F0913A"/>
<defs>
<pattern id="pattern0_500_8086" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_500_8086" transform="scale(0.0333333)"/>
</pattern>
<image id="image0_500_8086" width="30" height="30" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABdUlEQVR4nO2WwUrDQBCGPyyeerc9CA147cU2IIrgKwgetfVVfI1WfQ+bJ2g9a3sQPDbVs9B6iixMYSnZzWY3AQ/9YQ67mewHk5k/C3u5qQMsgDkQUZNiYAA0Zd0AEiCTSGQPyVG5/VBoG/gVQAo8AzMNug219yQ5ar0BWiHgixyIa6h3vTUMAKuSly7vGXAPrALAKzkjdil7rH3TKmMD9GzgQQ3QbdzZwGocljVAU20cjXr0PPxL5vcy59m4CKqM4NUT2tX6JG/OGyZotONIPtCurPPyEpO9LiyH3wDXwI8nNJN4zwPPLS+cSM6VBi8LzUzgjqXUH8CxBv/0gE6EYWyumQP8sCR0amsul3HS4a5QFaMiqIuBqDI/AN8lOn9ZZCB1WuatDdwXQ68augZOi8rdEvcZBv4WU6mgOuuI/3wRqOrqc06A2to3T2UspoY5HWmXvbVPeXfVk47Ur7cTDfoCHMizpvzwCxvJV5F4+5vNBvdC0x8IKqDqCCnz5gAAAABJRU5ErkJggg=="/>
</defs>
</svg>`;

// Approved icon SVG for blue notification
const approvedBlueSvgXml = `
<svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect x="16" y="16" width="30" height="30" fill="url(#pattern0_500_8088)"/>
<defs>
<pattern id="pattern0_500_8088" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_500_8088" transform="scale(0.0333333)"/>
</pattern>
<image id="image0_500_8088" width="30" height="30" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABdUlEQVR4nO2WwUrDQBCGPyyeerc9CA147cU2IIrgKwgetfVVfI1WfQ+bJ2g9a3sQPDbVs9B6iixMYSnZzWY3AQ/9YQ67mewHk5k/C3u5qQMsgDkQUZNiYAA0Zd0AEiCTSGQPyVG5/VBoG/gVQAo8AzMNug219yQ5ar0BWiHgixyIa6h3vTUMAKuSly7vGXAPrALAKzkjdil7rH3TKmMD9GzgQQ3QbdzZwGocljVAU20cjXr0PPxL5vcy59m4CKqM4NUT2tX6JG/OGyZotONIPtCurPPyEpO9LiyH3wDXwI8nNJN4zwPPLS+cSM6VBi8LzUzgjqXUH8CxBv/0gE6EYWyumQP8sCR0amsul3HS4a5QFaMiqIuBqDI/AN8lOn9ZZCB1WuatDdwXQ68augZOi8rdEvcZBv4WU6mgOuuI/3wRqOrqc06A2to3T2UspoY5HWmXvbVPeXfVk47Ur7cTDfoCHMizpvzwCxvJV5F4+5vNBvdC0x8IKqDqCCnz5gAAAABJRU5ErkJggg=="/>
</defs>
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
      iconSvg = approvedGreenSvgXml;
      break;
    case "success-blue":
      containerStyle = styles.notificationMessageBlue;
      iconSvg = approvedBlueSvgXml;
      break;
    case "warning":
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
        <SvgXml xml={iconSvg} width={42} height={42} />
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
  if (notification.category === "DOCUMENT_REJECTED") {
    notificationType = "warning";
  } else if (notification.category === "DOCUMENT_REQUESTED") {
    notificationType = "success-green";
  } else if (notification.category === "DOCUMENT_APPROVED") {
    notificationType = "success-blue";
  }

  return (
    <NotificationMessage
      type={notificationType}
      date={notification.time} // Using the time field from the new format
      title={notification.title}
      message={notification.message}
      onPress={handleNotificationPress}
      read={notification.read}
    />
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  notificationsBlurView: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  notificationsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight || 60,
    width: SCREEN_WIDTH,
    maxHeight: SCREEN_HEIGHT,
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
  notificationMessageGreen: {
    backgroundColor: "#3774731A",
  },
  notificationMessageBlue: {
    backgroundColor: "#2271B11A",
  },
  unreadNotificationMessage: {
    backgroundColor: "rgba(1,155,142,0.04)",
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
    width: 54,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
