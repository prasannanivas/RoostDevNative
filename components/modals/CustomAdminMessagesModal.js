import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import LottieView from "lottie-react-native";

const CustomAdminMessagesModal = ({
  visible,
  messages = [],
  currentIndex = 0,
  onAcknowledge,
  onRequestClose,
  loading = false,
  colors = {
    backdrop: "rgba(0,0,0,0.5)",
    surface: "#FDFDFD",
    title: "#1D2327",
    body: "#1D2327",
    primary: "#377473",
    primaryText: "#FDFDFD",
    counter: "#707070",
  },
  ackButtonFallbackLabel = "OK",
}) => {
  const hasMessages = messages.length > 0;
  const msg = hasMessages ? messages[currentIndex] : null;
  return (
    <Modal
      visible={visible && hasMessages}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {msg && (
            <>
              {/* Optional Lottie animation (JSON object) */}

              {/* Optional image (supports base64 data URI) */}
              {msg.title ? (
                <Text style={[styles.title, { color: colors.title }]}>
                  {" "}
                  {msg.title}{" "}
                </Text>
              ) : null}
              {msg.message ? (
                <Text style={[styles.body, { color: colors.body }]}>
                  {" "}
                  {msg.message}{" "}
                </Text>
              ) : null}

              {msg.lottieJson || msg.lottieJSON ? (
                <LottieView
                  source={msg.lottieJson || msg.lottieJSON}
                  autoPlay
                  loop={true}
                  style={styles.lottie}
                />
              ) : null}
              {msg.imageUrl || msg.imageURL ? (
                <Image
                  source={{ uri: msg.imageUrl || msg.imageURL }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : null}
              <TouchableOpacity
                style={[
                  styles.ackBtn,
                  { backgroundColor: msg.ackButtonColor || "#377473" },
                ]}
                onPress={onAcknowledge}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <Text style={[styles.ackText, { color: colors.primaryText }]}>
                    {msg.ackButtonName || ackButtonFallbackLabel}
                  </Text>
                )}
              </TouchableOpacity>
              {/* Counter intentionally removed per new UX: do not show 1/2, 2/2 etc. */}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Futura",
  },
  body: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Futura",
  },
  ackBtn: {
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  ackText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  image: {
    width: "100%",
    height: 180,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },
  lottie: {
    width: "100%",
    height: 180,
    marginBottom: 16,
    alignSelf: "center",
  },
  // counter style retained (commented) in case reintroduced later
  // counter: {
  //   marginTop: 12,
  //   fontSize: 12,
  //   textAlign: "center",
  //   fontWeight: "500",
  //   fontFamily: "Futura",
  // },
});

export default CustomAdminMessagesModal;
