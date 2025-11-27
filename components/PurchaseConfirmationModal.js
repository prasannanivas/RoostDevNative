import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";

const PurchaseConfirmationModal = ({
  client,
  onClose,
  onViewDetails,
  onPurchased,
  visible = true,
}) => {
  const slideAnim = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 1000,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        onClose();
      }, 50);
    });
  };

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
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
          <Circle cx="18.5" cy="18.5" r="18.5" fill="#ffffff" />
          <Path
            d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
            fill="#A9A9A9"
          />
        </Svg>
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
            from your computer you can send the documents to
            files@inbound.roostapp.io
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
