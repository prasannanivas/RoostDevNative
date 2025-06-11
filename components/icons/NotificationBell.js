import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NotificationBell = ({
  size = 24,
  bellColor = "#FFFFFF",
  badgeColor = "#F0913A",
  showBadge = true,
  badgeCount,
  style,
  onPress,
  variant = "outline", // 'outline' or 'filled'
}) => {
  const iconName =
    variant === "filled" ? "notifications" : "notifications-outline";

  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name={iconName}
        size={size}
        color={bellColor}
        onPress={onPress}
      />

      {showBadge && (
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColor },
            badgeCount && badgeCount > 9
              ? styles.badgeWide
              : styles.badgeNormal,
          ]}
        >
          {badgeCount && (
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? "99+" : badgeCount.toString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeNormal: {
    minWidth: 16,
  },
  badgeWide: {
    minWidth: 20,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Futura",
    textAlign: "center",
    lineHeight: 12,
  },
});

export default NotificationBell;
