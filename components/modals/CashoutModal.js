import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import Svg, { Path } from "react-native-svg";

const CashoutModal = ({
  visible,
  points,
  brokerageAddress = {},
  showAddressConfirm = false,
  onConfirm,
  onCancel,
  onRequestClose,
  onShowAddressConfirm,
  onFinalConfirm,
}) => {
  // Check for missing fields
  const missingFields = [];
  if (!brokerageAddress.name) missingFields.push("Brokerage Name");
  if (!brokerageAddress.address) missingFields.push("Address");
  if (!brokerageAddress.city) missingFields.push("City");
  if (!brokerageAddress.postalCode) missingFields.push("Postal Code");
  const hasMissing = missingFields.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onRequestClose || onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onRequestClose || onCancel}
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
          <Text style={styles.title}>Cashout</Text>
          <Text style={styles.pointsText}>
            <Text style={styles.points}>{points} pts</Text> ={" "}
            <Text style={styles.dollars}>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(points)}
            </Text>
          </Text>
          {!showAddressConfirm ? (
            <>
              <Text style={styles.description}>
                All your points will be converted to cash and sent to your
                brokerage for them to distribute to you
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.noButton} onPress={onCancel}>
                  <Text style={styles.noButtonText}>No thanks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={onShowAddressConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.description}>
                Funds will be sent to your brokerage address:
              </Text>
              <View style={{ marginBottom: 20, alignItems: "center" }}>
                <Text style={styles.brokerageName}>
                  {brokerageAddress.name}
                </Text>
                <Text style={styles.addressLine}>
                  {brokerageAddress.address}
                </Text>
                <Text style={styles.addressLine}>
                  {brokerageAddress.city} {brokerageAddress.postalCode}
                </Text>
              </View>
              {hasMissing && (
                <Text style={styles.errorText}>
                  {`Following fields have been missing: 
${missingFields.join(", ")}
Please go to your profile and fill them out to claim.`}
                </Text>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.noButton} onPress={onCancel}>
                  <Text style={styles.noButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    hasMissing && styles.disabledButton,
                  ]}
                  onPress={onFinalConfirm}
                  disabled={hasMissing}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fdfdfd",
    borderRadius: 16,
    padding: 32,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },

  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fdfdfd",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#888",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1D2327",
  },
  pointsText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#377473",
    marginBottom: 12,
  },
  points: {
    fontWeight: "bold",
    color: "#377473",
  },
  dollars: {
    fontWeight: "bold",
    color: "#377473",
  },
  description: {
    fontSize: 14,
    color: "#707070",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 28,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    width: "100%",
    marginTop: 8,
  },
  noButton: {
    borderWidth: 2,
    minWidth: 116,
    borderColor: "#377473",
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    backgroundColor: "#fdfdfd",
    alignItems: "center",
  },
  noButtonText: {
    color: "#377473",
    fontWeight: "700",
    fontSize: 12,
  },
  confirmButton: {
    borderWidth: 2,
    borderColor: "#377473",
    minWidth: 98,
    backgroundColor: "#377473",
    borderRadius: 33,
    paddingHorizontal: 24,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fdfdfd",
    fontWeight: "700",
    fontSize: 12,
  },
  brokerageName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1D2327",
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 16,
    color: "#707070",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CashoutModal;
