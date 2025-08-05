import React, { useRef, useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Animated } from "react-native";

// Pass COLORS as a prop for theme consistency
const LogoutConfirmationModal = ({ visible, onConfirm, onCancel, COLORS }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      // Start animations when modal becomes visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out animations when modal is to be hidden
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After fade out animation is complete, hide the modal
        setModalVisible(false);
      });
    }
  }, [visible, fadeAnim, slideAnim]);

  // Custom handlers for cancel and confirm to include animation
  const handleCancel = () => {
    // Run the animations before actually closing the modal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call the original onCancel after animation completes
      onCancel();
    });
  };

  const handleConfirm = () => {
    // Run the animations before actually confirming logout
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call the original onConfirm after animation completes
      onConfirm();
    });
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: fadeAnim,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: COLORS.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
            paddingBottom: 32,
            alignItems: "center",
            minHeight: 180,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              fontFamily: "Futura",
              marginBottom: 24,
              color: COLORS.black,
            }}
          >
            Are you sure you want to log out?
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.green,
                paddingVertical: 12,
                borderRadius: 33,
                marginRight: 8,
                alignItems: "center",
              }}
              onPress={handleConfirm}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: "700",

                  fontSize: 12,
                  fontFamily: "Futura",
                }}
              >
                Logout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.white,
                borderColor: COLORS.green,
                paddingVertical: 12,
                borderRadius: 33,
                borderWidth: 2,
                marginLeft: 8,
                alignItems: "center",
              }}
              onPress={handleCancel}
            >
              <Text
                style={{
                  color: COLORS.green,
                  fontWeight: "700",
                  fontFamily: "Futura",
                  fontSize: 12,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default LogoutConfirmationModal;
