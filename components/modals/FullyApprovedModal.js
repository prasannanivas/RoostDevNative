import React, { useState } from "react";
import axios from "axios";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Svg, { Path } from "react-native-svg";

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
 *  - onPurchasedPress () => void (optional)
 */
import { useClient } from "../../context/ClientContext";

const FullyApprovedModal = ({ details = {}, onPurchasedPress }) => {
  const { amount, rate, lender, terms, paperWorkRequested } = details || {};
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestResult, setRequestResult] = useState(null); // 'success' | 'error'
  const { clientInfo } = useClient();

  const formattedAmount = amount
    ? Number(amount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      })
    : "$0";

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Fully Approved!</Text>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountText}>{formattedAmount}</Text>
        {/* {!!rate && <Text style={styles.rateInline}>Fixed {Number(rate)}%</Text>} */}
      </View>
      {/* {!!lender && <Text style={styles.lenderText}>Lender: {lender}</Text>} */}

      {/* <Text style={styles.termsHeader}>Terms (if any)</Text>
      <ScrollView style={styles.termsWrapper} nestedScrollEnabled>
        <Text style={styles.termsText}>{terms}</Text>
      </ScrollView> */}
      <Text style={styles.displayMessage}>
        You are good to go! Once you’ve purchased a property come back and press
        the button below!
      </Text>

      {paperWorkRequested ? (
        <View style={styles.disabledButtonContainer}>
          <View style={styles.disabledButton} pointerEvents="none">
            <Text style={styles.disabledButtonText}>
              We are working on your paperwork
            </Text>
          </View>
          <Text style={styles.infoMessage}>
            We have requested some documents from your realtor, once we have
            them you’ll receive an email requesting signatures.
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
                    style={styles.outlineButton}
                    onPress={() => setShowConfirm(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.outlineButtonText}>Not yet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.solidButton, requesting && { opacity: 0.6 }]}
                    disabled={requesting}
                    onPress={async () => {
                      if (requesting) return;
                      const clientId = clientInfo?.id || clientInfo?._id;
                      if (!clientId) {
                        setRequestResult("error");
                        return;
                      }
                      setRequesting(true);
                      setRequestResult(null);
                      try {
                        await axios.post(
                          `https://signup.roostapp.io/admin/client/${clientId}/request-paperwork`
                        );
                        setRequestResult("success");
                        // Optionally invoke callback
                        onPurchasedPress && onPurchasedPress();
                        // Auto close after short delay
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
    marginTop: 16,
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 14,
    textAlign: "left",
    color: "#797979",
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: "100%",
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    marginRight: 12,
    flex: 1,
  },
  rateText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.gray,
  },
  amountText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rateInline: {
    marginLeft: 12,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.gray,
  },
  lenderText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Futura",
    color: COLORS.gray,
  },
  termsHeader: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 4,
  },
  disabledButtonContainer: {
    padding: 16,
  },
  termsWrapper: {
    marginTop: 16,
    maxHeight: 140,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Futura",
    color: COLORS.gray,
  },
  readMore: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Futura",
    fontWeight: "700",
    color: COLORS.green,
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
    fontWeight: 700,
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
  closeLink: {
    marginTop: 16,
    alignItems: "center",
  },
  closeLinkText: {
    color: COLORS.green,
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "Futura",
  },
  // Confirmation modal styles
  confirmCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 32,
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
  },
  closeIconText: {
    fontSize: 26,
    lineHeight: 26,
    color: COLORS.lightGray,
    fontWeight: "300",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    gap: 16,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
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
    fontSize: 12,
    fontFamily: "Futura",
  },
  solidButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  solidButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
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
});

export default FullyApprovedModal;
