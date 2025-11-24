import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PurchaseConfirmationModal = ({
  client,
  onClose,
  onViewDetails,
  onPurchased,
}) => {
  const slideAnim = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <Animated.View
      style={[
        styles.modalContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <View style={styles.closeButtonCircle}>
          <Ionicons name="close" size={24} color="#797979" />
        </View>
      </TouchableOpacity>

      {/* Header Container */}
      <View style={styles.headerContainer}>
        <View style={styles.initialsCircle}>
          <Text style={styles.initialsText}>
            {getInitials(client?.referenceName)}
          </Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.clientName}>{client?.referenceName}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* View Details Button */}
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={onViewDetails}
        >
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
        </TouchableOpacity>

        {/* They Have Purchased Button */}
        <TouchableOpacity style={styles.purchasedButton} onPress={onPurchased}>
          <Text style={styles.purchasedButtonText}>They have purchased!</Text>
        </TouchableOpacity>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.subtitle}>
            These documents are needed to complete the mortgage process
          </Text>

          {/* Document List */}
          <View style={styles.documentList}>
            <Text style={styles.documentItem}>
              Agreement of Purchase and Sale
            </Text>
            <Text style={styles.documentItem}>MLS Data Sheet</Text>
            <Text style={styles.documentItem}>Receipt of Funds</Text>
          </View>

          <Text style={styles.footerInfo}>
            from your computer you can send the documents to files@roostapp.io
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flexDirection: "column",
    alignItems: "center",
    padding: 16,
    gap: 16,
    width: 370,
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
    position: "relative",
    marginBottom: 48,
  },
  closeButton: {
    position: "absolute",
    width: 42,
    height: 42,
    right: 10,
    top: 10,
    zIndex: 2,
  },
  closeButtonCircle: {
    width: 42,
    height: 42,
    backgroundColor: "#F4F4F4",
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    gap: 16,
    width: 338,
    height: 49,
    alignSelf: "stretch",
    zIndex: 0,
  },
  initialsCircle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    width: 49,
    height: 49,
    backgroundColor: "#4D4D4D",
    borderRadius: 45,
  },
  initialsText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 27,
    textAlign: "center",
    color: "#FDFDFD",
  },
  nameContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 0,
    gap: 8,
    flex: 1,
    height: 21,
  },
  clientName: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 21,
    color: "#1D2327",
    alignSelf: "stretch",
  },
  content: {
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    gap: 16,
    width: 338,
    alignSelf: "stretch",
    zIndex: 1,
  },
  viewDetailsButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 24,
    width: 338,
    height: 43,
    backgroundColor: "#FDFDFD",
    borderWidth: 1,
    borderColor: "#377473",
    borderRadius: 999,
    alignSelf: "stretch",
  },
  viewDetailsButtonText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
    color: "#377473",
  },
  purchasedButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 24,
    width: 338,
    height: 43,
    backgroundColor: "#377473",
    borderRadius: 999,
    alignSelf: "stretch",
  },
  purchasedButtonText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
    color: "#FDFDFD",
  },
  detailsSection: {
    flexDirection: "column",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 8,
    gap: 16,
    width: 338,
    backgroundColor: "rgba(55, 116, 115, 0.1)",
    borderRadius: 8,
    alignSelf: "stretch",
  },
  subtitle: {
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: "#707070",
    alignSelf: "stretch",
  },
  documentList: {
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    gap: 8,
  },
  documentItem: {
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    color: "#1D2327",
  },
  footerInfo: {
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: "#707070",
    width: 280,
  },
});

export default PurchaseConfirmationModal;
