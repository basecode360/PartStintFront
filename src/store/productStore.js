import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProductStore = create(
  persist(
    (set, get) => ({
      // Data
      products: [],
      strategies: [],
      competitorRules: [],

      // Cache control
      lastFetch: {
        products: null,
        strategies: null,
        competitorRules: null,
      },
      cacheTimeout: 5 * 60 * 1000, // 5 minutes

      // Loading states
      loading: {
        products: false,
        strategies: false,
        competitorRules: false,
      },

      // Search and filter state
      searchTerm: '',
      entriesPerPage: 10,
      currentPage: 1,
      sortBy: 'title',
      sortOrder: 'asc',

      // Cache checking
      isCacheValid: (key) => {
        const lastFetch = get().lastFetch[key];
        if (!lastFetch) return false;
        return Date.now() - lastFetch < get().cacheTimeout;
      },

      // Search and filter actions
      setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
      setEntriesPerPage: (entries) =>
        set({ entriesPerPage: entries, currentPage: 1 }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),

      // Combined search modifier function
      modifySearch: (updates) =>
        set((state) => ({
          ...state,
          ...updates,
          currentPage: updates.currentPage || 1, // Reset to page 1 when search changes
        })),

      // Products
      setProducts: (products) =>
        set((state) => ({
          products,
          lastFetch: { ...state.lastFetch, products: Date.now() },
          loading: { ...state.loading, products: false },
        })),

      setProductsLoading: (loading) =>
        set((state) => ({
          loading: { ...state.loading, products: loading },
        })),

      modifyProductsArray: (newProducts) =>
        set((state) => ({
          products: Array.isArray(newProducts) ? newProducts : state.products,
          lastFetch: { ...state.lastFetch, products: Date.now() },
          loading: { ...state.loading, products: false },
        })),

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      removeProduct: (itemId) =>
        set((state) => ({
          products: state.products.filter(
            (product) => product.itemId !== itemId
          ),
        })),

      replaceProducts: (newProducts) =>
        set((state) => ({
          products: Array.isArray(newProducts) ? newProducts : [],
          lastFetch: { ...state.lastFetch, products: Date.now() },
          loading: { ...state.loading, products: false },
        })),

      updateMultipleProducts: (updates) =>
        set((state) => ({
          products: state.products.map((product) => {
            const update = updates.find((u) => u.itemId === product.itemId);
            return update ? { ...product, ...update } : product;
          }),
        })),

      // Strategies
      setStrategies: (strategies) =>
        set((state) => ({
          strategies,
          lastFetch: { ...state.lastFetch, strategies: Date.now() },
          loading: { ...state.loading, strategies: false },
        })),

      setStrategiesLoading: (loading) =>
        set((state) => ({
          loading: { ...state.loading, strategies: loading },
        })),

      // Competitor Rules
      setCompetitorRules: (competitorRules) =>
        set((state) => ({
          competitorRules,
          lastFetch: { ...state.lastFetch, competitorRules: Date.now() },
          loading: { ...state.loading, competitorRules: false },
        })),

      setCompetitorRulesLoading: (loading) =>
        set((state) => ({
          loading: { ...state.loading, competitorRules: loading },
        })),

      // Force refresh (invalidate cache)
      invalidateCache: (key) =>
        set((state) => ({
          lastFetch: { ...state.lastFetch, [key]: null },
        })),

      // Clear all cache
      clearCache: () =>
        set({
          lastFetch: {
            products: null,
            strategies: null,
            competitorRules: null,
          },
        }),

      // Update single product (to avoid full refetch)
      updateProduct: (itemId, updates) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.itemId === itemId ? { ...product, ...updates } : product
          ),
        })),

      // Add new strategy without refetch
      addStrategy: (strategy) =>
        set((state) => ({
          strategies: [...state.strategies, strategy],
        })),

      // Update strategy without refetch
      updateStrategy: (strategyId, updates) =>
        set((state) => ({
          strategies: state.strategies.map((strategy) =>
            strategy._id === strategyId || strategy.strategyId === strategyId
              ? { ...strategy, ...updates }
              : strategy
          ),
        })),

      // Filtered and paginated products getter
      getFilteredProducts: () => {
        const state = get();
        let filtered = state.products;

        // Apply search filter
        if (state.searchTerm) {
          const term = state.searchTerm.toLowerCase();
          filtered = filtered.filter(
            (product) =>
              product.title?.toLowerCase().includes(term) ||
              product.itemId?.toLowerCase().includes(term) ||
              product.sku?.toLowerCase().includes(term)
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const aVal = a[state.sortBy] || '';
          const bVal = b[state.sortBy] || '';

          if (state.sortOrder === 'asc') {
            return aVal.toString().localeCompare(bVal.toString());
          } else {
            return bVal.toString().localeCompare(aVal.toString());
          }
        });

        // Calculate pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / state.entriesPerPage);
        const startIndex = (state.currentPage - 1) * state.entriesPerPage;
        const endIndex = startIndex + state.entriesPerPage;
        const paginatedProducts = filtered.slice(startIndex, endIndex);

        return {
          products: paginatedProducts,
          totalItems,
          totalPages,
          currentPage: state.currentPage,
          entriesPerPage: state.entriesPerPage,
        };
      },

      // ADD: Missing product manipulation functions
      modifyProductsId: (productId, updates) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === productId ||
            product._id === productId ||
            product.itemId === productId
              ? { ...product, ...updates }
              : product
          ),
        })),

      modifyProductsObj: (productsObject) =>
        set((state) => {
          // Handle different input formats
          if (Array.isArray(productsObject)) {
            return { products: productsObject };
          }

          if (typeof productsObject === 'object' && productsObject !== null) {
            // If it's an object with products array
            if (
              productsObject.products &&
              Array.isArray(productsObject.products)
            ) {
              return { products: productsObject.products };
            }

            // If it's an object with data array
            if (productsObject.data && Array.isArray(productsObject.data)) {
              return { products: productsObject.data };
            }

            // If it's a single product object, add it to existing products
            return {
              products: [
                ...state.products.filter(
                  (p) => p.itemId !== productsObject.itemId
                ),
                productsObject,
              ],
            };
          }

          return state; // No changes if invalid input
        }),

      // ADD: Navigation helpers for different pages
      navigateToStrategyForm: (itemId) => {
        // This will be called by modifyProductsId (strategy-related)
        if (window.location.pathname.includes('/home')) {
          window.location.href = `/edit-listing/${itemId}?tab=strategy`;
        } else {
          window.location.href = `/pricing-strategies/${itemId}`;
        }
      },

      navigateToCompetitorDetails: (itemId) => {
        // This will be called by modifyProductsObj (competitor-related)
        if (window.location.pathname.includes('/home')) {
          window.location.href = `/edit-listing/${itemId}?tab=competitors`;
        } else {
          window.location.href = `/competitors/${itemId}`;
        }
      },

      // Enhanced functions with navigation context
      modifyProductsIdWithNavigation: (
        productId,
        updates,
        navigationType = 'strategy'
      ) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === productId ||
            product._id === productId ||
            product.itemId === productId
              ? { ...product, ...updates }
              : product
          ),
        }));

        // Navigate based on context
        const { navigateToStrategyForm } = get();
        if (navigationType === 'strategy') {
          navigateToStrategyForm(productId);
        }
      },

      modifyProductsObjWithNavigation: (
        productsObject,
        navigationType = 'competitor'
      ) => {
        const currentState = get();

        // Update products first
        currentState.modifyProductsObj(productsObject);

        // Extract itemId from the update
        let itemId = null;
        if (Array.isArray(productsObject) && productsObject.length > 0) {
          itemId = productsObject[0].itemId;
        } else if (productsObject.itemId) {
          itemId = productsObject.itemId;
        } else if (productsObject.data && productsObject.data.length > 0) {
          itemId = productsObject.data[0].itemId;
        }

        // Navigate based on context
        const { navigateToCompetitorDetails } = get();
        if (navigationType === 'competitor' && itemId) {
          navigateToCompetitorDetails(itemId);
        }
      },
    }),
    {
      name: 'product-store',
      partialize: (state) => ({
        products: state.products,
        strategies: state.strategies,
        competitorRules: state.competitorRules,
        lastFetch: state.lastFetch,
        searchTerm: state.searchTerm,
        entriesPerPage: state.entriesPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useProductStore;
