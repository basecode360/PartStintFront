// src/componentForHome/ListingsTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Link,
  Box,
  Container,
  CircularProgress,
  AlertTitle,
  Alert,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProductStore } from '../store/productStore';

// Import your API service
import apiService from '../api/apiService';

export default function ListingsTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    modifyProductsArray,
    modifyProductsId,
    AllProducts,
    modifySku,
    searchProduct,
    modifyCompetitors,
    modifyProductsObj,
  } = useProductStore();

  // Fetch data from eBay when component mounts
  useEffect(() => {
    fetchEbayListings();
  }, []); // Only run once on mount

  useEffect(() => {
    if (AllProducts && AllProducts.length > 0) {
      setRows(AllProducts);
    }
  }, [AllProducts]);

  useEffect(() => {
    const searchP = searchProduct.toLowerCase();
    const filtered = AllProducts.filter(
      (row) =>
        row.productTitle?.toLowerCase().includes(searchP) ||
        row.sku?.toLowerCase().includes(searchP) ||
        row.status?.some((s) => s.toLowerCase().includes(searchP)) ||
        row.productId?.toLowerCase().includes(searchP)
    );
    setRows(filtered);
  }, [searchProduct, AllProducts]);

  const fetchEbayListings = async () => {
    try {
      setLoading(true);
      const response = await apiService.inventory.getActiveListings();
      if (response.success) {
        let ebayListings = [];
        if (
          response.data.GetMyeBaySellingResponse &&
          response.data.GetMyeBaySellingResponse.ActiveList.ItemArray
        ) {
          const itemArray =
            response.data.GetMyeBaySellingResponse.ActiveList.ItemArray;
          if (Array.isArray(itemArray.Item)) {
            ebayListings = itemArray.Item;
          } else if (itemArray.Item) {
            ebayListings = [itemArray.Item];
          }
        }

        const formattedListings = await Promise.all(
          ebayListings.map(async (item, index) => {
            const itemID = item.ItemID;
            if (!itemID) return null;
            try {
              const [competitorRes, strategyDisplayRes] = await Promise.all([
                apiService.inventory.getCompetitorPrice(itemID),
                apiService.pricingStrategies.getStrategyDisplayForProduct(
                  itemID
                ),
              ]);

              const { price, count } = competitorRes;
              const strategyDisplay = strategyDisplayRes?.data || {
                strategy: 'Assign Strategy',
                minPrice: 'Set',
                maxPrice: 'Set',
                hasStrategy: false,
              };

              return {
                productTitle: item.Title,
                productId: item.ItemID,
                sku: item.SKU || ' ',
                status: [
                  item.SellingStatus?.ListingStatus || 'Active',
                  item.ConditionDisplayName || 'New',
                  item.SellingStatus?.ListingStatus || 'Active',
                ],
                price: `USD ${parseFloat(item.BuyItNowPrice || 0).toFixed(2)}`,
                qty: parseInt(item.Quantity || '0', 10),
                myPrice: `USD ${parseFloat(item.BuyItNowPrice || 0).toFixed(
                  2
                )}`,
                competition: price,
                strategy: strategyDisplay.strategy,
                minPrice: strategyDisplay.minPrice,
                maxPrice: strategyDisplay.maxPrice,
                hasStrategy: strategyDisplay.hasStrategy,
                competitors: count,
              };
            } catch (error) {
              console.error(
                `❌ [${index + 1}/${
                  ebayListings.length
                }] Error fetching data for ${itemID}:`,
                error
              );
              return {
                productTitle: item.Title,
                productId: item.ItemID,
                sku: item.SKU || ' ',
                status: [
                  item.SellingStatus?.ListingStatus || 'Active',
                  item.ConditionDisplayName || 'New',
                  item.SellingStatus?.ListingStatus || 'Active',
                ],
                price: `USD ${parseFloat(item.BuyItNowPrice || 0).toFixed(2)}`,
                qty: parseInt(item.Quantity || '0', 10),
                myPrice: `USD ${parseFloat(item.BuyItNowPrice || 0).toFixed(
                  2
                )}`,
                competition: 'Error',
                strategy: 'Assign Strategy',
                minPrice: 'Set',
                maxPrice: 'Set',
                hasStrategy: false,
                competitors: 0,
              };
            }
          })
        );

        const validListings = formattedListings.filter(Boolean);
        if (validListings.length > 0) {
          setRows(validListings);
          modifyProductsArray(validListings);
        } else {
          setError('There are no products');
        }
      } else {
        setError('Failed to fetch eBay listings');
        console.error('API error:', response.error);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching eBay data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh strategy data for a specific item
  const refreshStrategyForItem = async (itemId) => {
    try {
      const strategyDisplayRes =
        await apiService.pricingStrategies.getStrategyDisplayForProduct(itemId);
      const strategyDisplay = strategyDisplayRes?.data || {
        strategy: 'Assign Strategy',
        minPrice: 'Set',
        maxPrice: 'Set',
        hasStrategy: false,
      };
      modifyProductsArray((products) =>
        products.map((product) =>
          product.productId === itemId
            ? {
                ...product,
                strategy: strategyDisplay.strategy,
                minPrice: strategyDisplay.minPrice,
                maxPrice: strategyDisplay.maxPrice,
                hasStrategy: strategyDisplay.hasStrategy,
              }
            : product
        )
      );
    } catch (error) {
      console.error(`❌ Error refreshing strategy for item ${itemId}:`, error);
    }
  };

  // Refresh all strategy data
  const refreshAllStrategies = async () => {
    try {
      setLoading(true);

      const updatedProducts = await Promise.all(
        AllProducts.map(async (product) => {
          try {
            const strategyDisplayRes =
              await apiService.pricingStrategies.getStrategyDisplayForProduct(
                product.productId
              );

            const strategyDisplay = strategyDisplayRes?.data || {
              strategy: 'Assign Strategy',
              minPrice: 'Set',
              maxPrice: 'Set',
              hasStrategy: false,
            };

            return {
              ...product,
              strategy: strategyDisplay.strategy,
              minPrice: strategyDisplay.minPrice,
              maxPrice: strategyDisplay.maxPrice,
              hasStrategy: strategyDisplay.hasStrategy,
            };
          } catch (error) {
            console.error(
              `Error refreshing strategy for ${product.productId}:`,
              error
            );
            return product; // Return original product if refresh fails
          }
        })
      );

      modifyProductsArray(updatedProducts);
    } catch (error) {
      console.error('❌ Error refreshing all strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for navigation back to refresh strategy data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh strategy data when user comes back to the page
        refreshAllStrategies();
      }
    };

    const handleFocus = () => {
      // Also refresh when window gets focus (more reliable for navigation)
      refreshAllStrategies();
    };

    // Add both visibility and focus listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [AllProducts]);

  // Also add a useEffect that runs when the component mounts or when we navigate back
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Small delay to ensure any pending strategy updates are completed
      if (AllProducts && AllProducts.length > 0) {
        refreshAllStrategies();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [location?.pathname]); // Add location dependency if using react-router

  // Check for strategy updates from localStorage with more aggressive checking
  useEffect(() => {
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('strategyUpdated');
      const lastPriceUpdate = localStorage.getItem('priceUpdated');

      if (lastUpdate || lastPriceUpdate) {
        const updateTime = parseInt(lastUpdate || lastPriceUpdate);
        const now = Date.now();

        // If update was within last 30 seconds, refresh
        if (now - updateTime < 30000) {
          // Clear all storage flags first
          localStorage.removeItem('strategyUpdated');
          localStorage.removeItem('priceUpdated');
          localStorage.removeItem('forceRefresh');

          // Force a complete refresh by clearing cache and refetching
          setLoading(true);
          fetchEbayListings();
        }
      }
    };

    // Check immediately on mount
    checkForUpdates();

    // Check very frequently for immediate updates
    const interval = setInterval(checkForUpdates, 200); // Check every 200ms
    return () => clearInterval(interval);
  }, [location.pathname]);

  if (loading) {
    return (
      <Container
        sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'center', py: 5 }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, mb: 2 }}>
        <Typography color="error" variant="h6" textAlign="center">
          Error loading listings: {error}
        </Typography>
        <Typography textAlign="center" mt={2}>
          Showing sample data as fallback
        </Typography>
        {/* Render table with sample data */}
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h1">
          Active Listings - Strategy Managed
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 2, border: '1px solid #ddd' }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: '#ffffff',
                borderBottom: '2px solid #e0e0e0',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  backgroundColor: '#f9f9f9',
                },
                transition: 'background-color 0.3s ease',
              }}
            >
              {[
                'Product',
                'Qty',
                'My Price',
                'Competitors Rule',
                'Competition',
                'Strategy',
                'Min Price',
                'Max Price',
                'Competitors',
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: '600',
                    fontSize: '15px',
                    padding: '8px',
                    borderRight: '1px solid #ddd',
                    color: '#333',
                    backgroundColor: '#fafafa',
                    textAlign: 'left',
                    '&:last-child': {
                      borderRight: 'none',
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#1976d2',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {AllProducts.map((row, idx) => (
              <TableRow
                key={idx}
                sx={{
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Box>
                    <Link
                      href="#"
                      underline="hover"
                      color="primary"
                      fontSize={16}
                      sx={{ fontWeight: 600 }}
                    >
                      {row.productTitle}
                    </Link>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      display="block"
                      sx={{ fontSize: '14px' }}
                    >
                      {row.productId} |{' '}
                      {row.status.map((s, i) => (
                        <Typography
                          key={i}
                          component="span"
                          sx={{
                            fontSize: '14px',
                            color: s === 'Active' ? '#1e852b' : 'gray',
                            mx: 0.5,
                          }}
                        >
                          {s}
                        </Typography>
                      ))}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  {row.qty}
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  {row.myPrice}
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography
                    color="primary"
                    sx={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '16px',
                    }}
                    onClick={() => {
                      modifyProductsId(row.productId);
                      modifySku(row.sku ? row.sku : '');
                      navigate(`/home/update-strategy/${row.productId}`);
                    }}
                  >
                    Assign Rule
                  </Typography>
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  {row.competition}
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Typography
                      color="primary"
                      sx={{
                        cursor: 'pointer',
                        fontSize: '16px',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                      onClick={() => {
                        modifyProductsId(row.productId);
                        modifySku(row.sku ? row.sku : '');
                        navigate(`/home/update-strategy/${row.productId}`);
                      }}
                    >
                      {row.strategy}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography
                    color="primary"
                    sx={{
                      cursor: 'pointer',
                      fontSize: '16px',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    onClick={() =>
                      navigate(`/home/update-strategy/${row.productId}`)
                    }
                  >
                    {row.minPrice}
                  </Typography>
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography
                    color="primary"
                    sx={{
                      cursor: 'pointer',
                      fontSize: '16px',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    onClick={() =>
                      navigate(`/home/update-strategy/${row.productId}`)
                    }
                  >
                    {row.maxPrice}
                  </Typography>
                </TableCell>

                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography
                    color="primary"
                    sx={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '16px',
                    }}
                    onClick={() => {
                      modifyProductsObj(row);
                      navigate(`/home/competitors/${row.productId}`);
                    }}
                  >
                    {row.competitors}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
