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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentPage(1);
    setFrontImage(null);
    setBackImage(null);
    setIsLoading(false);
    onClose();
  };

  // Camera permission and image capture
  const takePhoto = async (side = "front") => {
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
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        if (side === "front") {
          setFrontImage(result.assets[0].uri);
          setCurrentPage(3); // Move to page 3 after front is captured
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // Retake photo
  const retakePhoto = (side = "front") => {
    if (side === "front") {
      setFrontImage(null);
      setCurrentPage(2);
    } else {
      setBackImage(null);
    }
  };

  // Upload photos to server
  const handleContinue = async () => {
    if (!frontImage && currentPage === 3) {
      Alert.alert("Error", "Please take a photo of the front of your ID");
      return;
    }

    if (currentPage === 3 && !backImage) {
      // Just move to take back side, don't upload yet
      return;
    }

    if (!frontImage || !backImage) {
      Alert.alert("Error", "Please take photos of both sides of your ID");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      // Add front image
      formData.append("documents", {
        uri: frontImage,
        type: "image/jpeg",
        name: `photoid_front_${clientName}_${Date.now()}.jpg`,
      });

      // Add back image
      formData.append("documents", {
        uri: backImage,
        type: "image/jpeg",
        name: `photoid_back_${clientName}_${Date.now()}.jpg`,
      });

      formData.append("docType", "photoid");
      formData.append("clientId", clientId);

      const response = await fetch(
        `https://signup.roostapp.io/client/${clientId}/documents`,
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

  // Page 2: Camera/Photo capture
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
          Drivers license please include both side
        </Text>

        <View style={styles.photoPlaceholder}>
          {frontImage ? (
            <Image source={{ uri: frontImage }} style={styles.capturedImage} />
          ) : (
            <View style={styles.placeholderBox} />
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => retakePhoto("front")}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>Retake</Text>
          </TouchableOpacity>

          {!frontImage && (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => takePhoto("front")}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineButtonText}>
                Take photo for other side
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // Page 3: Back side capture
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
          Drivers license please include both side
        </Text>

        {/* Front image preview */}
        <View style={styles.photoPlaceholder}>
          {frontImage && (
            <Image source={{ uri: frontImage }} style={styles.capturedImage} />
          )}
        </View>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => retakePhoto("front")}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>Retake</Text>
        </TouchableOpacity>

        {/* Back image */}
        {backImage ? (
          <>
            <View style={styles.photoPlaceholder}>
              <Image source={{ uri: backImage }} style={styles.capturedImage} />
            </View>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => retakePhoto("back")}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineButtonText}>Retake</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => takePhoto("back")}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>
              Take photo for other side
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Footer with Back and Continue buttons
  const renderFooter = () => {
    const canContinue =
      currentPage === 1 || (currentPage === 3 && frontImage && backImage);

    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => {
            if (currentPage === 1) {
              handleClose();
            } else if (currentPage === 2) {
              setCurrentPage(1);
              setFrontImage(null);
            } else if (currentPage === 3) {
              setCurrentPage(2);
              setBackImage(null);
            }
          }}
          activeOpacity={0.8}
        >
          <BackButton color={COLORS.white} size={32} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={() => {
            if (currentPage === 1) {
              setCurrentPage(2);
              takePhoto("front");
            } else if (currentPage === 3 && frontImage && backImage) {
              handleContinue();
            }
          }}
          disabled={!canContinue || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.buttonDisabledText} />
          ) : (
            <Text
              style={[
                styles.continueButtonText,
                !canContinue && styles.continueButtonTextDisabled,
              ]}
            >
              Continue
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
  continueButtonTextDisabled: {
    color: COLORS.buttonDisabledText,
  },
});

export default PhotoIDVerificationModal;
