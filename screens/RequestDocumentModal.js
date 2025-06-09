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

const RequestDocumentModal = ({ isOpen, onClose, onSubmit }) => {
  const [docType, setDocType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    onSubmit({ docType, description });
    setDocType("");
    setDescription("");
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Request Document</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Document Type:</Text>
            <TextInput
              style={styles.input}
              value={docType}
              onChangeText={setDocType}
              placeholder="Enter document type"
              placeholderTextColor="#999"
              autoCapitalize="none"
              required
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Description (optional):</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add additional details..."
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={3}
            />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Request Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 24,
    textAlign: "center",
    color: COLORS.black,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Futura",
    fontWeight: "medium",
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.silver,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontFamily: "Futura",
    color: COLORS.black,
    height: 48,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
    height: 48,
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
  },
  submitButton: {
    backgroundColor: COLORS.green,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
});

export default RequestDocumentModal;
