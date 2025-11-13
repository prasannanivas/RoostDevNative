import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import getAuthHeaders from "../utils/authHeaders";

export default function DeleteAccountModal({
  visible,
  onCancel,
  onDeleted,
  type = "client", // 'client' or 'realtor'
  id,
  COLORS,
  onLogout,
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const base = "https://signup.roostapp.io";

  const required = "delete";

  const matches = text.trim().toLowerCase() === required;
  const handleConfirm = async () => {
    setError("");
    if (!matches) {
      setError('Please type "Delete" to confirm.');
      return;
    }

    setLoading(true);
    try {
      const url = `${base}/admin/${type}/${id}`;
      console.log(`Sending DELETE request to: ${url}`);
      // Read authorization header (if token stored) and send with request
      const authHeaders = await getAuthHeaders();
      if (!authHeaders.Authorization) {
        console.warn(
          "No access token found; proceeding without Authorization header"
        );
      }
      // Use axios to allow consistency with clients that use axios
      await axios.delete(url, { headers: authHeaders });

      if (onLogout) await onLogout();
      if (onDeleted) onDeleted();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: COLORS?.white || "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: Platform.OS === "ios" ? 40 : 24,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: COLORS?.black || "#202020",
                textAlign: "center",
                fontFamily: "Futura",
                marginBottom: 16,
              }}
            >
              Delete my account?!
            </Text>
            <Text
              style={{
                color: COLORS?.slate || "#666",
                marginBottom: 14,
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {type === "client"
                ? "Are you sure? All your info will be deleted and you will have to start over"
                : "Are you sure? You will lose access to all your info, your client's info and any remaining points"}
            </Text>

            <Text
              style={{
                color: COLORS?.slate || "#666",
                fontWeight: "500",
                fontSize: 14,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Type "DELETE" to confirm.
            </Text>

            {/* Live spelling guidance */}
            {text.length > 0 && !matches ? (
              <Text
                style={{
                  color: COLORS?.red || "#a00",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Mismatch spelling. Type "DELETE".
              </Text>
            ) : null}
            {error ? (
              <Text
                style={{
                  color: COLORS?.red || "#a00",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            ) : null}

            <TextInput
              placeholder='Type "Delete" then press Enter'
              value={text}
              onChangeText={(t) => {
                setText(t);
                if (error) setError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: COLORS?.gray || "#ccc",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 12,
              }}
              onSubmitEditing={handleConfirm}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  backgroundColor: matches && !loading ? "#A20E0E" : "#E8E8E8",
                  borderRadius: 33,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginRight: 8,
                }}
                disabled={!matches || loading}
              >
                <Text
                  style={{
                    color: matches && !loading ? "#fff" : "#797979",
                    fontFamily: "Futura",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {loading ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.green,
                  borderRadius: 33,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS?.green,
                    fontFamily: "futura",
                    fontWeight: "700",
                    fontSize: "12",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
