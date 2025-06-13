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
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNotification } from "./context/NotificationContext";

const NotificationComponent = ({ visible, onClose }) => {
  const {
    notifications,
    loading,
    error,
    markNotificationAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications,
  } = useNotification();

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

  const NotificationItem = ({ notification }) => {
    const itemSlide = useRef(new Animated.Value(0)).current;
    const itemOpacity = useRef(new Animated.Value(1)).current;
    const itemScale = useRef(new Animated.Value(1)).current;

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx }) => {
        itemSlide.setValue(dx);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (Math.abs(dx) > 80 || Math.abs(vx) > 0.5) {
          Animated.parallel([
            Animated.timing(itemSlide, {
              toValue: dx > 0 ? 400 : -400,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(itemOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(itemScale, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            removeNotification(notification.id);
          });
        } else {
          Animated.spring(itemSlide, {
            toValue: 0,
            tension: 40,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    });

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.notificationItem,
          {
            transform: [{ translateX: itemSlide }, { scale: itemScale }],
            opacity: itemOpacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => markNotificationAsRead(notification.id)}
          style={[
            styles.notificationContent,
            !notification.read && styles.unreadNotification,
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.notificationHeader}>
            <View
              style={[
                styles.iconContainer,
                notification.urgent && styles.urgentIconContainer,
              ]}
            >
              <Ionicons
                name={notification.icon}
                size={22}
                color={notification.urgent ? "#FFFFFF" : "#019B8E"}
              />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.notificationTime}>{notification.time}</Text>
              {!notification.read && (
                <Animated.View style={[styles.unreadDot]} />
              )}
            </View>
          </View>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <BlurView intensity={10} style={styles.overlay}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          style={styles.overlayTouch}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Dimensions.get("window").height, 0],
                    }),
                  },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.contentContainer}
            >
              <View style={styles.header}>
                <Text style={styles.headerText}>
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <View style={styles.closeButtonInner}>
                    <Ionicons name="close" size={20} color="#666666" />
                  </View>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.notificationsList}
                showsVerticalScrollIndicator={false}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#019B8E" />
                    <Text style={styles.loadingText}>
                      Loading notifications...
                    </Text>
                  </View>
                ) : error ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIconContainer}>
                      <Ionicons name="alert-circle" size={40} color="#DC3545" />
                    </View>
                    <Text style={styles.emptyStateText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={refreshNotifications}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIconContainer}>
                      <Ionicons
                        name="notifications-off"
                        size={40}
                        color="#CCCCCC"
                      />
                    </View>
                    <Text style={styles.emptyStateText}>
                      No notifications yet
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      We'll notify you when something important happens
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Blue Pill Close Button at Bottom */}
              <TouchableOpacity
                style={styles.bottomCloseButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.bottomCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  overlayTouch: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    paddingTop: 63,
    position: "relative",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#23231A",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 63 + 20,
  },
  closeButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  notificationContent: {
    padding: 16,
    paddingVertical: 20,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(1,155,142,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  urgentIconContainer: {
    backgroundColor: "#DC3545",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadNotification: {
    backgroundColor: "rgba(1,155,142,0.04)",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999999",
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#019B8E",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666666",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#019B8E",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomCloseButton: {
    position: "absolute",
    bottom: 63,
    alignSelf: "center",
    backgroundColor: "#2271B1",
    width: 82,
    height: 42,
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default NotificationComponent;
