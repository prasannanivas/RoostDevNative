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
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Auto-proceed to next screen after selecting an image
      handleNext();
    }
  };

  const handleOpenCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Auto-proceed to next screen after taking a photo
      handleNext();
    }
  };
  const handleNext = async () => {
    setLoading(true);
    try {
      if (image) {
        // Create FormData for image upload
        const formData = new FormData();
        formData.append("profilePic", {
          uri: image,
          type: "image/jpeg",
          name: "profile-picture.jpg",
        });

        // Upload the profile picture to your backend
        const realtorId = realtorInfo?.id || auth?.realtor?.id;
        const response = await fetch(
          `http://159.203.58.60:5000/realtor/${realtorId}/update-profile-pic`,
          {
            method: "POST",
            headers: {
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          }
        );

        if (response.ok) {
          // Refresh realtor data to include the profile picture
          await fetchLatestRealtor();
        } else {
          throw new Error("Failed to upload profile picture");
        }
      } // Navigate to the next onboarding screen
      navigation.navigate("InviteFirstClient");
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
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Logo */}
        <Logo
          width={120}
          height={42}
          variant="black"
          style={styles.brandLogo}
        />

        {/* Heading */}
        <Text style={styles.heading}>Add a profile picture</Text>

        {/* Subheading */}
        <Text style={styles.subheading}>
          Give your clients the confidence that it's you by including your
          picture
        </Text>

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
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back-circle" size={36} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
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
  },
  heading: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1D2327",
  },
  subheading: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  actionButton: {
    backgroundColor: COLORS.green,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 16,
    color: COLORS.green,
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
    paddingBottom: 36,
  },
  backButton: {
    padding: 4,
  },
  nextButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
