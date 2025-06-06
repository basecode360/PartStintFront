// src/utils/getValidAuthToken.js
import apiService from '../api/apiService';

export default async function getValidAuthToken() {
  // 1) Grab our “app user” ID from localStorage (populated on login)
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    throw new Error(
      'No user_id found in localStorage. Please log in first so we know which eBay account to refresh.'
    );
  }

  try {
    // 2) Call our backend to get a valid eBay user token (refresh if needed)
    //    We expect our backend endpoint /auth/token to return:
    //      { success: true, auth_token: "<ebay_access_token>", expires_at: "...", expires_in_seconds: N, token_type:"user_token" }
    const resp = await apiService.auth.getEbayUserToken(userId);

    if (!resp.success) {
      throw new Error(
        resp.error || resp.message || 'Failed to fetch eBay user token'
      );
    }

    const ebayToken = resp.auth_token;
    if (!ebayToken) {
      throw new Error('Backend did not return an eBay user token');
    }

    // 3) Store in localStorage so that API calls can pick it up later
    localStorage.setItem('ebay_user_token', ebayToken);

    // 4) Return the fresh eBay token
    return ebayToken;
  } catch (err) {
    console.error('Error in getValidAuthToken:', err);
    throw err;
  }
}
