// ClientQuestionaire.js
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import axios from "axios";
import { useAuth } from "./context/AuthContext";

export default function ClientQuestionaire() {
  const { auth } = useAuth();
  const clientId = auth.client.id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    applyingbehalf: "",
    employmentStatus: "",
    ownAnotherProperty: "",
    otherDetails: {
      name: "",
      email: "",
      phone: "",
      relationship: "",
      employmentStatus: "",
      ownAnotherProperty: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.applyingbehalf !== "";
      case 2:
        if (formData.applyingbehalf === "other") {
          const { name, email, phone, relationship } = formData.otherDetails;
          return name && email && phone && relationship;
        }
        return true;
      case 3:
        if (formData.applyingbehalf === "other") {
          return (
            formData.employmentStatus && formData.otherDetails.employmentStatus
          );
        }
        return formData.employmentStatus !== "";
      case 4:
        if (formData.applyingbehalf === "other") {
          return (
            formData.ownAnotherProperty &&
            formData.otherDetails.ownAnotherProperty
          );
        }
        return formData.ownAnotherProperty !== "";
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && formData.applyingbehalf === "self") {
        setCurrentStep(3);
      } else {
        setCurrentStep((s) => Math.min(s + 1, 4));
      }
    } else {
      Alert.alert(
        "Required Fields",
        "Please fill in all required fields before continuing."
      );
    }
  };

  const prevStep = () => {
    if (currentStep === 3 && formData.applyingbehalf === "self") {
      setCurrentStep(1);
    } else {
      setCurrentStep((s) => Math.max(s - 1, 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      Alert.alert(
        "Required Fields",
        "Please fill in all required fields before submitting."
      );
      return;
    }
    setIsLoading(true);
    try {
      await axios.put(
        `http://44.202.249.124:5000/client/questionaire/${clientId}`,
        formData
      );
      Alert.alert("Success", "Questionnaire submitted successfully!");
      // Trigger refetch in Home component by updating auth
      auth.refetch && auth.refetch();
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      Alert.alert("Error", "There was an error submitting the questionnaire.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleOtherDetailsChange = (field, value) => {
    setFormData({
      ...formData,
      otherDetails: {
        ...formData.otherDetails,
        [field]: value,
      },
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Details</Text>
            <Text style={styles.label}>Who is applying for this property?</Text>
            <View style={styles.buttonGroup}>
              {["self", "other"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionButton,
                    formData.applyingbehalf === opt && styles.selectedButton,
                  ]}
                  onPress={() => handleButtonSelect("applyingbehalf", opt)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.applyingbehalf === opt && styles.selectedText,
                    ]}
                  >
                    {opt === "self" ? "Just me" : "Me and someone else"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        if (formData.applyingbehalf === "other") {
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Other Person's Details</Text>
              {[
                { key: "name", placeholder: "Full Name" },
                {
                  key: "email",
                  placeholder: "Email",
                  keyboard: "email-address",
                },
                {
                  key: "phone",
                  placeholder: "Phone Number",
                  keyboard: "phone-pad",
                },
                { key: "relationship", placeholder: "Relationship" },
              ].map(({ key, placeholder, keyboard }) => (
                <TextInput
                  key={key}
                  style={styles.input}
                  placeholder={placeholder}
                  value={formData.otherDetails[key]}
                  onChangeText={(text) => handleOtherDetailsChange(key, text)}
                  keyboardType={keyboard || "default"}
                  autoCapitalize="none"
                />
              ))}
            </View>
          );
        }
        setCurrentStep(3);
        return null;

      case 3:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employment Information</Text>
            {/* Self status */}
            <Text style={styles.label}>Your Employment Status</Text>
            <View style={styles.buttonGroup}>
              {["Employed", "Selfemployed", "Unemployed"].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.optionButton,
                    formData.employmentStatus === st && styles.selectedButton,
                  ]}
                  onPress={() => handleButtonSelect("employmentStatus", st)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.employmentStatus === st && styles.selectedText,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.applyingbehalf === "other" && (
              <>
                <Text style={styles.label}>
                  {formData.otherDetails.name}'s Employment Status
                </Text>
                <View style={styles.buttonGroup}>
                  {["Employed", "Selfemployed", "Unemployed"].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.optionButton,
                        formData.otherDetails.employmentStatus === st &&
                          styles.selectedButton,
                      ]}
                      onPress={() =>
                        handleOtherDetailsChange("employmentStatus", st)
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.otherDetails.employmentStatus === st &&
                            styles.selectedText,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Ownership</Text>

            <Text style={styles.label}>Do you own another property?</Text>
            <View style={styles.buttonGroup}>
              {["Yes - with a mortgage", "Yes - All paid off", "No"].map(
                (opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionButton,
                      formData.ownAnotherProperty === opt &&
                        styles.selectedButton,
                    ]}
                    onPress={() =>
                      handleButtonSelect("ownAnotherProperty", opt)
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.ownAnotherProperty === opt &&
                          styles.selectedText,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {formData.applyingbehalf?.toLowerCase() === "other" && (
              <>
                <Text style={styles.label}>
                  Does {formData.otherDetails.name} own another property?
                </Text>
                <View style={styles.buttonGroup}>
                  {["Yes - with a mortgage", "Yes - All paid off", "No"].map(
                    (opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.optionButton,
                          formData.otherDetails.ownAnotherProperty === opt &&
                            styles.selectedButton,
                        ]}
                        onPress={() =>
                          handleOtherDetailsChange("ownAnotherProperty", opt)
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            formData.otherDetails.ownAnotherProperty === opt &&
                              styles.selectedText,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </>
            )}
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
        {currentStep < 4 && (
          <TouchableOpacity style={styles.navButton} onPress={nextStep}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        )}
        {currentStep === 4 && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Questionnaire</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

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
  /* new TextInput style */
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    fontSize: 14,
    color: "#23231A",
  },
});
