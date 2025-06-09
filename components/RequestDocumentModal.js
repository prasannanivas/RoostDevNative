import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#23231A",
  gray: "#666666",
  lightGray: "#999999",
  silver: "#CCC",
  white: "#FFFFFF",
  background: "#F6F6F6",
  error: "#FF3B30",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const RequestDocumentModal = ({ visible, onClose, onSubmit }) => {
  const [docType, setDocType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    onSubmit({ docType, description });
    setDocType("");
    setDescription("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Request Document</Text>

          <TextInput
            style={styles.input}
            placeholder="Document Type"
            value={docType}
            onChangeText={setDocType}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 8,
    width: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 24,
    textAlign: "center",
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.silver,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    height: 48,
    fontSize: 14,
    fontFamily: "Futura",
    color: COLORS.black,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    height: 48,
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    height: 48,
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "Futura",
  },
});

export default RequestDocumentModal;
