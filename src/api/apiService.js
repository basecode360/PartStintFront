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

function parseEbayTokenValue() {
  return localStorage.getItem('ebay_user_token') || '';
}

// Before each request to /api/ebay or /api/pricing-strategies or /api/competitor-rules:
apiClient.interceptors.request.use((config) => {
  const token = parseEbayTokenValue();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

pricingClient.interceptors.request.use((config) => {
  const token = parseEbayTokenValue();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

competitorClient.interceptors.request.use((config) => {
  const token = parseEbayTokenValue();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
      console.error('Error @ getActiveListings:', err);
      return { success: false, error: err.message };
    }
  },
  editPrice: async (requestData) => {
    try {
      const resp = await apiClient.post('/edit-variation-price', requestData);
      return resp.data;
    } catch (err) {
      console.error('Error @ editPrice:', err);
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
      console.error('Error @ triggerAutoSync:', err);
      return { success: false, error: err.message };
    }
  },
  getCompetitorPrice: async (itemId) => {
    try {
      const resp = await apiClient.get(
        `/pricing-strategies/products/${itemId}`
      );
      const data = resp.data?.competitorPrices || {
        allData: [],
        allPrices: [],
      };
      const allPrices = Array.isArray(data.allPrices) ? data.allPrices : [];
      return {
        price:
          allPrices.length > 0
            ? `USD${parseFloat(Math.min(...allPrices)).toFixed(2)}`
            : 'USD0.00',
        count: allPrices.length,
        allPrices,
        productInfo: data.allData,
      };
    } catch (err) {
      console.error(`Error @ getCompetitorPrice(${itemId}):`, err);
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
      console.error('Error @ auth.register:', err);
      return { success: false, error: err.message };
    }
  },
  login: async (credentials) => {
    try {
      const resp = await authClient.post('/login', credentials);
      return resp.data;
    } catch (err) {
      console.error('Error @ auth.login:', err);
      return { success: false, error: err.message };
    }
  },
  exchangeCode: async ({ code, userId }) => {
    try {
      const resp = await authClient.post('/exchange-code', { code, userId });
      return resp.data;
    } catch (err) {
      console.error('Error @ auth.exchangeCode:', err);
      return { success: false, error: err.message };
    }
  },
  getEbayUserToken: async (userId) => {
    try {
      const resp = await authClient.get('/token', { params: { userId } });
      return resp.data;
    } catch (err) {
      console.error('Error @ auth.getEbayUserToken:', err);
      return { success: false, error: err.message };
    }
  },
  refreshEbayUserToken: async (userId) => {
    try {
      const resp = await authClient.get('/refresh', { params: { userId } });
      return resp.data;
    } catch (err) {
      console.error('Error @ auth.refreshEbayUserToken:', err);
      return { success: false, error: err.message };
    }
  },
};

/** ————————————— PRICING STRATEGIES ————————————— **/
const pricingStrategies = {
  createStrategyOnProduct: async (itemId, strategyData) => {
    try {
      const resp = await pricingClient.post(
        `/products/${itemId}`,
        strategyData
      );
      return resp.data;
    } catch (err) {
      console.error('Error @ createStrategyOnProduct:', err);
      throw err;
    }
  },
  createStrategyForAllActive: async (strategyData) => {
    try {
      const resp = await pricingClient.post(
        `/assign-to-all-active`,
        strategyData
      );
      return resp.data;
    } catch (err) {
      console.error('Error @ createStrategyForAllActive:', err);
      throw err;
    }
  },
  getStrategyFromProduct: async (itemId) => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await pricingClient.get(`/products/${itemId}`, {
        params: { userId },
      });
      return resp.data;
    } catch (err) {
      console.error('Error @ getStrategyFromProduct:', err);
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
      console.error('Error @ getAllActiveWithStrategies:', err);
      return { success: false, error: err.message };
    }
  },
  updateStrategyOnProduct: async (itemId, strategyData) => {
    try {
      const resp = await pricingClient.put(`/products/${itemId}`, strategyData);
      return resp.data;
    } catch (err) {
      console.error('Error @ updateStrategyOnProduct:', err);
      throw err;
    }
  },
  deleteStrategyFromProduct: async (itemId) => {
    try {
      const resp = await pricingClient.delete(`/products/${itemId}`);
      return resp.data;
    } catch (err) {
      console.error('Error @ deleteStrategyFromProduct:', err);
      throw err;
    }
  },
  deleteStrategiesFromAllActive: async () => {
    try {
      const resp = await pricingClient.delete(`/delete-from-all-active`);
      return resp.data;
    } catch (err) {
      console.error('Error @ deleteStrategiesFromAllActive:', err);
      throw err;
    }
  },
  applyStrategyToProduct: async (itemId, applyData) => {
    try {
      const resp = await pricingClient.post(`/${itemId}/apply`, applyData);
      return resp.data;
    } catch (err) {
      console.error('Error @ applyStrategyToProduct:', err);
      throw err;
    }
  },
  applyStrategyBulk: async (applyData) => {
    try {
      const resp = await pricingClient.post(`/apply-bulk`, applyData);
      return resp.data;
    } catch (err) {
      console.error('Error @ applyStrategyBulk:', err);
      throw err;
    }
  },
  getAllUniqueStrategies: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await pricingClient.get(`/active-listings`, {
        params: { userId, active: true },
      });
      return resp.data;
    } catch (err) {
      console.error('Error @ getAllUniqueStrategies:', err);
      return { success: false, error: err.message };
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
      console.error('Error @ createRuleOnProduct:', err);
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
      console.error('Error @ createRuleForAllActive:', err);
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
      console.error('Error @ getRuleFromProduct:', err);
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
      console.error('Error @ getAllActiveWithRules:', err);
      return { success: false, error: err.message };
    }
  },
  updateRuleOnProduct: async (itemId, ruleData) => {
    try {
      const resp = await competitorClient.put(`/products/${itemId}`, ruleData);
      return resp.data;
    } catch (err) {
      console.error('Error @ updateRuleOnProduct:', err);
      throw err;
    }
  },
  deleteRuleFromProduct: async (itemId) => {
    try {
      const resp = await competitorClient.delete(`/products/${itemId}`);
      return resp.data;
    } catch (err) {
      console.error('Error @ deleteRuleFromProduct:', err);
      throw err;
    }
  },
  deleteRulesFromAllActive: async () => {
    try {
      const resp = await competitorClient.delete(`/delete-from-all-active`);
      return resp.data;
    } catch (err) {
      console.error('Error @ deleteRulesFromAllActive:', err);
      throw err;
    }
  },
  getAllUniqueRules: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const resp = await competitorClient.get(`/active-listings`, {
        params: { userId },
      });
      return resp.data;
    } catch (err) {
      console.error('Error @ getAllUniqueRules:', err);
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
      console.error('Error @ combined.getProductRulesAndStrategies:', err);
      return { success: false, error: err.message };
    }
  },
  getAllOptionsForDropdowns: async () => {
    try {
      const [strategiesRes, rulesRes] = await Promise.allSettled([
        pricingStrategies.getAllUniqueStrategies(),
        competitorRules.getAllUniqueRules(),
      ]);
      return {
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
    } catch (err) {
      console.error('Error @ combined.getAllOptionsForDropdowns:', err);
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
      console.error('Error @ combined.createRuleAndStrategy:', err);
      throw err;
    }
  },
};

export default {
  inventory,
  auth,
  pricingStrategies,
  competitorRules,
  combined,
};
