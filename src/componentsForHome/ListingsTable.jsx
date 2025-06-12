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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/productStore';

// Import your API service
import apiService from '../api/apiService';

export default function ListingsTable() {
  const navigate = useNavigate();
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
    if (AllProducts && AllProducts.length > 0 && AllProducts[0].productId) {
      setLoading(false);
      return;
    }
    fetchEbayListings();
  }, []);

  // useEffect(() => {
  //   console.log("AllProducts updated:", AllProducts);
  //   console.log(`Item id =>  ${ItemId}`)
  // }, [AllProducts]);

  useEffect(() => {
    if (!searchProduct) {
      setRows(AllProducts);
      return;
    }
    const searchP = searchProduct.toLowerCase();
    const filtered = rows.filter(
      (row) =>
        row.productTitle.toLowerCase().includes(searchP) ||
        row.sku?.toLowerCase().includes(searchP) ||
        row.productId.toLowerCase().includes(searchP) ||
        row.status.some((s) => s.toLowerCase().includes(searchP))
    );

    setRows(filtered);
  }, [searchProduct]);

  // // Helper to fetch competitor price
  // const fetchCompetitorPrice = async (itemId) => {
  //   const result = await apiService.inventory.getCompetitorPrice(itemId);
  //   if (result.success && result.competitorPrices.length > 0) {
  //     return `USD${parseFloat(result.competitorPrices[0]).toFixed(2)}`;
  //   }
  //   return "N/A";
  // };

  const fetchEbayListings = async () => {
    try {
      setLoading(true);
      // Fetch active listings from eBay API
      const response = await apiService.inventory.getActiveListings();
      if (response.success) {
        console.log('eBay data received:', response.data);
        // Process the data for your table
        let ebayListings = [];
        if (
          response.data.GetMyeBaySellingResponse &&
          response.data.GetMyeBaySellingResponse.ActiveList &&
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

        // Transform the eBay data to match your table structure (async/await version)
        const formattedListings = [];

        for (const item of ebayListings) {
          const hasVariations = Array.isArray(item.Variations?.Variation);
          const itemID = item.ItemID;
          const response = await apiService.inventory.getCompetitorPrice(
            itemID
          );
          response.itemID = itemID;
          const { price, count } = response;
          console.log('Competitor Price => ', price, 'Count => ', count);
          modifyCompetitors(response.productInfo);
          console.log('Competitors => ', response.productInfo);
          if (hasVariations) {
            for (const variation of item.Variations.Variation) {
              formattedListings.push({
                productTitle: variation.VariationTitle,
                productId: item.ItemID,
                sku: variation.SKU,
                status: [
                  item.ConditionDisplayName || 'New',
                  item.SellingStatus?.ListingStatus || 'Active',
                ],
                qty: parseInt(variation.Quantity || item.Quantity || '0', 10),
                myPrice: `USD ${parseFloat(
                  variation.StartPrice || item.BuyItNowPrice || 0
                ).toFixed(2)}`,
                competition: price,
                strategy: '0.01',
                minPrice: `USD${(
                  parseFloat(item.CurrentPrice?.Value || 0) - 10
                ).toFixed(2)}`,
                maxPrice: `USD${(
                  parseFloat(item.CurrentPrice?.Value || 0) + 20
                ).toFixed(2)}`,
                competitors: count == 1 ? 0 : count,
              });
            }
          } else {
            formattedListings.push({
              productTitle: item.Title,
              productId: item.ItemID,
              sku: item.SKU || ' ',
              status: [
                item.ConditionDisplayName || 'New',
                item.SellingStatus?.ListingStatus || 'Active',
              ],
              qty: parseInt(item.Quantity || '0', 10),
              myPrice: `USD ${parseFloat(item.BuyItNowPrice || 0).toFixed(2)}`,
              competition: price,
              strategy: '0.01',
              minPrice: `USD${(
                parseFloat(item.CurrentPrice?.Value || 0) - 10
              ).toFixed(2)}`,
              maxPrice: `USD${(
                parseFloat(item.CurrentPrice?.Value || 0) + 20
              ).toFixed(2)}`,
              competitors: count == 1 ? 0 : count,
            });
          }
        }

        if (formattedListings.length > 0) {
          setRows(formattedListings);
          modifyProductsArray(formattedListings);
          console.log('modufy pr  => ', formattedListings);
        } else {
          // Fall back to sample data if no listings found
          setError('There are no products');
        }
      } else {
        console.error('API error:', response.error);
        setError('Failed to fetch eBay listings');

        // Use sample data as fallback
        setRows([
          {
            productTitle:
              'Front Fog Light Cover Right Passenger Side Textured For 2013-2015 Nissan Altima',
            productId: '186855612214',
            status: ['New', 'Active'],
            qty: 9,
            myPrice: 'USD7.74',
            competition: 'USD7.75',
            strategy: '0.01',
            minPrice: 'USD7.00',
            maxPrice: 'USD25.00',
            competitors: 13,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching eBay data:', error);
      setError(error.message);

      // Use sample data as fallback
      setRows([
        {
          productTitle:
            'Front Fog Light Cover Right Passenger Side Textured For 2013-2015 Nissan Altima',
          productId: '186855612214',
          status: ['New', 'Active'],
          qty: 9,
          myPrice: 'USD7.74',
          competition: 'USD7.75',
          strategy: '0.01',
          minPrice: 'USD7.00',
          maxPrice: 'USD25.00',
          competitors: 13,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
                'Actions',
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: '600',
                    fontSize: '15px',
                    textAlign: 'left',
                    padding: '8px',
                    borderRight: '1px solid #ddd',
                    color: '#333',
                    backgroundColor: '#fafafa',
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
                          color={s === 'Active' ? '#1e852b' : 'gray'}
                          sx={{ mx: 0.5 }}
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
                      navigate('/home/edit-listing');
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
                    onClick={() => navigate('/home/edit-listing')}
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
                    onClick={() => navigate('/home/edit-listing')}
                  >
                    {row.maxPrice}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    border: '1px solid #ddd',
                    padding: '16px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    modifyProductsObj(row);
                    navigate(`/home/competitors/${row.productId}`);
                  }}
                >
                  <Typography
                    color="primary"
                    sx={{
                      fontSize: '16px',
                      textDecoration: 'underline',
                    }}
                  >
                    {row.competitors}
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
                    onClick={() => {
                      modifyProductsId(row.productId);
                      modifySku(row.sku ? row.sku : '');
                      navigate('/home/edit-price');
                    }}
                  >
                    Edit Price
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
