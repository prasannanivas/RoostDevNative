import React, { useState, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = {
  ALL: "All",
  UNREAD: "Unread",
  DOCUMENTS: "Documents",
  UPDATES: "Updates",
};

const mockNotifications = [
  {
    id: 1,
    title: "Document Approved",
    message: "Your T4 document has been approved",
    time: "2h ago",
    read: false,
    category: "DOCUMENTS",
    icon: "document-text",
  },
  {
    id: 2,
    title: "Action Required",
    message: "Please upload your Notice of Assessment",
    time: "1d ago",
    read: true,
    category: "DOCUMENTS",
    icon: "alert-circle",
    urgent: true,
  },
  {
    id: 3,
    title: "Application Update",
    message: "Your mortgage application is being reviewed",
    time: "2d ago",
    read: true,
    category: "UPDATES",
    icon: "refresh-circle",
  },
];

const NotificationComponent = ({ visible, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.ALL);
  const [notifications, setNotifications] = useState(mockNotifications);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedCategory === CATEGORIES.ALL) return true;
    if (selectedCategory === CATEGORIES.UNREAD) return !notification.read;
    return notification.category === selectedCategory;
  });

  const NotificationItem = ({ notification }) => {
    const itemSlide = useRef(new Animated.Value(0)).current;
    const itemOpacity = useRef(new Animated.Value(1)).current;

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx }) => {
        itemSlide.setValue(dx);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) > 100) {
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
          ]).start(() => {
            setNotifications(
              notifications.filter((n) => n.id !== notification.id)
            );
          });
        } else {
          Animated.spring(itemSlide, {
            toValue: 0,
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
            transform: [{ translateX: itemSlide }],
            opacity: itemOpacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleMarkAsRead(notification.id)}
          style={[
            styles.notificationContent,
            !notification.read && styles.unreadNotification,
          ]}
        >
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={notification.icon}
                size={24}
                color={notification.urgent ? "#DC3545" : "#019B8E"}
              />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.notificationTime}>{notification.time}</Text>
              {!notification.read && <View style={styles.unreadDot} />}
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
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
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
                    outputRange: [-300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>Notifications</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {Object.values(CATEGORIES).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryPill,
                    selectedCategory === category && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category &&
                        styles.selectedCategoryText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.notificationsList}>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="notifications-off"
                    size={48}
                    color="#CCCCCC"
                  />
                  <Text style={styles.emptyStateText}>No notifications</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  overlayTouch: {
    flex: 1,
  },
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 + StatusBar.currentHeight : 60,
    right: 10,
    width: Dimensions.get("window").width * 0.9,
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#23231A",
  },
  closeButton: {
    padding: 4,
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: "#019B8E",
  },
  categoryText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
  },
  notificationsList: {
    maxHeight: Dimensions.get("window").height * 0.6,
  },
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadNotification: {
    backgroundColor: "#F8F9FA",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
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
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
});

export default NotificationComponent;
