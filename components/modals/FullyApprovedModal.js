import React, { useState } from "react";
import axios from "axios";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

// Local COLORS (could import central palette if exported)
const COLORS = {
  green: "#377473",
  orange: "#F0913A",
  black: "#1D2327",
  gray: "#707070",
  lightGray: "#A9A9A9",
  white: "#FFFFFF",
  background: "#F6F6F6",
  overlay: "rgba(0,0,0,0.55)",
};

/**
 * FullyApprovedModal
 * Props:
 *  - visible (bool)
 *  - onClose () => void
 *  - details { amount, rate, lender, terms }
 *  - clientStatus (string) - current client status
 *  - fullyApprovedOptions (array) - lender options
 *  - clientId (string) - client ID for API calls
 *  - preApprovalAmount (number) - pre-approval amount
 *  - onRefresh (function) - refresh callback
 *  - actionLoading (bool) - loading state
 *  - onPurchasedPress () => void (optional)
 */
import { useClient } from "../../context/ClientContext";

const FullyApprovedModal = ({ 
  details = {}, 
  clientStatus,
  fullyApprovedOptions = [],
  clientId,
  preApprovalAmount,
  onRefresh,
  actionLoading,
  onPurchasedPress 
}) => {
  const { amount, rate, lender, terms, paperWorkRequested } = details || {};
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestResult, setRequestResult] = useState(null); // 'success' | 'error'
  const { clientInfo } = useClient();

  const formattedAmount = (preApprovalAmount || amount)
    ? Number(preApprovalAmount || amount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      })
    : "$0";

  // If status is BrokerSignoff, show the purchase button UI
  if (clientStatus === "BrokerSignoff") {
    // Find the selected option
    const selectedOption = fullyApprovedOptions.find(opt => opt.isSelected);
    
    return (
      <>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Fully Approved!</Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountText}>{formattedAmount}</Text>
        </View>
        
        <Text style={styles.displayMessage}>
          You are good to go! Once you've purchased a property come back and press
          the button below!
        </Text>

           
        {/* Display Selected Lender Option */}
        {selectedOption && (
          <View style={styles.selectedOptionCard}>
            <View style={styles.selectedOptionInfo}>
              <Text style={styles.selectedOptionRate}>
                {selectedOption.rate}% - {selectedOption.mortgageType || "Fixed"}
              </Text>
              <Text style={styles.selectedOptionMonthly}>
                ${parseInt(selectedOption.monthlyAmount || 0).toLocaleString()} monthly
              </Text>
              <Text style={styles.selectedOptionInstitution}>
                {selectedOption.institution}
              </Text>
            </View>
            <View style={styles.checkmarkCircle}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<Circle cx="12" cy="12" r="12" fill="#377473"/>
<Path d="M7 12L11 15.5L17.5 9" stroke="#FDFDFD" strokeWidth="2" strokeLinecap="round"/>
</Svg>

            </View>
          </View>
        )}

        {paperWorkRequested ? (
          <View style={styles.disabledButtonContainer}>
            <View style={styles.disabledButton} pointerEvents="none">
              <Text style={styles.disabledButtonText}>
                We are working on your paperwork
              </Text>
            </View>
            <Text style={styles.infoMessage}>
              We have requested some documents from your realtor, once we have
              them you'll receive an email requesting signatures.
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowConfirm(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Purchased a property</Text>
            </TouchableOpacity>

            {/* Confirmation Modal */}
            <Modal
              visible={showConfirm}
              animationType="fade"
              transparent
              onRequestClose={() => setShowConfirm(false)}
            >
              <View style={styles.overlay}>
                <View style={styles.confirmCard}>
                  <TouchableOpacity
                    style={styles.closeIconButton}
                    onPress={() => setShowConfirm(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Svg
                      width="25"
                      height="25"
                      viewBox="0 0 25 25"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <Path
                        d="M12.5 0C5.59687 0 0 5.59625 0 12.5C0 19.4037 5.59625 25 12.5 25C19.4037 25 25 19.4037 25 12.5C25 5.59625 19.4037 0 12.5 0ZM12.5 23.4625C6.46875 23.4625 1.5625 18.5312 1.5625 12.5C1.5625 6.46875 6.46875 1.5625 12.5 1.5625C18.5312 1.5625 23.4375 6.46875 23.4375 12.5C23.4375 18.5312 18.5312 23.4625 12.5 23.4625ZM16.9194 8.08125C16.6147 7.77656 16.12 7.77656 15.8147 8.08125L12.5006 11.3953L9.18656 8.08125C8.88187 7.77656 8.38656 7.77656 8.08125 8.08125C7.77594 8.38594 7.77656 8.88125 8.08125 9.18594L11.3953 12.5L8.08125 15.8141C7.77656 16.1187 7.77656 16.6141 8.08125 16.9188C8.38594 17.2234 8.88125 17.2234 9.18656 16.9188L12.5006 13.6047L15.8147 16.9188C16.1194 17.2234 16.6141 17.2234 16.9194 16.9188C17.2247 16.6141 17.2241 16.1187 16.9194 15.8141L13.6053 12.5L16.9194 9.18594C17.225 8.88062 17.225 8.38594 16.9194 8.08125Z"
                        fill="#A9A9A9"
                      />
                    </Svg>
                  </TouchableOpacity>
                  <Text style={styles.confirmTitle}>Amazing!</Text>
                  <Text style={styles.confirmMessage}>
                    Just confirm that you have a firm deal? If so, we will start
                    preparing the paperwork, please hold tight. Once its ready you
                    will receive an email.
                  </Text>
                  <View style={styles.confirmButtonsRow}>
                    <TouchableOpacity
                      style={[styles.solidButton, requesting && { opacity: 0.6 }]}
                      disabled={requesting}
                      onPress={async () => {
                        if (requesting) return;
                        const cId = clientId || clientInfo?.id || clientInfo?._id;
                        if (!cId) {
                          setRequestResult("error");
                          return;
                        }
                        setRequesting(true);
                        setRequestResult(null);
                        try {
                          await axios.post(
                            `https://signup.roostapp.io/admin/client/${cId}/request-paperwork`
                          );
                          setRequestResult("success");
                          onPurchasedPress && onPurchasedPress();
                          setTimeout(() => {
                            setShowConfirm(false);
                            setRequestResult(null);
                          }, 1500);
                        } catch (e) {
                          console.error(
                            "Paperwork request failed",
                            e?.response?.data || e.message
                          );
                          setRequestResult("error");
                        } finally {
                          setRequesting(false);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.solidButtonText}>
                        {requesting
                          ? "Sending..."
                          : requestResult === "success"
                          ? "Sent!"
                          : "Purchased"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={() => setShowConfirm(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.outlineButtonText}>Not yet</Text>
                    </TouchableOpacity>
                  </View>
                  {requestResult === "error" && (
                    <Text style={styles.errorText}>
                      Could not send request. Try again.
                    </Text>
                  )}
                </View>
              </View>
            </Modal>
          </>
        )}
      </>
    );
  }

  // Otherwise (FullyApproved status), show lender options
  return (
    <>
      <Text style={styles.title}>Fully Approved!</Text>
      <Text style={styles.amountText}>{formattedAmount}</Text>
      <Text style={styles.displayMessage}>
Select a mortgage that works best for you.      </Text>
      
      {/* Display Lender Options */}
      {fullyApprovedOptions && fullyApprovedOptions.length > 0 && (
        <View style={styles.lenderOptionsContainer}>
          {fullyApprovedOptions.map((option, index) => {
            const isSelected = option.isSelected;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.lenderOptionCard,
                  isSelected && styles.lenderOptionCardSelected
                ]}
                onPress={async () => {
                  if (isSelected) return; // Already selected

                  try {
                    const response = await axios.patch(
                      `http://159.203.58.60:5000/admin/client/${clientId}/select-lender-option`,
                      { optionIndex: index }
                    );

                    if (response.data.success) {
                      // Refresh data to get updated client info
                      onRefresh && await onRefresh();
                      Alert.alert("Success", "Lender option selected successfully!");
                    }
                  } catch (error) {
                    console.error("Error selecting lender option:", error);
                    Alert.alert("Error", "Failed to select lender option. Please try again.");
                  }
                }}
                disabled={isSelected || actionLoading}
              >
                {/* Left side - Info */}
                <View style={styles.lenderOptionInfo}>
                  <Text style={styles.lenderOptionRate}>
                    {option.rate}% - {option.mortgageType || "Fixed"}
                  </Text>
                  <Text style={styles.lenderOptionMonthly}>
                    ${parseInt(option.monthlyAmount || 0).toLocaleString()} monthly
                  </Text>
                  <Text style={styles.lenderOptionInstitution}>
                    {option.institution}
                  </Text>
                </View>

                {/* Right side - Button */}
                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>SELECTED</Text>
                  </View>
                ) : (
                  <View style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Select</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  displayMessage: {
    marginTop: 8,
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 14,
    textAlign: "left",
    color: "#797979",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
    marginBottom: 16,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabledButtonContainer: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    marginTop: 28,
    alignSelf: "flex-start",
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Futura",
  },
  disabledButton: {
    backgroundColor: "#E7E7E7",
    paddingVertical: 16,
    borderRadius: 50,
    marginTop: 28,
    alignItems: "center",
  },
  disabledButtonText: {
    color: "#A9A9A9",
    fontWeight: "700",
    fontSize: 12,
    fontFamily: "Futura",
  },
  infoMessage: {
    marginTop: 16,
    fontSize: 14,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontFamily: "Futura",
    color: COLORS.gray,
  },
  // Confirmation modal styles
  confirmCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 16,
    width: "100%",
    maxWidth: 480,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  closeIconButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  confirmTitle: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura",
    textAlign: "center",
    color: COLORS.black,
  },
  confirmMessage: {
    marginTop: 20,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Futura",
    textAlign: "center",
    color: COLORS.gray,
  },
  confirmButtonsRow: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    gap: 16,
  },
  outlineButton: {
    borderWidth: 1,
    width: "100%",
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  outlineButtonText: {
    color: COLORS.green,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Futura",
  },
  solidButton: {
    width: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  solidButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Futura",
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
    color: "#A20E0E",
    fontSize: 12,
    fontFamily: "Futura",
    fontWeight: "600",
  },
  // Lender options styles
  lenderOptionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  lenderOptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lenderOptionCardSelected: {
    borderColor: COLORS.green,
    borderWidth: 2,
    backgroundColor: "#F0FFF4",
  },
  lenderOptionInfo: {
    flex: 1,
    marginRight: 16,
  },
  lenderOptionRate: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
    marginBottom: 4,
  },
  selectedBadge: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: "center",
  },
  selectedBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  lenderOptionMonthly: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 4,
    fontFamily: "Futura",
  },
  lenderOptionInstitution: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.gray,
    fontFamily: "Futura",
  },
  selectButton: {
    backgroundColor: COLORS.green,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "center",
  },
  selectButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  // Selected option card styles for BrokerSignoff status
  selectedOptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedOptionInfo: {
    flex: 1,
    marginRight: 16,
  },
  selectedOptionRate: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
    marginBottom: 4,
  },
  selectedOptionMonthly: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 4,
    fontFamily: "Futura",
  },
  selectedOptionInstitution: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.gray,
    fontFamily: "Futura",
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default FullyApprovedModal;
