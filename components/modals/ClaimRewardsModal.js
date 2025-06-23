import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../styles/index";
import ClientSelector from "../icons/ClientSelector";
import Svg, {
  Path,
  Mask,
  G,
  Pattern,
  Use,
  Defs,
  Image as SvgImage,
  Circle,
} from "react-native-svg";

const POINTS_TO_DOLLARS = 1; // Assuming this constant is used as in the parent component

const ClaimRewardsModal = ({
  claimModal,
  setClaimModal,
  setClaimLoading,
  selectedReward,
  setSelectedReward,
  currentPoints,
  invitedClients,
  handleClaimReward,
  claimLoading,
  addressConfirmation,
  setAddressConfirmation,
  selectedClientData,
  realtor,
  addressToSend,
  setAddressToSend,
  submitRewardClaim,
  selectedClient,
  setSelectedClient,
  styles, // Pass styles from parent component
}) => {
  // No need for local state as it's passed from parent

  return (
    <>
      {/* Claim Reward Modal */}
      <Modal
        visible={
          claimModal && selectedReward !== null && addressConfirmation === false
        }
        transparent
        animationType="fade"
        onRequestClose={() => setClaimModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={localStyles.claimModal}>
            <TouchableOpacity
              style={localStyles.closeButton}
              onPress={() => {
                setClaimModal(false);
                setSelectedReward(null);
              }}
            >
              <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                <Circle cx="18.5" cy="18.5" r="18.5" fill="#FFFFFF" />
                <Circle cx="18.5" cy="18.5" r="17.5" fill="#FDFDFD" />
                <Path
                  d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                  fill="#A9A9A9"
                />
              </Svg>
            </TouchableOpacity>
            {selectedReward && (
              <>
                {/* Image first at the top */}
                {selectedReward.imageUrl ? (
                  <Image
                    source={{
                      uri: `http://159.203.58.60:5000${selectedReward.imageUrl}`,
                    }}
                    style={localStyles.giftImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={localStyles.svgContainer}>
                    <Svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 191 92"
                      fill="none"
                      style={localStyles.fallbackSvg}
                    >
                      <Mask
                        id="mask0_1568_1502"
                        style={{ maskType: "alpha" }}
                        maskUnits="userSpaceOnUse"
                        x={0}
                        y={0}
                        width={191}
                        height={92}
                      >
                        <Path
                          d="M0 8C0 3.58172 3.58172 0 8 0H183C187.418 0 191 3.58172 191 8V92H0V8Z"
                          fill="#2271B1"
                        />
                      </Mask>
                      <G mask="url(#mask0_1568_1502)">
                        <Path
                          d="M-27.1367 8.00001C-27.1367 3.58173 -23.555 0 -19.1367 0H251.885C256.303 0 259.885 3.58172 259.885 8V187.067H-27.1367V8.00001Z"
                          fill="url(#pattern0_1568_1502)"
                        />
                      </G>
                      <Defs>
                        <Pattern
                          id="pattern0_1568_1502"
                          patternContentUnits="objectBoundingBox"
                          width={1}
                          height={1}
                        >
                          <Use
                            xlinkHref="#image0_1568_1502"
                            transform="matrix(0.00363636 0 0 0.00557938 0 -0.0105133)"
                          />
                        </Pattern>
                        <SvgImage
                          id="image0_1568_1502"
                          width={275}
                          height={183}
                          preserveAspectRatio="none"
                          href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARMAAAC3CAYAAAAxU7r0AAAAAXNSR0IArs4c6QAAIABJREFUeF6M3QnUv/lc//Hv3YZKRaIFRVIiKSlKJBJaLJH9yFahJKLl6JQiDmqEpJApk6GxMwzGMpixNkNkKWuSpZT2ou7/eXzO7/k977n+9z3c59znu1zX9fm8P+/l9d4+1/U9ePWrX3343//933ef+cxndl/4wi/c+fvf//3f3X/+53/uLn7xi+/+/d//fff5n//563t/BwcH+3P+4z/+Y/d5n/d5u3/5l3/ZfdmXfdnui77oi3bPfvazdx/84AfXGK5zzDn+7nKXu+wue9nL7p7xjGfsrnWta+2+7uu+bvf+979/9+IXv3h3kYtcZGe8C1/4wrtPf/rT69h3fMd3rGsPDw/3c0cLes1zzCc+8YlF+yc/+cneud71rv3//M//rGP7/+Z3/MIf7//u//7vXGl8+++3OOYI//rv//7v7j//8z/X+a64QVr/Guf61jwewyu/+strnvFjf+/ve5wO/Xta473mNU+9ytqX//lf/vnuUpe+1N77r/zar+wufZlLr3PNO7/xw517d7nLXXYXu9jF9p///d//vvninOtCx8X256GL/ehCj7k2n67n89nPftp95StfueRFNnoO3fne/3Pac800v5+Hy/Gm+rnmfvnLl3WOcXwXsLL9G+N0HnrR5ng+o/2+e5KNDnRvbdaLu97Fc/8+necarcyP/5oJLfj49re/ffzN8Wvn3e9ed9vl3HN++Yf5Zbnz2amvnDHazEePeS8e/svar3nNa5ZsG8vYS06+RzP6zcmRGTNb2maKf92Lt5+T7Thfv8kXvbIN9Mw56UIu+rpxt37X9dc1aMA7vGxO9DnG+GTPeTgXfefraRZHPYZm/oBP5GscvHDet771rVvcbqFvqpu88847L3fJ5EB+CI05x2BvHnhint0vdCK+zkXnVkRrEHgxbx4UQfPz4X7hb0KF9IN9e/CDH3y5QduMOEcbzn7ta19bMPvPf/7nHuz+1m/91uWOsReImFAb+fvf//4+vHM3f//3f/8i6P/1v/7XxaCHHnrobzu+/OUvL8F8+9vfXvf6nd/5ndNd73bXZSg2vmL+rknBbvva17628waHzvc33fnP//zP++/8zu/sr/O7v/u7+3e9613L6P/t3/7tMoD73Oc++1e/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"
                        />
                      </Defs>
                    </Svg>
                  </View>
                )}
                {/* Title and points below the image */}
                <Text style={localStyles.giftTitle}>
                  {selectedReward.rewardName?.toUpperCase()}
                </Text>
                <Text style={localStyles.pointsText}>
                  {Math.ceil(selectedReward.rewardAmount / POINTS_TO_DOLLARS) +
                    " "}
                  PTS
                </Text>
                <View style={localStyles.descriptionContainer}>
                  {selectedReward.description &&
                    selectedReward.description
                      .split("\n")
                      .map((item, index) => (
                        <Text key={index} style={localStyles.descriptionItem}>
                          {item.trim() || "Heritage Bee Soap"}
                        </Text>
                      ))}
                </View>
                {selectedReward.rewardFor === "Clients" && (
                  <View style={localStyles.clientSelectorWrapper}>
                    <ClientSelector
                      selectedValue={selectedClient}
                      onValueChange={(v) => setSelectedClient(v)}
                      items={(invitedClients || [])
                        .filter(
                          (c) =>
                            c.status === "ACCEPTED" && c.clientAddress !== null
                        )
                        .map((c) => ({
                          label: c.referenceName,
                          value: c._id,
                        }))}
                      placeholder="Select a client"
                    />
                  </View>
                )}
                <View style={localStyles.buttonContainer}>
                  <TouchableOpacity
                    style={localStyles.passButton}
                    onPress={() => {
                      setClaimModal(false);
                      setSelectedReward(null);
                    }}
                  >
                    <Text style={localStyles.passButtonText}>Pass</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localStyles.sendButton,
                      (!selectedClient &&
                        selectedReward.rewardFor === "Clients") ||
                      currentPoints <
                        Math.ceil(
                          selectedReward.rewardAmount / POINTS_TO_DOLLARS
                        )
                        ? localStyles.sendButtonDisabled
                        : {},
                    ]}
                    disabled={
                      claimLoading ||
                      (selectedReward.rewardFor === "Clients" &&
                        !selectedClient) ||
                      currentPoints <
                        Math.ceil(
                          selectedReward.rewardAmount / POINTS_TO_DOLLARS
                        )
                    }
                    onPress={handleClaimReward}
                  >
                    {claimLoading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={localStyles.sendButtonText}>Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Address Confirmation Modal */}
      <Modal
        visible={
          addressConfirmation &&
          (selectedClientData !== null ||
            selectedReward?.rewardFor === "Realtors")
        }
        transparent
        animationType="fade"
        onRequestClose={() => setAddressConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addressModal}>
            <TouchableOpacity
              style={localStyles.closeButton}
              onPress={() => {
                setAddressConfirmation(false);
                setClaimModal(false);
                setSelectedReward(null);
              }}
            >
              <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                <Circle cx="18.5" cy="18.5" r="18.5" fill="#FFFFFF" />
                <Circle cx="18.5" cy="18.5" r="17.5" fill="#FDFDFD" />
                <Path
                  d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                  fill="#A9A9A9"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={localStyles.addressModalTitle}>
              Confirm Shipping Address
            </Text>
            <Text style={localStyles.addressModalSubtitle}>
              {`Please confirm or edit the address for `}
              <Text style={localStyles.boldText}>
                {selectedReward?.rewardFor === "Clients"
                  ? selectedClientData?.referenceName
                  : realtor?.name || "yourself"}
              </Text>
            </Text>

            <Text style={styles.label}>Address:</Text>
            <TextInput
              style={styles.input}
              value={addressToSend.address}
              onChangeText={(text) =>
                setAddressToSend((prev) => ({ ...prev, address: text }))
              }
            />
            <Text style={styles.label}>City:</Text>
            <TextInput
              style={styles.input}
              value={addressToSend.city}
              onChangeText={(text) =>
                setAddressToSend((prev) => ({ ...prev, city: text }))
              }
            />
            <Text style={styles.label}>Postal Code:</Text>
            <TextInput
              style={styles.input}
              value={addressToSend.postalCode}
              onChangeText={(text) =>
                setAddressToSend((prev) => ({ ...prev, postalCode: text }))
              }
              keyboardType="numeric"
            />
            <View style={localStyles.addressButtonsRow}>
              <TouchableOpacity
                style={localStyles.cancelButton}
                onPress={() => {
                  setAddressConfirmation(false);
                  setClaimModal(false);
                  setSelectedReward(null);
                }}
              >
                <Text style={localStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  localStyles.confirmButton,
                  claimLoading && localStyles.buttonDisabled,
                ]}
                onPress={async () => {
                  setClaimLoading(true);
                  try {
                    await submitRewardClaim();
                  } catch (e) {
                    console.error(e);
                  }
                  setClaimLoading(false);
                }}
                disabled={claimLoading}
              >
                {claimLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={localStyles.confirmButtonText}>
                    Confirm & Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const localStyles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: -8, // Half of the circle height (37/2) to position it 50% outside
    right: -8, // Half of the circle width (37/2) to position it 50% outside
    zIndex: 10,
  },

  addressModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Futura",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
    color: COLORS.black,
  },
  addressModalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: "#666666",
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 16,
  },

  boldText: {
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.black,

    fontSize: 14,
  },

  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  claimModal: {
    width: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 0, // No padding at the top to allow image to extend to edges
    alignItems: "center",
    maxHeight: "90%",
    overflow: "visible",
    marginTop: 18.5, // Add top margin to account for close button overlay
  },
  giftTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Futura",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
    color: COLORS.black,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Futura",
    color: "#707070",
    marginBottom: 10,
  },
  giftImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 0,
  },
  addressButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  svgContainer: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 0,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
  fallbackSvg: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  descriptionContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  descriptionItem: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: "#707070",
    marginVertical: 4,
    textAlign: "center",
    lineHeight: 22,
  },
  noteText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Futura",
    color: "#666666",
    marginTop: 20,
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  clientSelectorWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 0,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  passButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    height: 50,
  },
  passButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  sendButton: {
    backgroundColor: COLORS.green,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
    height: 50,
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  sendButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.white,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    backgroundColor: "transparent",
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    flex: 117,
    minWidth: 87,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  confirmButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    flex: 299,
    minWidth: 117,
    marginLeft: 10,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.white,
  },
});

export default ClaimRewardsModal;
