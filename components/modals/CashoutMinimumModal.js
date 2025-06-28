import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import Svg, { Path } from "react-native-svg";

const CashoutMinimumModal = ({ visible, minPoints, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>
              <Svg
                width="25"
                height="25"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <Path
                  d="M12.5 0C5.59687 0 0 5.59625 0 12.5C0 19.4037 5.59625 25 12.5 25C19.4037 25 25 19.4037 25 12.5C25 5.59625 19.4037 0 12.5 0ZM12.5 23.4625C6.46875 23.4625 1.5625 18.5312 1.5625 12.5C1.5625 6.46875 6.46875 1.5625 12.5 1.5625C18.5312 1.5625 23.4375 6.46875 23.4375 12.5C23.4375 18.5312 18.5312 23.4625 12.5 23.4625ZM16.9194 8.08125C16.6147 7.77656 16.12 7.77656 15.8147 8.08125L12.5006 11.3953L9.18656 8.08125C8.88187 7.77656 8.38656 7.77656 8.08125 8.08125C7.77594 8.38594 7.77656 8.88125 8.08125 9.18594L11.3953 12.5L8.08125 15.8141C7.77656 16.1187 7.77656 16.6141 8.08125 16.9188C8.38594 17.2234 8.88125 17.2234 9.18656 16.9188L12.5006 13.6047L15.8147 16.9188C16.1194 17.2234 16.6141 17.2234 16.9194 16.9188C17.2247 16.6141 17.2241 16.1187 16.9194 15.8141L13.6053 12.5L16.9194 9.18594C17.225 8.88062 17.225 8.38594 16.9194 8.08125Z"
                  fill="#A9A9A9"
                />
              </Svg>
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Cashout</Text>
          <Text style={styles.description}>
            The minimum amount of points to cash out is {minPoints}, you’re not
            quite there yet.
          </Text>
          <TouchableOpacity style={styles.gotchaButton} onPress={onClose}>
            <Text style={styles.gotchaButtonText}>Gotcha</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
    padding: 32,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDFDFD",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#888",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura",
    color: "#1D2327",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    color: "#707070",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  gotchaButton: {
    backgroundColor: "#377473",
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    minWidth: 95,
  },
  gotchaButtonText: {
    color: "#FDFDFD",
    fontWeight: "700",
    fontSize: 12,
  },
});

export default CashoutMinimumModal;
