import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { useAuth } from "./context/AuthContext";

function ClientQuestionaire() {
  const { auth } = useAuth();
  const clientId = auth.client.id;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    applyingbehalf: "",
    employmentStatus: "",
    ownAnotherProperty: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Submit the questionnaire data to the backend
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await axios.put(
        `http://54.89.183.155:5000/client/questionaire/${clientId}`,
        formData
      );
      Alert.alert("Success", "Questionnaire submitted successfully!");
      // You can also trigger a refresh or navigation here
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      Alert.alert("Error", "There was an error submitting the questionnaire.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the form field when a button is pressed
  const handleButtonSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Render the appropriate step content based on currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Details</Text>
            <Text style={styles.label}>Who is applying for this property?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.applyingbehalf === "self" && styles.selectedButton,
                ]}
                onPress={() => handleButtonSelect("applyingbehalf", "self")}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.applyingbehalf === "self" && styles.selectedText,
                  ]}
                >
                  Just me
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.applyingbehalf === "other" && styles.selectedButton,
                ]}
                onPress={() => handleButtonSelect("applyingbehalf", "other")}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.applyingbehalf === "other" && styles.selectedText,
                  ]}
                >
                  Me and someone else
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employment Information</Text>
            <Text style={styles.label}>What is your employment status?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.employmentStatus === "Employed" &&
                    styles.selectedButton,
                ]}
                onPress={() =>
                  handleButtonSelect("employmentStatus", "Employed")
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.employmentStatus === "Employed" &&
                      styles.selectedText,
                  ]}
                >
                  Employed at a company
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.employmentStatus === "Selfemployed" &&
                    styles.selectedButton,
                ]}
                onPress={() =>
                  handleButtonSelect("employmentStatus", "Selfemployed")
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.employmentStatus === "Selfemployed" &&
                      styles.selectedText,
                  ]}
                >
                  Self employed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.employmentStatus === "Unemployed" &&
                    styles.selectedButton,
                ]}
                onPress={() =>
                  handleButtonSelect("employmentStatus", "Unemployed")
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.employmentStatus === "Unemployed" &&
                      styles.selectedText,
                  ]}
                >
                  Unemployed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Ownership</Text>
            <Text style={styles.label}>Do you own another property?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.ownAnotherProperty === "Yes - with a mortgage" &&
                    styles.selectedButton,
                ]}
                onPress={() =>
                  handleButtonSelect(
                    "ownAnotherProperty",
                    "Yes - with a mortgage"
                  )
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.ownAnotherProperty === "Yes - with a mortgage" &&
                      styles.selectedText,
                  ]}
                >
                  Yes - with a mortgage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.ownAnotherProperty === "Yes - All paid off" &&
                    styles.selectedButton,
                ]}
                onPress={() =>
                  handleButtonSelect("ownAnotherProperty", "Yes - All paid off")
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.ownAnotherProperty === "Yes - All paid off" &&
                      styles.selectedText,
                  ]}
                >
                  Yes - All paid off
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.ownAnotherProperty === "No" && styles.selectedButton,
                ]}
                onPress={() => handleButtonSelect("ownAnotherProperty", "No")}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.ownAnotherProperty === "No" && styles.selectedText,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Property Purchase Questionnaire</Text>
      {renderStep()}
      <View style={styles.navigation}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.navButton} onPress={prevStep}>
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        {currentStep < 3 && (
          <TouchableOpacity style={styles.navButton} onPress={nextStep}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        )}
        {currentStep === 3 && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Questionnaire</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

export default ClientQuestionaire;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: "#23231A",
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    flexBasis: "48%",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    color: "#019B8E",
  },
  selectedButton: {
    backgroundColor: "#019B8E",
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  navButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#F04D4D",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
