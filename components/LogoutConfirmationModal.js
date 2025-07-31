import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

// Pass COLORS as a prop for theme consistency
const LogoutConfirmationModal = ({ visible, onConfirm, onCancel, COLORS }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <View
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
              onPress={onConfirm}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: "700",

                  fontSize: 12,
                  fontFamily: "Futura",
                }}
              >
                Log Out
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.white,
                paddingVertical: 12,
                borderRadius: 33,
                borderWidth: 1,
                marginLeft: 8,
                alignItems: "center",
              }}
              onPress={onCancel}
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
        </View>
      </View>
    </Modal>
  );
};

export default LogoutConfirmationModal;
