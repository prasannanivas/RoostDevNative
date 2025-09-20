import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import LottieView from "lottie-react-native";
import CloseIconSvg from "../icons/CloseIconSvg";
import Button from "../common/Button";
import WebView from "react-native-webview";

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
  const [webViewHeight, setWebViewHeight] = useState(1);
  const hasMessages = messages.length > 0;
  const msg = hasMessages ? messages[currentIndex] : null;
  const htmlContent = msg?.HTMLContent;
  console.log("HTMLContent:", htmlContent);
  return (
    <Modal
      visible={visible && hasMessages}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.closeButtonContainer}>
            <Button
              title={"Don't show this again"}
              onPress={onAcknowledge}
              disabled={loading}
              loading={loading}
              variant="gray"
              style={styles.dontShowAgainBtn}
            />
            <TouchableOpacity onPress={onRequestClose} activeOpacity={0.7}>
              <CloseIconSvg
                width={25}
                height={25}
                color={colors.title}
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>

          {msg && (
            <>
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.contentScrollContainer}
                showsVerticalScrollIndicator
              >
                {/* Optional Lottie animation (JSON object) */}
                {msg.lottieJson || msg.lottieJSON ? (
                  <LottieView
                    source={msg.lottieJson || msg.lottieJSON}
                    autoPlay
                    loop={true}
                    style={styles.lottie}
                  />
                ) : null}

                {/* Optional image (supports base64 data URI) */}
                {msg.imageUrl || msg.imageURL ? (
                  <Image
                    source={{ uri: msg.imageUrl || msg.imageURL }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : null}

                {msg.title ? (
                  <Text style={[styles.title, { color: colors.title }]}>
                    {msg.title}
                  </Text>
                ) : null}

                {msg.message ? (
                  <Text style={[styles.body, { color: colors.body }]}>
                    {msg.message}
                  </Text>
                ) : null}

                {htmlContent ? (
                  <WebView
                    style={[styles.webView, { height: webViewHeight }]}
                    originWhitelist={["*"]}
                    scrollEnabled={false}
                    onMessage={(event) => {
                      const h = Number(event?.nativeEvent?.data);
                      if (!Number.isNaN(h) && h > 0 && h !== webViewHeight) {
                        setWebViewHeight(h);
                      }
                    }}
                    injectedJavaScript={`(function() {
                      function postHeight() {
                        var body = document.body;
                        var html = document.documentElement;
                        var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                        window.ReactNativeWebView.postMessage(String(height));
                      }
                      window.addEventListener('load', postHeight);
                      window.addEventListener('resize', postHeight);
                      setTimeout(postHeight, 50);
                    })(); true;`}
                    source={{
                      html: `<!doctype html>
                          <html>
                            <head>
                              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                              <style>
                                :root { color-scheme: light; }
                                html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
                                body { font-family: Futura, -apple-system, Roboto, Arial, sans-serif; color: ${colors.body}; }
                                h1, h2, h3 { color: ${colors.title}; text-align: center; margin: 0 0 12px; }
                                h1 { font-size: 22px; font-weight: 700; }
                                h2 { font-size: 20px; font-weight: 700; }
                                h3 { font-size: 18px; font-weight: 700; }
                                p { font-size: 14px; line-height: 20px; margin: 0 0 8px; text-align: center; }
                                ul, ol { margin: 6px 16px; padding: 0 0 0 16px; }
                                li { font-size: 14px; line-height: 20px; margin-bottom: 4px; }
                                a { color: ${colors.primary}; text-decoration: underline; }
                                img, video { max-width: 100%; height: auto; }
                                .container { padding: 0 8px 8px; }
                              </style>
                            </head>
                            <body>
                              <div class="container">${htmlContent}</div>
                            </body>
                          </html>`,
                    }}
                  />
                ) : null}
              </ScrollView>

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
  },
  container: {
    width: "100%",
    height: "80%",
    position: "absolute",
    bottom: 0,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonContainer: {
    width: "100%",
    height: "48",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dontShowAgainBtn: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#707070",
  },
  closeIcon: {},
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
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Futura",
    paddingBottom: 8,
  },
  contentScroll: {
    flex: 1,
    position: "absolute",
    top: 82,
    bottom: 82,
    left: 24,
  },
  contentScrollContainer: {
    paddingBottom: 200, // ensure content not hidden behind ack button
  },
  ackBtn: {
    position: "absolute",
    bottom: 62,
    left: 24,
    right: 24,
    backgroundColor: "#377473",
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
    minHeight: "223",
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },
  lottie: {
    width: "100%",
    minHeight: "223",
    marginBottom: 16,
    alignSelf: "center",
  },
  webView: {
    width: "100%",
    backgroundColor: "transparent",
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
