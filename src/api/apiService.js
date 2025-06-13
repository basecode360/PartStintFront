// src/api/apiService.js
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // e.g. http://localhost:5000
const API_KEY = import.meta.env.VITE_X_API_KEY; // (for sync routes)

/** ——————————— AUTH CLIENT ——————————— **/
const authClient = axios.create({
  baseURL: `${BACKEND_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** ——————————— EBAY CLIENT ——————————— **/
const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api/ebay`,
});

const pricingClient = axios.create({
  baseURL: `${BACKEND_URL}/api/pricing-strategies`,
});

const competitorClient = axios.create({
  baseURL: `${BACKEND_URL}/api/competitor-rules`,
});

/** ————————— UTILITY: Attach eBay user‐token ————————— **/
function getRawEbayTokenFromStorage() {
  return localStorage.getItem('ebay_user_token');
}

function getAppJwtToken() {
  try {
    const store = JSON.parse(localStorage.getItem('user-store') || '{}');
    const token = store?.state?.user?.token;
    return typeof token === 'string' ? token : '';
  } catch (e) {
    return '';
  }
}

// Before each request to /api/ebay or /api/pricing-strategies or /api/competitor-rules:
apiClient.interceptors.request.use((config) => {
  const token = getAppJwtToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

pricingClient.interceptors.request.use((config) => {
  const token = getAppJwtToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

competitorClient.interceptors.request.use((config) => {
  const token = getAppJwtToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** ————————————— RESPONSE INTERCEPTORS FOR AUTH ERRORS ————————————— **/
// Handle 401 errors for pricing strategies
pricingClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        '⚠️ Authentication failed for pricing strategies. Clearing storage and reloading...'
      );

      // Clear all authentication-related data
      localStorage.removeItem('user-store');
      localStorage.removeItem('ebay_user_token');
      localStorage.removeItem('ebay_refresh_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user_id');

      // Reload the page to redirect to login
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Handle 401 errors for competitor rules
competitorClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        '⚠️ Authentication failed for competitor rules. Clearing storage and reloading...'
      );

      // Clear all authentication-related data
      localStorage.removeItem('user-store');
      localStorage.removeItem('ebay_user_token');
      localStorage.removeItem('ebay_refresh_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user_id');

      // Reload the page to redirect to login
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

/** ————————————— GLOBAL RESPONSE INTERCEPTOR ————————————— **/
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if it's an eBay token expiry
      const errorData = error.response.data;
      if (errorData?.errors?.[0]?.errorId === 932) {
        localStorage.removeItem('ebay_user_token');
        localStorage.removeItem('ebay_refresh_token');

        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('ebayTokenExpired'));
      } else {
        // General auth failure - clear all and reload
        console.warn(
          '⚠️ Authentication failed. Clearing storage and reloading...'
        );
        localStorage.removeItem('user-store');
        localStorage.removeItem('ebay_user_token');
        localStorage.removeItem('ebay_refresh_token');
        localStorage.removeItem('userId');
        localStorage.removeItem('user_id');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

/** ————————— INVENTORY & SYNC & COMPETITOR → EBAY ROUTES ————————— **/
const inventory = {
  getActiveListings: async () => {
    try {
      const userId = localStorage.getItem('user_id'); // Or however it's stored
      const resp = await apiClient.get('/active-listings', {
        params: { userId },
      });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  editPrice: async (requestData) => {
    try {
      const resp = await apiClient.post('/edit-variation-price', requestData);
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  triggerAutoSync: async (params = {}) => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/sync/scheduled`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY || '',
        },
        params,
      });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  getCompetitorPrice: async (itemId) => {
    try {
      const userId = localStorage.getItem('user_id');

      if (!userId) {
        return { price: 'USD0.00', count: 0, allPrices: [], productInfo: [] };
      }

      const resp = await apiClient.get(`/competitor-prices/${itemId}`, {
        params: { userId },
      });

      // Check if the response has the expected structure
      if (!resp.data || !resp.data.success) {
        return { price: 'USD0.00', count: 0, allPrices: [], productInfo: [] };
      }

      // Updated to match the actual API response structure
      const competitorPrices = resp.data?.competitorPrices || {};

      const allPrices = Array.isArray(competitorPrices.allPrices)
        ? competitorPrices.allPrices
        : [];
      const allData = Array.isArray(competitorPrices.allData)
        ? competitorPrices.allData
        : [];

      const result = {
        price:
          allPrices.length > 0
            ? `USD${parseFloat(Math.min(...allPrices)).toFixed(2)}`
            : 'USD0.00',
        count: allPrices.length,
        allPrices,
        productInfo: allData,
      };

      return result;
    } catch (err) {
      return { price: 'USD0.00', count: 0, allPrices: [], productInfo: [] };
    }
  },
};

/** ————————————— AUTH (LOGIN / REGISTER / EXCHANGE CODE / GET TOKEN) ————————————— **/
const auth = {
  register: async (credentials) => {
    try {
      const resp = await authClient.post('/register', credentials);
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  login: async (credentials) => {
    try {
      const resp = await authClient.post('/login', credentials);
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  exchangeCode: async ({ code, userId }) => {
    try {
      const resp = await authClient.post('/exchange-code', { code, userId });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  getEbayUserToken: async (userId) => {
    try {
      const resp = await authClient.get('/token', { params: { userId } });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  refreshEbayUserToken: async (userId) => {
    try {
      const resp = await authClient.get('/refresh', { params: { userId } });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

/** ————————————— PRICING STRATEGIES ————————————— **/
const pricingStrategies = {
  createStrategy: async (strategyData) => {
    try {
      const resp = await pricingClient.post('/', strategyData);
      return resp.data;
    } catch (err) {
      if (err.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw err;
    }
  },
  createStrategyOnProduct: async (itemId, strategyData) => {
    try {
      // First create the strategy
      const strategyResp = await pricingClient.post('/', strategyData);
      if (!strategyResp.data.success) {
        throw new Error(
          strategyResp.data.message || 'Failed to create strategy'
        );
      }

      const strategyId = strategyResp.data.data._id;

      // Then apply it to the product
      const applyResp = await pricingClient.post(`/products/${itemId}`, {
        strategyIds: [strategyId],
      });

      return {
        success: true,
        strategy: strategyResp.data.data,
        application: applyResp.data,
      };
    } catch (err) {
      if (err.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw err;
    }
  },
  applyStrategyToProduct: async (itemId, strategyIds) => {
    try {
      const resp = await pricingClient.post(`/products/${itemId}`, {
        strategyIds: Array.isArray(strategyIds) ? strategyIds : [strategyIds],
      });
      return resp.data;
    } catch (err) {
      if (err.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw err;
    }
  },

  getStrategyFromProduct: async (itemId) => {
    try {
      const resp = await pricingClient.get(`/products/${itemId}`);
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  getAllActiveWithStrategies: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await pricingClient.get(`/active-listings`, {
        params: { userId },
      });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  updateStrategyOnProduct: async (itemId, strategyData) => {
    try {
      const resp = await pricingClient.put(`/products/${itemId}`, strategyData);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  deleteStrategyFromProduct: async (itemId) => {
    try {
      const resp = await pricingClient.delete(`/products/${itemId}`);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  deleteStrategiesFromAllActive: async () => {
    try {
      const resp = await pricingClient.delete(`/delete-from-all-active`);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  applyStrategyBulk: async (applyData) => {
    try {
      const resp = await pricingClient.post(`/apply-bulk`, applyData);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  getAllUniqueStrategies: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await pricingClient.get(`/active-listings`, {
        params: { userId, active: true },
      });

      return {
        success: resp.data.success,
        strategies: resp.data.strategies || [],
        count: resp.data.count || 0,
      };
    } catch (err) {
      return { success: false, error: err.message, strategies: [] };
    }
  },
  getStrategyDisplayForProduct: async (itemId, sku = null) => {
    try {
      const params = sku ? `?sku=${encodeURIComponent(sku)}` : '';

      // Add cache-busting timestamp to prevent stale data
      const cacheBuster = `${params ? '&' : '?'}t=${Date.now()}`;

      const response = await pricingClient.get(
        `/products/${itemId}/display${params}${cacheBuster}`
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: {
          strategy: 'Assign Strategy',
          minPrice: 'Set',
          maxPrice: 'Set',
          hasStrategy: false,
        },
      };
    }
  },

  updatePrice: async (itemId) => {
    try {
      const response = await pricingClient.post(
        `/products/${itemId}/update-price`
      );
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  updateStrategy: async (strategyId, updateData) => {
    try {
      const response = await pricingClient.put(`/${strategyId}`, updateData);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};

/** ————————————— COMPETITOR RULES ————————————— **/
const competitorRules = {
  createRuleOnProduct: async (itemId, ruleData) => {
    try {
      const resp = await competitorClient.post(`/products/${itemId}`, ruleData);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  createRuleForAllActive: async (ruleData) => {
    try {
      const resp = await competitorClient.post(
        `/assign-to-all-active`,
        ruleData
      );
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  getRuleFromProduct: async (itemId) => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await competitorClient.get(`/products/${itemId}`, {
        params: { userId },
      });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  getAllActiveWithRules: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await competitorClient.get(`/active-listings`, {
        params: { userId },
      });
      return resp.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  updateRuleOnProduct: async (itemId, ruleData) => {
    try {
      const resp = await competitorClient.put(`/products/${itemId}`, ruleData);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  deleteRuleFromProduct: async (itemId) => {
    try {
      const resp = await competitorClient.delete(`/products/${itemId}`);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  deleteRulesFromAllActive: async () => {
    try {
      const resp = await competitorClient.delete(`/delete-from-all-active`);
      return resp.data;
    } catch (err) {
      throw err;
    }
  },
  getAllUniqueRules: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await competitorClient.get(`/active-listings`, {
        params: { userId },
      });

      // Extract unique rules from listings
      const rulesFromListings = (resp.data.listings || [])
        .map((l) => l.competitorRule)
        .filter((r) => r !== null && typeof r === 'object');

      const ruleMap = new Map();
      rulesFromListings.forEach((rule) => {
        ruleMap.set(rule._id, rule);
      });

      return {
        success: true,
        rules: Array.from(ruleMap.values()), // deduplicated
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  getAllRules: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await competitorClient.get(`/`, {
        params: { active: true, userId },
      });
      return {
        success: true,
        rules: resp.data?.data || [],
      };
    } catch (err) {
      if (err.response?.status === 404) {
        return { success: true, rules: [] }; // Return an empty list if 404
      }
      return { success: false, error: err.message };
    }
  },
};

/** —————————————— COMBINED HELPERS —————————————— **/
const combined = {
  getProductRulesAndStrategies: async (itemId) => {
    try {
      const [stratRes, ruleRes] = await Promise.allSettled([
        pricingStrategies.getStrategyFromProduct(itemId),
        competitorRules.getRuleFromProduct(itemId),
      ]);
      return {
        success: true,
        strategy: stratRes.status === 'fulfilled' ? stratRes.value : null,
        rule: ruleRes.status === 'fulfilled' ? ruleRes.value : null,
        errors: {
          strategy:
            stratRes.status === 'rejected' ? stratRes.reason.message : null,
          rule: ruleRes.status === 'rejected' ? ruleRes.reason.message : null,
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  getAllOptionsForDropdowns: async () => {
    try {
      const [strategiesRes, rulesRes] = await Promise.allSettled([
        pricingStrategies.getAllUniqueStrategies(),
        competitorRules.getAllRules(), // Updated to use getAllRules
      ]);
      const allOptions = {
        success: true,
        strategies:
          strategiesRes.status === 'fulfilled'
            ? strategiesRes.value.strategies || []
            : [],
        rules:
          rulesRes.status === 'fulfilled' ? rulesRes.value.rules || [] : [],
        errors: {
          strategies:
            strategiesRes.status === 'rejected'
              ? strategiesRes.reason.message
              : null,
          rules:
            rulesRes.status === 'rejected' ? rulesRes.reason.message : null,
        },
      };
      return allOptions;
    } catch (err) {
      return { success: false, error: err.message, strategies: [], rules: [] };
    }
  },
  createRuleAndStrategy: async (
    itemId,
    ruleData,
    strategyData,
    assignToAll = false
  ) => {
    try {
      const promises = [];
      if (ruleData) {
        if (assignToAll) {
          promises.push(competitorRules.createRuleForAllActive(ruleData));
        } else {
          promises.push(competitorRules.createRuleOnProduct(itemId, ruleData));
        }
      }
      if (strategyData) {
        if (assignToAll) {
          promises.push(
            pricingStrategies.createStrategyForAllActive(strategyData)
          );
        } else {
          promises.push(
            pricingStrategies.createStrategyOnProduct(itemId, strategyData)
          );
        }
      }
      const results = await Promise.allSettled(promises);
      return {
        success: true,
        results: results.map((r) =>
          r.status === 'fulfilled' ? r.value : { error: r.reason.message }
        ),
      };
    } catch (err) {
      throw err;
    }
  },
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to create authenticated requests
const createAuthenticatedRequest = async () => {
  // Use the same token retrieval logic as the other clients
  const token = getAppJwtToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
};

// Price History endpoints
const priceHistory = {
  getProductHistory: async (itemId, limit = 100) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const response = await fetch(
        `${BASE_URL}/price-history/product/${itemId}?limit=${limit}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getProductSummary: async (itemId) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const response = await fetch(
        `${BASE_URL}/price-history/summary/${itemId}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        summary: {
          hasHistory: false,
          totalChanges: 0,
          latestChange: null,
          currentPrice: null,
          priceDirection: 'unchanged',
        },
      };
    }
  },

  getPaginatedHistory: async (itemId, options = {}) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const {
        sku = null,
        limit = 100,
        page = 1,
        sortBy = 'createdAt',
        sortOrder = -1,
      } = options;

      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        sortBy,
        sortOrder: sortOrder.toString(),
      });

      if (sku) queryParams.append('sku', sku);

      const response = await fetch(
        `${BASE_URL}/price-history/product/${itemId}/paginated?${queryParams}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  addManualRecord: async (recordData) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const response = await fetch(`${BASE_URL}/price-history/history/manual`, {
        method: 'POST',
        headers,
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getAnalytics: async (itemId, options = {}) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const { sku = null, period = '30d' } = options;

      const queryParams = new URLSearchParams({ period });
      if (sku) queryParams.append('sku', sku);

      const response = await fetch(
        `${BASE_URL}/price-history/analytics/${itemId}?${queryParams}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  exportHistory: async (itemId, options = {}) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const { sku = null, format = 'json' } = options;

      const queryParams = new URLSearchParams({ format });
      if (sku) queryParams.append('sku', sku);

      const response = await fetch(
        `${BASE_URL}/price-history/export/${itemId}?${queryParams}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (format === 'csv') {
        const csvData = await response.text();
        return { success: true, data: csvData, format: 'csv' };
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      throw error;
    }
  },

  bulkInsert: async (records) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const response = await fetch(`${BASE_URL}/price-history/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  archiveOldRecords: async (keepRecentCount = 1000) => {
    try {
      const { headers } = await createAuthenticatedRequest();

      const response = await fetch(`${BASE_URL}/price-history/archive`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ keepRecentCount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default {
  inventory,
  auth,
  pricingStrategies,
  competitorRules,
  combined,
  priceHistory, // Add the price history service
};
