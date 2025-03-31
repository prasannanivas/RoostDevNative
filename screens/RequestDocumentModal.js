import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#23231A",
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#23231A",
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#999",
  },
  submitButton: {
    backgroundColor: "#019B8E",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RequestDocumentModal;
