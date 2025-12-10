import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import Button from "../components/common/Button";
import BackButton from "../components/icons/BackButton";
import Logo from "../components/Logo";
import DateTimePicker from "@react-native-community/datetimepicker";
import SlideTransition from "../components/questionnaire/SlideTransition";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  white: "#FDFDFD",
  silver: "#F6F6F6",
};

const ScheduleCallScreen = ({ clientId, brokerName, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1 = day selection, 2 = time selection, 3 = custom date/time
  const [direction, setDirection] = useState("next");
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customDate, setCustomDate] = useState(new Date());
  const [customTime, setCustomTime] = useState(() => {
    // Initialize to 9:00 AM
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const dayOptions = ["Today", "Tomorrow", "Other"];
  const timeOptions = [
    { label: "Morning", range: "9AM - 12PM" },
    { label: "Afternoon", range: "12PM - 3PM" },
    { label: "Late afternoon", range: "3PM - 6PM" },
  ];

  const getMinTime = () => {
    const minTime = new Date();
    minTime.setHours(9, 0, 0, 0);
    return minTime;
  };

  const getMaxTime = () => {
    const maxTime = new Date();
    maxTime.setHours(17, 0, 0, 0);
    return maxTime;
  };

  const handleContinueFromDay = () => {
    if (selectedDay) {
      setDirection("next");
      if (selectedDay === "Other") {
        setCurrentStep(3); // Go to custom date/time picker
      } else {
        setCurrentStep(2); // Go to time selection
      }
    }
  };

  const handleBackFromTime = () => {
    setDirection("back");
    setCurrentStep(1);
  };

  const handleBackFromCustom = () => {
    setDirection("back");
    setCurrentStep(1);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setCustomDate(selectedDate);
    }
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    return maxDate;
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();

      // Only enforce 9 AM - 5 PM range, don't round
      let validatedHours = hours;
      let validatedMinutes = minutes;

      if (validatedHours < 9) {
        validatedHours = 9;
        validatedMinutes = 0;
      } else if (validatedHours > 17) {
        validatedHours = 17;
        validatedMinutes = 0;
      } else if (validatedHours === 17 && validatedMinutes > 0) {
        validatedMinutes = 0;
      }

      const validatedTime = new Date(selectedTime);
      validatedTime.setHours(validatedHours, validatedMinutes, 0, 0);

      setCustomTime(validatedTime);
    }
  };

  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "2-digit", hour12: true };
    return time.toLocaleTimeString("en-US", options);
  };

  const handleSubmit = async () => {
    if (!selectedDay || (!selectedTime && selectedDay !== "Other")) {
      Alert.alert("Missing Selection", "Please select both a day and time.");
      return;
    }

    setLoading(true);
    try {
      let dayValue, timeValue;

      // Convert day to actual date
      if (selectedDay === "Today") {
        dayValue = formatDate(new Date());
      } else if (selectedDay === "Tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dayValue = formatDate(tomorrow);
      } else if (selectedDay === "Other") {
        dayValue = formatDate(customDate);
      }

      // Convert time to actual time
      if (selectedTime === "Morning") {
        const morning = new Date();
        morning.setHours(9, 0, 0, 0);
        timeValue = formatTime(morning);
      } else if (selectedTime === "Afternoon") {
        const afternoon = new Date();
        afternoon.setHours(12, 0, 0, 0);
        timeValue = formatTime(afternoon);
      } else if (selectedTime === "Late afternoon") {
        const lateAfternoon = new Date();
        lateAfternoon.setHours(15, 0, 0, 0);
        timeValue = formatTime(lateAfternoon);
      } else if (selectedDay === "Other") {
        timeValue = formatTime(customTime);
      }

      const response = await fetch(
        `https://signup.roostapp.io/client/${clientId}/schedule-call`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferredDay: dayValue,
            preferredTime: timeValue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to schedule call");
      }

      const data = await response.json();

      // Call onComplete with scheduled details
      if (onComplete) {
        onComplete({
          day: dayValue,
          time: timeValue,
        });
      }
    } catch (error) {
      console.error("Error scheduling call:", error);
      Alert.alert(
        "Error",
        "Failed to schedule call. Please try again or contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <View style={{ width: "100%" }}>
          <Text style={styles.questionText}>
            Please select a day that work for you
          </Text>
          <View style={styles.optionsContainer}>
            {dayOptions.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.optionButton,
                  selectedDay === day && styles.selectedButton,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedDay === day && styles.selectedText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={{ width: "100%" }}>
          <Text style={styles.questionText}>
            Please select a time that work for you
          </Text>
          <View style={styles.optionsContainer}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time.label}
                style={[
                  styles.optionButton,
                  selectedTime === time.label && styles.selectedButton,
                ]}
                onPress={() => setSelectedTime(time.label)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedTime === time.label && styles.selectedText,
                  ]}
                >
                  {time.label}{" "}
                  <Text
                    style={[
                      styles.timeRangeText,
                      selectedTime === time.label && styles.selectedTimeRange,
                    ]}
                  >
                    {time.range}
                  </Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={{ width: "100%" }}>
          <Text style={styles.questionText}>Select date and time</Text>
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Date</Text>
            {Platform.OS === "ios" ? (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={customDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  maximumDate={getMaxDate()}
                  textColor={COLORS.black}
                  style={styles.iosPicker}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatDate(customDate)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={customDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    maximumDate={getMaxDate()}
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Time</Text>
            {Platform.OS === "ios" ? (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={customTime}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                  minimumDate={getMinTime()}
                  maximumDate={getMaxTime()}
                  textColor={COLORS.black}
                  style={styles.iosPicker}
                  minuteInterval={30}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatTime(customTime)}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={customTime}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                    minimumDate={getMinTime()}
                    maximumDate={getMaxTime()}
                    minuteInterval={30}
                  />
                )}
              </>
            )}
          </View>
        </View>
      );
    }
    return null;
  };

  const renderFooter = () => {
    if (currentStep === 1) {
      return (
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleContinueFromDay}
              variant="primary"
              disabled={!selectedDay}
              style={styles.continueButton}
            />
            {onBack && (
              <Button
                Icon={<BackButton width={26} height={26} color="#FFFFFF" />}
                onPress={onBack}
                variant="outline"
                style={styles.backButton}
              />
            )}
          </View>
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title="Schedule Call"
              onPress={handleSubmit}
              variant="primary"
              disabled={!selectedTime || loading}
              style={styles.continueButton}
            />
            <Button
              Icon={<BackButton width={26} height={26} color="#FFFFFF" />}
              onPress={handleBackFromTime}
              variant="outline"
              style={styles.backButton}
            />
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title="Schedule Call"
              onPress={handleSubmit}
              variant="primary"
              disabled={loading}
              style={styles.continueButton}
            />
            <Button
              Icon={<BackButton width={26} height={26} color="#FFFFFF" />}
              onPress={handleBackFromCustom}
              variant="outline"
              style={styles.backButton}
            />
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.logoContainer}>
            <Logo
              width={112}
              height={39}
              variant="black"
              style={styles.brandLogo}
            />
          </View>

          <View style={styles.content}>
            <View style={styles.contentWrapper}>
              <SlideTransition id={currentStep} direction={direction}>
                {renderStepContent()}
              </SlideTransition>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Footer */}
      {(Platform.OS === "ios" || true) && renderFooter()}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    paddingHorizontal: 48,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  brandLogo: {
    // Logo component will handle its own styling
  },
  contentWrapper: {
    maxWidth: 500,
    minWidth: 310,
    width: "100%",
    justifyContent: "center",
  },
  questionText: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0,
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
    textAlign: "left",
  },
  subQuestionText: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.slate,
    marginBottom: 24,
    textAlign: "left",
  },
  optionsContainer: {
    gap: 16,
    marginTop: 8,
    alignItems: "flex-start",
    width: "100%",
  },
  optionButton: {
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: COLORS.background,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    gap: 10,
    alignItems: "center",
    width: "auto",
    alignSelf: "flex-start",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: COLORS.green,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  selectedText: {
    color: COLORS.white,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: "#9BB9B9",
  },
  selectedTimeRange: {
    color: "#9BB9B9",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "15%",
    justifyContent: "center",
    backgroundColor: COLORS.black,
  },
  buttonContainer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    borderWidth: 0,
    backgroundColor: COLORS.black,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButton: {
    marginRight: 12,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  dateTimeButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  iosPickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    height: 150,
    overflow: "hidden",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  iosPicker: {
    height: 100,
  },
});

export default ScheduleCallScreen;