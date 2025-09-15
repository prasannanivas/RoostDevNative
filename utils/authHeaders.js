import AsyncStorage from "@react-native-async-storage/async-storage";

// Returns an object with Authorization header if accessToken exists
export const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (e) {
    console.warn("Failed to read accessToken from storage", e);
  }
  return {};
};

export default getAuthHeaders;
