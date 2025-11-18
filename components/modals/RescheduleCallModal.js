import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  white: "#FDFDFD",
};

const RescheduleCallModal = ({ visible, onClose, onReschedule, clientId }) => {
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    return maxDate;
  };

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

  const validateTime = (selectedTime) => {
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
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
    return validatedTime;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setRescheduleDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const validatedTime = validateTime(selectedTime);
      setRescheduleTime(validatedTime);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleConfirm = async () => {
    setRescheduling(true);
    try {
      // First clear the existing schedule
      const clearResponse = await fetch(
        `https://signup.roostapp.io/client/${clientId}/clear-call-schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!clearResponse.ok) {
        throw new Error("Failed to clear schedule");
      }

      // Then schedule the new call
      const scheduleResponse = await fetch(
        `https://signup.roostapp.io/client/${clientId}/schedule-call`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferredDay: formatDate(rescheduleDate),
            preferredTime: formatTime(rescheduleTime),
          }),
        }
      );

      if (!scheduleResponse.ok) {
        throw new Error("Failed to schedule call");
      }

      onClose();
      if (onReschedule) {
        await onReschedule();
      }
      Alert.alert(
        "Call Rescheduled",
        `Your call has been rescheduled for ${formatTime(
          rescheduleTime
        )} on ${formatDate(rescheduleDate)}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error rescheduling call:", error);
      Alert.alert("Error", "Failed to reschedule. Please try again.");
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Reschedule Call</Text>
          <Text style={styles.modalSubTitle}>
            Select a new date and time for your call
          </Text>

          {/* Date Picker */}
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Date</Text>
            {Platform.OS === "ios" ? (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={rescheduleDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
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
                    {formatDate(rescheduleDate)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={rescheduleDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    maximumDate={getMaxDate()}
                  />
                )}
              </>
            )}
          </View>

          {/* Time Picker */}
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Time</Text>
            {Platform.OS === "ios" ? (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={rescheduleTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
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
                    {formatTime(rescheduleTime)}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={rescheduleTime}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                    minimumDate={getMinTime()}
                    maximumDate={getMaxTime()}
                    minuteInterval={30}
                  />
                )}
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={rescheduling}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={rescheduling}
            >
              {rescheduling ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
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
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 8,
    fontFamily: "Futura",
    textAlign: "center",
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate,
    marginBottom: 24,
    fontFamily: "Futura",
    textAlign: "center",
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  dateTimeButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  iosPickerContainer: {
    backgroundColor: COLORS.background,
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
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.slate,
  },
  cancelButtonText: {
    color: COLORS.slate,
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Futura",
  },
  confirmButton: {
    backgroundColor: COLORS.green,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Futura",
  },
});

export default RescheduleCallModal;
