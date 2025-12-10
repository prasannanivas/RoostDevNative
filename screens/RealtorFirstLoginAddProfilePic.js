import React, { useState, useContext } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../components/Logo";
import { COLORS } from "../styles";
import { useNavigation } from "@react-navigation/native";
import { useRealtor } from "../context/RealtorContext";
import { useAuth } from "../context/AuthContext";

export default function RealtorFirstLoginAddProfilePic() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { auth } = useAuth();
  const { realtorInfo, fetchLatestRealtor } = useRealtor();
  const handleChooseFromPhotos = async () => {
    try {
      console.log("Opening photo picker...");
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert("Permission to access camera roll is required!");
        console.log("Media library permission denied");
        return;
      }

      console.log("Launching image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log("Image picker result:", JSON.stringify(result));
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("Selected image:", selectedAsset.uri);
        setImage(selectedAsset.uri);
        // Image will be previewed automatically
      } else {
        console.log("No image selected or picker was canceled");
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      alert("There was a problem selecting your image. Please try again.");
    }
  };
  const handleOpenCamera = async () => {
    try {
      console.log("Requesting camera permission...");
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        alert("Permission to access camera is required!");
        console.log("Camera permission denied");
        return;
      }

      console.log("Launching camera...");
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log("Camera result:", JSON.stringify(result));
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("Captured image:", selectedAsset.uri);
        setImage(selectedAsset.uri);
        // Image will be previewed automatically
      } else {
        console.log("No image captured or camera was canceled");
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      alert("There was a problem capturing your image. Please try again.");
    }
  };
  const handleNext = async () => {
    if (!image) {
      // If no image selected, just navigate
      navigation.navigate("InviteFirstClient");
      return;
    }

    setLoading(true);
    try {
      console.log("Starting image upload process...");
      console.log("Image URI:", image);

      // Create FormData for image upload
      const formData = new FormData();

      // Get file extension from the URI path
      // Handle both file:// URIs and content:// URIs
      const uriParts = image.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const fileType =
        fileNameParts.length > 1
          ? fileNameParts[fileNameParts.length - 1]
          : "jpg";

      console.log("Detected file type:", fileType);

      formData.append("profilePicture", {
        uri: image,
        type: `image/${fileType}`,
        name: `profile-picture.${fileType}`,
      });

      console.log("FormData created"); // Upload the profile picture to your backend
      const realtorId = realtorInfo?._id || auth?.realtor?._id;
      console.log("Uploading to realtorId:", realtorId);

      if (!realtorId) {
        throw new Error("Could not determine realtor ID for upload");
      }

      const uploadUrl = `https://signup.roostapp.io/realtor/profilepic/${realtorId}`;
      console.log("Uploading to URL:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        // Do NOT set the "Content-Type" header manually!
      });

      console.log("Upload response status:", response.status);

      if (response.ok) {
        // Refresh realtor data to include the profile picture
        await fetchLatestRealtor();

        // Only navigate after successful upload
        navigation.navigate("InviteFirstClient");
      } else {
        console.log("Server responded with status:", response.status);
        const errorData = await response.text();
        console.log("Error response:", errorData);
        throw new Error(`Failed to upload profile picture: ${response.status}`);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert(
        "There was an error uploading your profile picture. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // This would navigate back if needed
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Logo width={112} height={39} variant="black" style={styles.brandLogo} />

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Logo */}
        {/* Heading */}
        <Text style={styles.heading}>Add a profile picture</Text>
        {/* Subheading */}
        <Text style={styles.subheading}>
          Give your clients the confidence that it's you by including your
          picture.
        </Text>
        {/* Image Preview */}
        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: image }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          </View>
        )}
        {/* Buttons */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChooseFromPhotos}
        >
          <Text style={styles.actionButtonText}>Choose from photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenCamera}
        >
          <Text style={styles.actionButtonText}>Open your camera</Text>
        </TouchableOpacity>
        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>Uploading photo...</Text>
            <Text style={styles.loadingSubText}>
              Please wait while we process your image
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons
            name="arrow-back"
            size={20}
            color="#FFF"
            backgroundColor="transparent"
            borderRadius={50}
            borderWidth={2}
            borderColor="#FFF"
            padding={3}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.buttonLoadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.nextButtonText}>Processing</Text>
            </View>
          ) : (
            <Text style={styles.nextButtonText}>
              {" "}
              {image ? "Next" : "Skip"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 80,
    alignItems: "center",
  },
  brandLogo: {
    marginBottom: 50,
    alignSelf: "center",
    marginTop: 64,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: "center",
    color: "#1D2327",
  },
  subheading: {
    fontSize: 14,
    fontWeight: 500,
    color: "#707070",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  actionButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    minWidth: 334,
    minHeight: 42,
  },
  actionButtonText: {
    color: "#FBFBFB",
    fontSize: 12,
    fontWeight: 700,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.green,
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: "#707070",
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1D2327",
    paddingVertical: 16,
    paddingHorizontal: 24,
    height: "15%",
    paddingBottom: 36,
  },
  backButton: {
    padding: 3,
    opacity: 0,
  },
  nextButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 42,
    minWidth: 80,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 30,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: COLORS.green,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
});
