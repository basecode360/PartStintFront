// src/api/apiService.js
import axios from "axios";

const backend_url = import.meta.env.VITE_BACKEND_URL;
const apiKey = import.meta.env.VITE_X_API_KEY;

const API_BASE_URL = `${backend_url}/api/ebay`;
const syncURL = `${backend_url}/api/sync`;
const authURL = `${backend_url}/api/auth`;

console.log(`Sync Url: ${syncURL}`);
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const authClient = axios.create({
  baseURL: authURL,
});

const inventory = {
  getActiveListings: async () => {
    try {
      const response = await apiClient.get("/active-listings");
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
  editPrice: async (requestData) => {
    try {
      const response = await apiClient.post(
        "/edit-variation-price",
        requestData
      );
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
  assignPricingStrategy: async (requestData) => {
    console.log(`request data  => ${requestData.targetPrice}
      `);
    try {
      const response = await apiClient.post("/pricing-strategy", requestData);
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
  triggerAutoSync: async (requestData) => {
    console.log(`request data  => ${requestData}
      `);
    try {
      const response = await axios.get(`${syncURL}/scheduled`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey, // send the key we got from client
        },
        params: requestData, // query string
      });
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
  getCompetitorPrice: async (itemId) => {
    try {
      const response = await axios.get(
        `${backend_url}/api/pricing-strategies/products/${itemId}`
      );
      const data = response.data?.competitorPrices || {};
      const productInfo = data.allData;
      console.log(`Competitor price data for ${itemId}:`, productInfo);
      const prices = Array.isArray(data.allPrices) ? data.allPrices : [];
      return {
        price:
          prices.length > 0
            ? `USD${parseFloat(Math.min(...prices)).toFixed(2)}`
            : "USD0.00",
        count: prices.length,
        allPrices: prices,
        productInfo,
      };
    } catch (error) {
      console.error(`Error fetching competitor price for ${itemId}:`, error);
      return {
        price: "USD0.00",
        count: 0,
        allPrices: [],
      };
    }
  },
};

const auth = {
  getAuthToken: async () => {
    try {
      const response = await axios.get(`${backend_url}/auth/automated-login`);
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
  login: async (credentials) => {
    try {
      const response = await authClient.post("/login", credentials);
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
  logout: async () => {
    try {
      const response = await authClient.post("/logout");
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
  register: async (requestData) => {
    try {
      const response = await authClient.post("/register", requestData);
      console.log("API response:", response);
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return { success: false, error: error.message };
    }
  },
};

// ===============================
// PRICING STRATEGIES API
// ===============================
const pricingStrategies = {
  // Create strategy on specific product
  createStrategyOnProduct: async (itemId, strategyData) => {
    try {
      const response = await axios.post(
        `${backend_url}/api/pricing-strategies/products/${itemId}`,
        strategyData
      );
      console.log("Create strategy API response:", response);
      return response.data;
    } catch (error) {
      console.error("Create strategy API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create pricing strategy"
      );
    }
  },

  // Create strategy and assign to all active listings
  createStrategyForAllActive: async (strategyData) => {
    try {
      const response = await axios.post(
        `${backend_url}/api/pricing-strategies/assign-to-all-active`,
        strategyData
      );
      console.log("Create strategy for all active API response:", response);
      return response.data;
    } catch (error) {
      console.error("Create strategy for all active API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to assign pricing strategy to active listings"
      );
    }
  },

  // Get strategy from specific product
  getStrategyFromProduct: async (itemId) => {
    try {
      const response = await axios.get(
        `${backend_url}/api/pricing-strategies/products/${itemId}`
      );
      console.log("Get strategy API response:", response);
      return response.data;
    } catch (error) {
      console.error("Get strategy API error:", error);
      return {
        success: false,
        hasPricingStrategy: false,
        pricingStrategy: null,
        error: error.message,
      };
    }
  },

  // Get all active listings with strategies
  getAllActiveWithStrategies: async () => {
    try {
      const response = await axios.get(
        `${backend_url}/api/pricing-strategies/active-listings`
      );
      console.log("Get all active with strategies API response:", response);
      return response.data;
    } catch (error) {
      console.error("Get all active with strategies API error:", error);
      return { success: false, listings: [], error: error.message };
    }
  },

  // Update strategy on specific product
  updateStrategyOnProduct: async (itemId, strategyData) => {
    try {
      const response = await axios.put(
        `${backend_url}/pricing-strategies/products/${itemId}`,
        strategyData
      );
      console.log("Update strategy API response:", response);
      return response.data;
    } catch (error) {
      console.error("Update strategy API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update pricing strategy"
      );
    }
  },

  // Delete strategy from specific product
  deleteStrategyFromProduct: async (itemId) => {
    try {
      const response = await axios.delete(
        `${backend_url}/pricing-strategies/products/${itemId}`
      );
      console.log("Delete strategy API response:", response);
      return response.data;
    } catch (error) {
      console.error("Delete strategy API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete pricing strategy"
      );
    }
  },

  // Delete strategies from all active listings
  deleteStrategiesFromAllActive: async () => {
    try {
      const response = await axios.delete(
        `${backend_url}/pricing-strategies/delete-from-all-active`
      );
      console.log("Delete strategies from all active API response:", response);
      return response.data;
    } catch (error) {
      console.error("Delete strategies from all active API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete pricing strategies from active listings"
      );
    }
  },

  // Apply strategy to update product price
  applyStrategyToProduct: async (itemId, applyData) => {
    try {
      const response = await axios.post(
        `${backend_url}/pricing-strategies/products/${itemId}/apply`,
        applyData
      );
      console.log("Apply strategy API response:", response);
      return response.data;
    } catch (error) {
      console.error("Apply strategy API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to apply pricing strategy"
      );
    }
  },

  // Apply strategy to multiple products (bulk)
  applyStrategyBulk: async (applyData) => {
    try {
      const response = await axios.post(
        `${backend_url}/pricing-strategies/apply-bulk`,
        applyData
      );
      console.log("Apply strategy bulk API response:", response);
      return response.data;
    } catch (error) {
      console.error("Apply strategy bulk API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to apply pricing strategy in bulk"
      );
    }
  },

  // Get all unique strategies for dropdown
  getAllUniqueStrategies: async () => {
    try {
      const response = await axios.get(
        `${backend_url}/api/ebay/pricing-strategies?active=true`
      );
      console.log("Get unique strategies API response:", response);

      if (response.data.success && response.data.listings) {
        // Extract unique strategies
        const uniqueStrategies = [];
        const seen = new Set();

        response.data.listings.forEach((listing) => {
          if (listing.hasPricingStrategy && listing.pricingStrategy) {
            const strategyKey = `${listing.pricingStrategy.strategyName}_${listing.pricingStrategy.repricingRule}`;
            if (!seen.has(strategyKey)) {
              seen.add(strategyKey);
              uniqueStrategies.push({
                ...listing.pricingStrategy,
                displayName: `${listing.pricingStrategy.strategyName} (${listing.pricingStrategy.repricingRule})`,
              });
            }
          }
        });

        return { success: true, strategies: uniqueStrategies };
      }

      return { success: false, strategies: [] };
    } catch (error) {
      console.error("Get unique strategies API error:", error);
      return { success: false, strategies: [], error: error.message };
    }
  },
};

// ===============================
// COMPETITOR RULES API
// ===============================
const competitorRules = {
  // Create rule on specific product
  createRuleOnProduct: async (itemId, ruleData) => {
    try {
      console.log(`Creating competitor rule for itemId:${ruleData}`);
      const response = await axios.post(
        `${backend_url}/api/competitor-rules/products/${itemId}`,
        ruleData
      );
      console.log("Create competitor rule API response:", response);
      return response.data;
    } catch (error) {
      console.error("Create competitor rule API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create competitor rule"
      );
    }
  },

  // Create rule and assign to all active listings
  createRuleForAllActive: async (ruleData) => {
    try {
      const response = await axios.post(
        `${backend_url}/api/competitor-rules/assign-to-all-active`,
        ruleData
      );
      console.log("Create rule for all active API response:", response);
      return response.data;
    } catch (error) {
      console.error("Create rule for all active API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to assign competitor rule to active listings"
      );
    }
  },

  // Get rule from specific product
  getRuleFromProduct: async (itemId) => {
    try {
      console.log(`Fetching competitor rule for itemId: ${itemId}`);
      const response = await axios.get(
        `${backend_url}/api/competitor-rules/products/${itemId}`
      );
      console.log("Get competitor rule API response:", response);
      return response.data;
    } catch (error) {
      console.error("Get competitor rule API error:", error);
      return {
        success: false,
        hasCompetitorRule: false,
        competitorRule: null,
        error: error.message,
      };
    }
  },

  // Get all active listings with rules
  getAllActiveWithRules: async () => {
    try {
      const response = await axios.get(
        `${backend_url}/api/competitor-rules/active-listings`
      );
      console.log("Get all active with rules API response:", response);
      return response.data;
    } catch (error) {
      console.error("Get all active with rules API error:", error);
      return { success: false, listings: [], error: error.message };
    }
  },

  // Update rule on specific product
  updateRuleOnProduct: async (itemId, ruleData) => {
    try {
      const response = await axios.put(
        `${backend_url}/competitor-rules/products/${itemId}`,
        ruleData
      );
      console.log("Update competitor rule API response:", response);
      return response.data;
    } catch (error) {
      console.error("Update competitor rule API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update competitor rule"
      );
    }
  },

  // Delete rule from specific product
  deleteRuleFromProduct: async (itemId) => {
    try {
      const response = await axios.delete(
        `${backend_url}/competitor-rules/products/${itemId}`
      );
      console.log("Delete competitor rule API response:", response);
      return response.data;
    } catch (error) {
      console.error("Delete competitor rule API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete competitor rule"
      );
    }
  },

  // Delete rules from all active listings
  deleteRulesFromAllActive: async () => {
    try {
      const response = await axios.delete(
        `${backend_url}/competitor-rules/delete-from-all-active`
      );
      console.log("Delete rules from all active API response:", response);
      return response.data;
    } catch (error) {
      console.error("Delete rules from all active API error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete competitor rules from active listings"
      );
    }
  },

  // Get all unique rules for dropdown
  getAllUniqueRules: async () => {
    try {
      const response = await axios.get(
        `${backend_url}/competitor-rules/active-listings`
      );
      console.log("Get unique rules API response:", response);

      if (response.data.success && response.data.listings) {
        // Extract unique rules
        const uniqueRules = [];
        const seen = new Set();

        response.data.listings.forEach((listing) => {
          if (listing.hasCompetitorRule && listing.competitorRule) {
            const ruleKey = listing.competitorRule.ruleName;
            if (!seen.has(ruleKey)) {
              seen.add(ruleKey);
              uniqueRules.push({
                ...listing.competitorRule,
                displayName: listing.competitorRule.ruleName,
              });
            }
          }
        });

        return { success: true, rules: uniqueRules };
      }

      return { success: false, rules: [] };
    } catch (error) {
      console.error("Get unique rules API error:", error);
      return { success: false, rules: [], error: error.message };
    }
  },
};

// ===============================
// COMBINED API FUNCTIONS
// ===============================
const combined = {
  // Get both strategies and rules for a product
  getProductRulesAndStrategies: async (itemId) => {
    try {
      const [strategyResponse, ruleResponse] = await Promise.allSettled([
        pricingStrategies.getStrategyFromProduct(itemId),
        competitorRules.getRuleFromProduct(itemId),
      ]);

      return {
        success: true,
        itemId,
        strategy:
          strategyResponse.status === "fulfilled"
            ? strategyResponse.value
            : null,
        rule: ruleResponse.status === "fulfilled" ? ruleResponse.value : null,
        errors: {
          strategy:
            strategyResponse.status === "rejected"
              ? strategyResponse.reason.message
              : null,
          rule:
            ruleResponse.status === "rejected"
              ? ruleResponse.reason.message
              : null,
        },
      };
    } catch (error) {
      console.error("Get product rules and strategies error:", error);
      return { success: false, error: error.message };
    }
  },

  // Get all unique strategies and rules for dropdowns
  getAllOptionsForDropdowns: async () => {
    try {
      const [strategiesResponse, rulesResponse] = await Promise.allSettled([
        pricingStrategies.getAllUniqueStrategies(),
        competitorRules.getAllUniqueRules(),
      ]);

      return {
        success: true,
        strategies:
          strategiesResponse.status === "fulfilled"
            ? strategiesResponse.value.strategies
            : [],
        rules:
          rulesResponse.status === "fulfilled" ? rulesResponse.value.rules : [],
        errors: {
          strategies:
            strategiesResponse.status === "rejected"
              ? strategiesResponse.reason.message
              : null,
          rules:
            rulesResponse.status === "rejected"
              ? rulesResponse.reason.message
              : null,
        },
      };
    } catch (error) {
      console.error("Get all options for dropdowns error:", error);
      return {
        success: false,
        strategies: [],
        rules: [],
        error: error.message,
      };
    }
  },

  // Create both rule and strategy together
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
        message: "Rules and strategies created successfully",
        results: results.map((result) =>
          result.status === "fulfilled"
            ? result.value
            : { error: result.reason.message }
        ),
      };
    } catch (error) {
      console.error("Create rule and strategy error:", error);
      throw new Error(error.message || "Failed to create rules and strategies");
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
