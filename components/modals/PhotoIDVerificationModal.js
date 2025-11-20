import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import Logo from "../Logo";
import BackButton from "../icons/BackButton";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  darkBlack: "#000D1D",
  textBlack: "#1D1D1D",
  slate: "#707070",
  gray: "#A9A9A9",
  lightGray: "#D9D9D9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  blue: "#2271B1",
  red: "#A20E0E",
  footerBg: "#0E1D1D",
  buttonDisabled: "#E8E8E8",
  buttonDisabledText: "#797979",
};

const PhotoIDVerificationModal = ({
  visible,
  onClose,
  clientId,
  clientName,
  onUploadSuccess,
}) => {
  const [currentPage, setCurrentPage] = useState(1); // 1, 2, or 3
  const [capturedImages, setCapturedImages] = useState([]); // Array of image URIs
  const [pdfFile, setPdfFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentPage(1);
    setCapturedImages([]);
    setPdfFile(null);
    setIsLoading(false);
    onClose();
  };

  // Camera permission and image capture
  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImages((prev) => [...prev, result.assets[0].uri]);
        // Move to page 3 after first photo
        if (capturedImages.length === 0) {
          setCurrentPage(3);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // Remove image from array
  const removeImage = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
    // If no images left, go back to page 2
    if (capturedImages.length === 1) {
      setCurrentPage(2);
    }
  };

  // Convert images to PDF
  const convertImagesToPDF = async () => {
    if (capturedImages.length === 0) return;

    setIsLoading(true);
    try {
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
          `<html><body style="margin:0; padding:0;">${arr.join(
            ""
          )}</body></html>`
      );

      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      setPdfFile({
        uri: pdfUri,
        name: `photoid_${clientName}_${Date.now()}.pdf`,
        type: "application/pdf",
      });
      setCapturedImages([]);
    } catch (error) {
      console.error("PDF conversion error:", error);
      Alert.alert(
        "Error",
        "Failed to convert images to PDF. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Upload PDF to server
  const handleContinue = async () => {
    if (!pdfFile) {
      Alert.alert("Error", "Please complete the photo capture process");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("docType", "photoid");
      formData.append("pdfFile", {
        uri:
          Platform.OS === "android"
            ? pdfFile.uri
            : pdfFile.uri.replace("file://", ""),
        name: pdfFile.name || "photoid.pdf",
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
        Alert.alert("Success", "Photo ID uploaded successfully!");
        onUploadSuccess?.();
        handleClose();
      } else {
        const errorData = await response.json();
        Alert.alert("Upload Failed", errorData.message || "Please try again");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Page 1: Instructions
  const renderPage1 = () => (
    <View style={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Logo width={112} height={39} variant="black" />
      </View>

      <View style={styles.instructionsContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Before take your a photo,{"\n"}please make sure that
          </Text>
        </View>

        <View style={styles.checklistContainer}>
          <Text style={styles.checklistItem}>Your ID isn't expired</Text>
          <Text style={styles.checklistItem}>Take a clear photo</Text>
          <Text style={styles.checklistItem}>Capture you entire ID</Text>
          <Text style={styles.checklistItem}>
            Make sure it fits within the frame
          </Text>
        </View>

        <TouchableOpacity
          style={styles.takePhotoButton}
          onPress={() => setCurrentPage(2)}
          activeOpacity={0.8}
        >
          <Text style={styles.takePhotoButtonText}>Take photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </View>
  );

  // Page 2: Initial photo prompt (camera will open automatically)
  const renderPage2 = () => (
    <View style={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Logo width={112} height={39} variant="black" />
      </View>

      <View style={styles.photoContainer}>
        <View style={styles.photoTitleContainer}>
          <Text style={styles.title}>Verify your identity</Text>
        </View>

        <Text style={styles.subtitle}>
          Drivers license please include both sides
        </Text>

        <View style={styles.photoPlaceholder}>
          <View style={styles.placeholderBox} />
        </View>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={takePhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>Take photo of front side</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Page 3: Show captured images and allow adding more
  const renderPage3 = () => (
    <View style={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Logo width={112} height={39} variant="black" />
      </View>

      <View style={styles.photoContainer}>
        <View style={styles.photoTitleContainer}>
          <Text style={styles.title}>Verify your identity</Text>
        </View>

        <Text style={styles.subtitle}>
          Drivers license - please include both sides
        </Text>

        <ScrollView style={styles.imageScrollView}>
          <View style={styles.imageGrid}>
            {capturedImages.map((uri, index) => (
              <View key={index} style={styles.gridItem}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                </View>
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

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={takePhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>
              {capturedImages.length < 2
                ? "Take photo of back side"
                : "Add Another Photo"}
            </Text>
          </TouchableOpacity>

          {capturedImages.length >= 2 && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={convertImagesToPDF}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.doneButtonText}>Done</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // Footer with Back and Continue buttons
  const renderFooter = () => {
    const canContinue = currentPage === 1 || pdfFile !== null;

    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => {
            if (currentPage === 1) {
              handleClose();
            } else if (currentPage === 2) {
              setCurrentPage(1);
              setCapturedImages([]);
            } else if (currentPage === 3) {
              if (pdfFile) {
                setPdfFile(null);
              } else {
                setCurrentPage(2);
                setCapturedImages([]);
              }
            }
          }}
          activeOpacity={0.8}
        >
          <BackButton color={COLORS.white} size={32} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            canContinue && styles.continueButtonEnabled,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={() => {
            if (currentPage === 1) {
              setCurrentPage(2);
              takePhoto();
            } else if (pdfFile) {
              handleContinue();
            }
          }}
          disabled={!canContinue || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text
              style={[
                styles.continueButtonText,
                canContinue && styles.continueButtonTextEnabled,
                !canContinue && styles.continueButtonTextDisabled,
              ]}
            >
              {pdfFile ? "Upload" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentPage === 1 && renderPage1()}
          {currentPage === 2 && renderPage2()}
          {currentPage === 3 && renderPage3()}
        </ScrollView>

        {renderFooter()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 64,
    minHeight: 665,
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    paddingVertical: 10,
    alignSelf: "stretch",
  },

  // Page 1: Instructions
  instructionsContainer: {
    gap: 32,
    flex: 1,
  },
  titleContainer: {
    gap: 8,
  },
  title: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.darkBlack,
  },
  checklistContainer: {
    gap: 8,
  },
  checklistItem: {
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textBlack,
  },
  takePhotoButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    width: 121,
  },
  takePhotoButtonText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: COLORS.white,
  },

  // Page 2 & 3: Photo capture
  photoContainer: {
    gap: 16,
    flex: 1,
  },
  photoTitleContainer: {
    gap: 8,
  },
  subtitle: {
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textBlack,
  },
  photoPlaceholder: {
    width: "100%",
    height: 170,
    backgroundColor: COLORS.lightGray,
    borderRadius: 26,
    overflow: "hidden",
  },
  placeholderBox: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.lightGray,
  },
  capturedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  buttonsContainer: {
    gap: 8,
  },
  outlineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 42,
  },
  outlineButtonText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: COLORS.green,
  },

  // Image grid styles
  imageScrollView: {
    flex: 1,
    width: "100%",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 4,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 0.75,
    marginBottom: 24,
    position: "relative",
    backgroundColor: COLORS.silver,
    borderRadius: 8,
    overflow: "visible",
    marginVertical: 16,
    padding: 4,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.black,
  },
  removeButton: {
    position: "absolute",
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
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  doneButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    minWidth: 100,
  },
  doneButtonText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: COLORS.white,
  },

  // Spacer
  spacer: {
    height: 1,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 32,
    gap: 66,
    height: 130,
    backgroundColor: COLORS.footerBg,
  },
  backButtonContainer: {
    width: 32,
    height: 32,
  },
  continueButton: {
    backgroundColor: COLORS.buttonDisabled,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 43,
    minWidth: 114,
  },
  continueButtonEnabled: {
    backgroundColor: COLORS.green,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.buttonDisabled,
  },
  continueButtonText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.buttonDisabledText,
  },
  continueButtonTextEnabled: {
    color: COLORS.white,
  },
  continueButtonTextDisabled: {
    color: COLORS.buttonDisabledText,
  },
});

export default PhotoIDVerificationModal;
