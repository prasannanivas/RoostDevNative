// SINInputModal.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Print from "expo-print";
import CloseIconSvg from "../icons/CloseIconSvg";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  blue: "#2271B1",
  red: "#A20E0E",
};

const SINInputModal = ({
  visible,
  onClose,
  clientId,
  clientName,
  onUploadSuccess,
}) => {
  const [sinNumber, setSinNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSinChange = (text) => {
    // Only allow digits, max 9
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 9) {
      setSinNumber(cleaned);
    }
  };

  const formatSinDisplay = (value) => {
    // Format as XXX-XXX-XXX
    if (value.length <= 3) return value;
    if (value.length <= 6) return `${value.slice(0, 3)}-${value.slice(3)}`;
    return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 9)}`;
  };

  const handleSubmit = async () => {
    if (sinNumber.length !== 9) {
      Alert.alert("Invalid SIN", "Please enter a valid 9-digit SIN number");
      return;
    }

    setIsLoading(true);

    try {
      // Create PDF with SIN number
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                margin: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
              }
              h1 {
                color: #377473;
                text-align: center;
                margin-bottom: 30px;
              }
              .info-row {
                margin: 20px 0;
                padding: 15px;
                background-color: #f6f6f6;
                border-radius: 8px;
              }
              .label {
                font-weight: bold;
                color: #1D2327;
                margin-bottom: 5px;
              }
              .value {
                font-size: 18px;
                color: #377473;
                letter-spacing: 2px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Social Insurance Number (SIN)</h1>
              <div class="info-row">
                <div class="label">Client Name:</div>
                <div class="value">${clientName}</div>
              </div>
              <div class="info-row">
                <div class="label">SIN Number:</div>
                <div class="value">${formatSinDisplay(sinNumber)}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      console.log("PDF created at:", uri);

      // Upload to server
      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("docType", "SIN_Number");
      formData.append("pdfFile", {
        uri: uri,
        name: `SIN_Number_${clientName.replace(/\s+/g, "_")}.pdf`,
        type: "application/pdf",
      });

      const response = await fetch(
        `https://signup.roostapp.io/documents/${clientId}/documents`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.ok) {
        Alert.alert("Success", "SIN number uploaded successfully!");
        setSinNumber("");
        onUploadSuccess?.();
        onClose();
      } else {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        Alert.alert("Upload Failed", "Please try again");
      }
    } catch (error) {
      console.error("Error uploading SIN:", error);
      Alert.alert("Error", "Failed to upload SIN number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSinNumber("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SIN Number</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CloseIconSvg size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            All lenders in Ontario require your SIN. Don't worry we keep this information super safe.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formatSinDisplay(sinNumber)}
              onChangeText={handleSinChange}
              placeholder="XXX-XXX-XXX"
              keyboardType="number-pad"
              maxLength={11} // Including dashes
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (sinNumber.length !== 9 || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={sinNumber.length !== 9 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.submitButtonText,
                  (sinNumber.length !== 9 || isLoading) &&
                    styles.buttonTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flexDirection: "column",
    alignItems: "center",
    padding: 16,
    gap: 16,
    width: 370,
    height: 255,
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
    textAlign: "center",
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4D4D4D",
    fontFamily: "Futura",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#797979",
    borderRadius: 8,
    backgroundColor: "#FDFDFD",
    padding: 8,
    fontSize: 14,
    minHeight: 45,
    fontWeight: "500",
    color: COLORS.black,
    textAlign: "center",
    letterSpacing: 2,
    fontFamily: "Futura",
    width: "100%",
  },
  submitButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "100%",
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  buttonDisabled: {
    backgroundColor: "#E8E8E8",
  },
  buttonTextDisabled: {
    color: "#797979",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  cancelButtonText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
});

export default SINInputModal;
