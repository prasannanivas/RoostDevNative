// UploadModal.js
import React, { useState, useRef, useEffect } from "react";
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
  Animated,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { Linking } from "react-native";
import CloseIconSvg from "../icons/CloseIconSvg";
import BackButton from "../icons/BackButton";
import CropModal from "./CropModal";

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
  clientName,
  coClientName = "",
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  
  // Screen states: 'upload' | 'capture' | 'crop'
  const [currentScreen, setCurrentScreen] = useState('upload');

  // Animation values
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const [internalVisible, setInternalVisible] = useState(false);
  
  // Track if camera has been auto-opened for this modal session
  const hasAutoOpenedCamera = useRef(false);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      setCurrentScreen('upload'); // Reset to upload screen
      // Sequential animation: backdrop fades in, then modal slides up
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  console.log("Selected document type:", selectedDocType);

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

  // Open camera directly
  const pickCameraFile = async () => {
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
    setCurrentScreen('capture'); // Switch to capture screen
    // Take first photo immediately
    setTimeout(() => takePhoto(), 100);
  };

  // Take photo in capture modal
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setPendingImage({ uri: asset.uri, width: asset.width, height: asset.height });
        setCurrentScreen('crop'); // Switch to crop screen
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Scanner Error", "Failed to capture photo.");
    }
  };
  // Remove image from gallery
  const removeImage = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };




  // Handle done from capture modal
  const handleDoneCaptureModal = async () => {
    if (capturedImages.length === 0) {
      Alert.alert("No Images", "Please capture at least one image.");
      return;
    }
    await convertImagesToPDF();
    setCurrentScreen('upload'); // Return to upload screen
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
        return `<div style="width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; page-break-after: always;">
          <img src="${b64}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>`;
      })
    ).then(
      (arr) =>
        `<html><body style="margin:0; padding:0;">${arr.join("")}</body></html>`
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
    data.append("docType", selectedDocType.docType);
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
        `https://signup.roostapp.io/documents/${clientId}/documents`,
        {
          method: "POST",
          body: data,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (!resp.ok) throw new Error("upload failed" + (await resp.text()));

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
    // Closing animation: reverse of opening (modal slides down, then backdrop fades out)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      setSelectedFile(null);
      setCapturedImages([]);
      setCurrentScreen('upload');
      setPendingImage(null);
      onClose();
    });
  };

  // Handle back from capture screen
  const handleBackFromCapture = () => {
    setCapturedImages([]);
    setCurrentScreen('upload');
  };

  return (
    <Modal
      visible={internalVisible}
      animationType="none"
      transparent={currentScreen === 'upload'}
      onRequestClose={handleClose}
    >
      {/* Upload Screen */}
      {currentScreen === 'upload' && (
        <Animated.View
          style={[styles.modalOverlay, { opacity: backdropOpacity }]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
                opacity: modalOpacity,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {(
                  selectedDocType?.displayName ||
                  selectedDocType?.docType ||
                  "Document"
                )
                  .charAt(0)
                  .toUpperCase() +
                  (
                    selectedDocType?.displayName ||
                    selectedDocType?.docType ||
                    "Document"
                  ).slice(1)}
              </Text>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={handleClose}
              >
                <CloseIconSvg width={26} height={26} color="#797979" />
              </TouchableOpacity>
            </View>

            <Text style={styles.clientNameText}>
              {selectedDocType?.type === "Needed" ? clientName : coClientName}
            </Text>
            {selectedDocType?.displayName?.toLowerCase().includes("paystub") && (
              <Text style={styles.infotext}>
                Please include your two most recent
              </Text>
            )}

            <Text style={styles.infotext}>{selectedDocType?.description}</Text>

            {!selectedFile ? (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.actionButton]}
                  onPress={pickCameraFile}
                  disabled={isLoading}
                >
                  <Text style={styles.actionButtonText}>Take a picture</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonHalf]}
                  onPress={pickDocumentFile}
                  disabled={isLoading}
                >
                  <Text style={styles.actionButtonHalfText}>
                    Upload from files
                  </Text>
                </TouchableOpacity>

                <Text style={styles.emailInfoText}>
                  You can just email all your files to{"\n"}
                  <Text style={styles.emailBold}>
                    Documents@inbound.roostapp.io
                  </Text>{" "}
                  on your{"\n"}
                  computer. We will take it from there.
                </Text>
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
          </Animated.View>
        </Animated.View>
      )}

      {/* Capture Screen - Full Screen */}
      {currentScreen === 'capture' && (
        <View style={styles.captureModal}>
          <View style={styles.captureHeader}>
            <TouchableOpacity
              style={styles.closeCaptureButton}
              onPress={handleBackFromCapture}
            >
              <CloseIconSvg width={26} height={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {capturedImages.length > 0 ? (
            <ScrollView style={styles.captureScrollView}>
              <View style={styles.captureGrid}>
                {capturedImages.map((uri, index) => (
                  <View key={index} style={styles.captureGridItem}>
                    <View style={styles.captureImageContainer}>
                      <Image
                        source={{ uri }}
                        style={styles.captureGridImage}
                        resizeMode="contain"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.captureRemoveButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.captureRemoveButtonText}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}

          <View style={styles.captureBottomBar}>
            <TouchableOpacity
              style={styles.captureBackButton}
              onPress={handleBackFromCapture}
            >
              <BackButton color={COLORS.white} width={26} height={26} />
            </TouchableOpacity>

            {capturedImages.length > 0 && (
              <TouchableOpacity
                style={styles.captureAddMoreButton}
                onPress={takePhoto}
              >
                <Text style={styles.captureAddMoreButtonText}>
                  Add Another Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.captureDoneButton,
                capturedImages.length === 0 &&
                  styles.captureDoneButtonDisabled,
              ]}
              onPress={handleDoneCaptureModal}
              disabled={capturedImages.length === 0}
            >
              <Text style={styles.captureDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Crop Screen - Full Screen */}
      {currentScreen === 'crop' && pendingImage && (
        <View style={styles.fullScreenContainer}>
          <CropModal
            visible={true}
            imageUri={pendingImage?.uri}
            originalWidth={pendingImage?.width}
            originalHeight={pendingImage?.height}
            onCancel={() => {
              setPendingImage(null);
              setCurrentScreen('capture');
            }}
            onCrop={(croppedUri) => {
              setPendingImage(null);
              if (croppedUri) {
                setCapturedImages((prev) => [...prev, croppedUri]);
              }
              setCurrentScreen('capture');
            }}
          />
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 48,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    width: "100%",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 4,
    paddingTop: 10,
    position: "relative",
    paddingHorizontal: 16,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate,
    textAlign: "center",
    fontFamily: "Futura",
  },
  infotext: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.slate,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Futura",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.black,
    fontFamily: "Futura",
    textAlign: "center",
  },
  closeModalButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeModalText: {
    color: COLORS.black,
  },

  // Capture Modal Styles
  captureModal: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  captureHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 15,
    backgroundColor: COLORS.black,
  },
  closeCaptureButton: {
    padding: 5,
  },
  captureScrollView: {
    flex: 1,
  },
  captureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 180,
  },
  captureGridItem: {
    width: "48%",
    aspectRatio: 0.75,
    marginBottom: 40,
    position: "relative",
    borderRadius: 8,
    overflow: "visible",
  },
  captureImageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  captureGridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3d3e3fff",
  },
  captureRemoveButton: {
   marginVertical: 4,
    alignItems: "flex-start",
  },
  captureRemoveButtonText: {
    backgroundColor: COLORS.green,
    color: COLORS.white,
    textAlign: "left",
    borderRadius: 33,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  captureEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  captureOpenCameraButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
  },
  captureOpenCameraButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  captureBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: COLORS.black,
    gap: 12,
  },
  captureBackButton: {
    padding: 8,
  },
  captureAddMoreButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.green,
    alignItems: "center",
  },
  captureAddMoreButtonText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  captureDoneButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: "center",
  },
  captureDoneButtonDisabled: {
    opacity: 0.5,
  },
  captureDoneButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  buttonGroup: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginVertical: 8,
    width: "100%",
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Futura",
  },
  actionButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  actionButtonHalf: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.green,
    width: "100%",
  },
  actionButtonHalfText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Futura",
  },
  emailInfoText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#4D4D4D",
    fontFamily: "Futura",
    marginTop: 8,
  },
  emailBold: {
    fontWeight: "700",
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    marginTop: 16,
    width: "90%",
  },
  uploadButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 14,
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
