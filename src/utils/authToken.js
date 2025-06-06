// src/utils/getValidAuthToken.js
import apiService from "../api/apiService";
import { useProductStore } from "../store/productStore";
import { usetokenStore } from "../store/tokenStore";

const getValidAuthToken = async () => {
  const { accessToken, modifyAuthToken } = usetokenStore.getState();

  const session = sessionStorage.getItem("product-store-access-token");
  if (session) {
    const { expiry, value } = JSON.parse(session);
    console.log(`expiry => ${Date.now()}`);
    if (Date.now() < expiry && value) {
      return accessToken; // ✅ Token is still valid
    }
  }

  // ❌ Expired or missing — call API and wait
  try {
    const response = await apiService.auth.getAuthToken();
    if (response.success) {
      console.log("✅ Fetched new auth token:", response.auth_token);
      modifyAuthToken(response.auth_token);
      return response.auth_token;
    } else {
      throw new Error("Failed to fetch new auth token");
    }
  } catch (err) {
    console.error("❌ Token fetch error:", err);
    throw err;
  }
};

export default getValidAuthToken;
