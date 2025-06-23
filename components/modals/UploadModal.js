// UploadModal.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { Linking } from "react-native";
import CloseIconSvg from "../icons/CloseIconSvg";
import BackButton from "../icons/BackButton";

/**
 * Color palette from UX team design system
 */
const COLORS = {
  // Core colors
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070", // dark gray
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",

  // Accent colors
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",

  // Opacity variations
  noticeContainerBg: "#37747340", // Green with 25% opacity
  coloredBgFill: "#3774731A", // Green with 10% opacity
};

const UploadModal = ({
  visible,
  onClose,
  selectedDocType,
  clientId,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);

  // Pick PDF
  const pickDocumentFile = async () => {
    try {
      setIsLoading(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      console.log("Document picker result:", res);

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        // Verify file is actually a PDF
        if (
          !file.mimeType?.includes("pdf") &&
          !file.name?.toLowerCase().endsWith(".pdf")
        ) {
          Alert.alert("Invalid File", "Please select a PDF file");
          return;
        }

        // Verify file size (limit to 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert(
            "File Too Large",
            "Please select a file smaller than 10MB"
          );
          return;
        }

        setSelectedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        });
        Alert.alert("Success", "File selected successfully");
      } else {
        Alert.alert("Cancelled", "No file was selected");
      }
    } catch (e) {
      console.error("File pick error:", e);
      Alert.alert("Error", "Could not pick file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Scan & PDF
  const pickCameraFile = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to scan documents.",
          [
            { text: "OK" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.8,
        aspect: [3, 4], // Remove fixed aspect ratio to allow free rectangular cropping
        allowsMultipleSelection: true,
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets?.length) {
        setCapturedImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert(
        "Scanner Error",
        "An unexpected error occurred while accessing the camera.",
        [{ text: "OK" }]
      );
    }
  };
  // Remove image from gallery
  const removeImage = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Open image preview modal
  const openImagePreview = (uri, index) => {
    setPreviewImageUri(uri);
    setPreviewImageIndex(index);
    setPreviewModalVisible(true);
  };

  // Close image preview modal
  const closeImagePreview = () => {
    setPreviewModalVisible(false);
    setPreviewImageUri(null);
    setPreviewImageIndex(null);
  };

  // Re-crop existing image
  const recropImage = async (imageUri, imageIndex) => {
    try {
      Alert.alert("Edit Image", "How would you like to edit this image?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Crop Again",
          onPress: () => replaceWithCroppedImage(imageIndex),
        },
        {
          text: "Replace with New",
          onPress: () => replaceWithNewImage(imageIndex),
        },
      ]);
    } catch (error) {
      console.error("Recrop error:", error);
      Alert.alert("Error", "Failed to edit image.");
    }
  };
  // Replace image with newly cropped version
  const replaceWithCroppedImage = async (imageIndex) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.8,
        // aspect: [3, 4], // Remove fixed aspect ratio to allow free rectangular cropping
        allowsMultipleSelection: false,
        exif: false,
      });

      if (!result.canceled && result.assets?.length) {
        setCapturedImages((prev) => {
          const newImages = [...prev];
          newImages[imageIndex] = result.assets[0].uri;
          return newImages;
        });
        closeImagePreview();
        Alert.alert("Success", "Image replaced successfully!");
      }
    } catch (error) {
      console.error("Replace image error:", error);
      Alert.alert("Error", "Failed to replace image.");
    }
  };
  // Replace with new image from camera
  const replaceWithNewImage = (imageIndex) => {
    Alert.alert("Replace Image", "Take a new photo to replace this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Take Photo",
        onPress: () => replaceFromCamera(imageIndex),
      },
    ]);
  };

  // Replace from camera
  const replaceFromCamera = async (imageIndex) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Camera access is required");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.8,
        // aspect: [3, 4], // Remove fixed aspect ratio to allow free rectangular cropping
        allowsMultipleSelection: false,
        exif: false,
      });

      if (!result.canceled && result.assets?.length) {
        setCapturedImages((prev) => {
          const newImages = [...prev];
          newImages[imageIndex] = result.assets[0].uri;
          return newImages;
        });
        closeImagePreview();
        Alert.alert("Success", "Image replaced successfully!");
      }
    } catch (error) {
      console.error("Replace from camera error:", error);
      Alert.alert("Error", "Failed to capture new image.");
    }
  };
  // Convert images to PDF
  const convertImagesToPDF = async () => {
    if (capturedImages.length === 0) return;
    const html = await Promise.all(
      capturedImages.map(async (u) => {
        const blob = await (await fetch(u)).blob();
        const b64 = await new Promise((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.readAsDataURL(blob);
        });
        return `<img src="${b64}" style="page-break-after: always;" />`;
      })
    ).then(
      (arr) => `<html><body style="margin:0">${arr.join("")}</body></html>`
    );

    const { uri: pdfUri } = await Print.printToFileAsync({ html });
    setSelectedFile({
      uri: pdfUri,
      name: `scan-${Date.now()}.pdf`,
      type: "application/pdf",
    });
    setCapturedImages([]);
  };

  // Upload
  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      return Alert.alert("Select file/type");
    }

    setUploadLoading(true);

    const data = new FormData();
    data.append("docType", selectedDocType);
    data.append("pdfFile", {
      uri:
        Platform.OS === "android"
          ? selectedFile.uri
          : selectedFile.uri.replace("file://", ""),
      name: selectedFile.name || "file.pdf",
      type: "application/pdf",
    });

    try {
      const resp = await fetch(
        `http://159.203.58.60:5000/documents/${clientId}/documents`,
        {
          method: "POST",
          body: data,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (!resp.ok) throw new Error("upload failed");

      Alert.alert("Success", "Document uploaded successfully");

      // Call the onUploadSuccess callback to refresh data in the parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Clear state and close modal
      setSelectedFile(null);
      setCapturedImages([]);
      onClose();
    } catch (e) {
      console.error("Upload error:", e);
      Alert.alert("Error", "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  // Close modal and reset state
  const handleClose = () => {
    setSelectedFile(null);
    setCapturedImages([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            capturedImages.length > 0 && styles.modalContentFullscreen,
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedDocType}</Text>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={handleClose}
            >
              <CloseIconSvg />
            </TouchableOpacity>
          </View>
          {capturedImages.length > 0 ? (
            <>
              <ScrollView style={styles.imageScrollView}>
                <View style={styles.imageGrid}>
                  {capturedImages.map((uri, index) => (
                    <View key={index} style={styles.gridItem}>
                      <TouchableOpacity
                        onPress={() => openImagePreview(uri, index)}
                        style={styles.imageContainer}
                      >
                        <Image
                          source={{ uri }}
                          style={styles.gridImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeImage(index)}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.backButton]}
                  onPress={() => setCapturedImages([])}
                >
                  <BackButton color={COLORS.slate} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addMoreButton]}
                  onPress={pickCameraFile}
                >
                  <Text style={styles.addMoreButtonText}>
                    Add Another Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.doneButton]}
                  onPress={convertImagesToPDF}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : !selectedFile ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonTakePicture]}
                onPress={pickCameraFile}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>Take Picture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonHalf]}
                onPress={pickDocumentFile}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>Upload from files</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.fileSelected}>
              {selectedFile?.name || "File selected"}
            </Text>
          )}
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={COLORS.green}
              style={styles.loadingIndicator}
            />
          )}
          {selectedFile && (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                uploadLoading && styles.buttonDisabled,
              ]}
              onPress={handleUpload}
              disabled={uploadLoading}
            >
              {uploadLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload</Text>
              )}
            </TouchableOpacity>
          )}
          {/* Preview Modal */}
          {previewModalVisible && (
            <Modal
              visible={previewModalVisible}
              animationType="slide"
              transparent={false}
              onRequestClose={closeImagePreview}
            >
              <View style={styles.previewModal}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Image Preview</Text>
                  <TouchableOpacity
                    style={styles.closePreviewButton}
                    onPress={closeImagePreview}
                  >
                    <CloseIconSvg />
                  </TouchableOpacity>
                </View>

                {previewImageUri && (
                  <View style={styles.previewImageContainer}>
                    <Image
                      source={{ uri: previewImageUri }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() =>
                      recropImage(previewImageUri, previewImageIndex)
                    }
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.removePreviewButton]}
                    onPress={() => {
                      removeImage(previewImageIndex);
                      closeImagePreview();
                    }}
                  >
                    <Text style={styles.actionButtonText}>Remove</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.closePreviewActionButton,
                    ]}
                    onPress={closeImagePreview}
                  >
                    <Text style={styles.actionButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    position: "relative",
  },
  modalContentFullscreen: {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    borderRadius: 0,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === "ios" ? 40 : 20, // Add more padding for iOS notch
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 24, // H2 size
    fontWeight: 700, // H2 weight
    color: COLORS.black,
    flex: 1,
    fontFamily: "Futura",
    textAlign: "center",
    marginTop: 24, // Center title vertically
  },
  closeModalButton: {
    position: "absolute",
    top: -12,
    right: -12,
    padding: 5,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalText: {
    color: COLORS.black,
  },
  removeButton: {
    position: "absolute",
    overflow: "scroll",
    borderRadius: 33,
    bottom: -30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  removeButtonText: {
    backgroundColor: COLORS.green,
    color: COLORS.white,
    textAlign: "center",
    borderRadius: 33,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12, // H4 size
    fontWeight: 700, // H4 weight
    fontFamily: "Futura",
  },
  imageScrollView: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.white,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 4,

    backgroundColor: COLORS.white,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 0.75, // 3:4 ratio to match document cropping
    marginBottom: 24,
    position: "relative",
    backgroundColor: COLORS.silver,
    borderRadius: 8,
    overflow: "visible",
    marginVertical: 32,
    padding: 4,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.black,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  bottomButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  backButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  addMoreButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  addMoreButtonText: {
    color: COLORS.green,
    fontSize: 12, // P size
    fontWeight: 700, // P weight
    fontFamily: "Futura",
  },
  doneButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 33,
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 12, // P size
    fontWeight: 700, // P weight
    fontFamily: "Futura",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    marginVertical: 16,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 12, // H3 size
    fontWeight: 700, // P weight
    fontFamily: "Futura",
  },
  actionButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 33,
    minWidth: 121,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonHalf: {
    flex: 160,
    minHeight: 42,
  },
  actionButtonTakePicture: {
    backgroundColor: COLORS.green,
    flex: 127,
    minHeight: 42,
  },
  fileSelected: {
    textAlign: "center",
    marginVertical: 16,
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  uploadButton: {
    backgroundColor: COLORS.green,
    flex: 199,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 50,
    marginTop: 16,
    width: "100%",
  },
  uploadButtonText: {
    color: COLORS.white,
    fontWeight: "500", // P weight
    textAlign: "center",
    fontSize: 16, // H3 size
    fontFamily: "Futura",
  },
  loadingIndicator: {
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Preview modal styles
  previewModal: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
  },
  closePreviewButton: {
    padding: 5,
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.black,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  editButton: {
    backgroundColor: COLORS.blue,
    minWidth: 80,
  },
  removePreviewButton: {
    backgroundColor: COLORS.red,
    minWidth: 80,
  },
  closePreviewActionButton: {
    backgroundColor: COLORS.slate,
    minWidth: 80,
  },
});

export default UploadModal;
