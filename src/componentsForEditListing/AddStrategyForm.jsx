import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Collapse,
  IconButton,
  CircularProgress,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useProductStore } from '../store/productStore';
import { useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';

export default function AddStrategyPage() {
  const { ItemId, AllProducts, modifyProductsObj, sku } = useProductStore();
  const [product, setProduct] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    strategyName: '',
    repricingRule: '',
    beatByType: '', // "AMOUNT" or "PERCENTAGE"
    beatByValue: '',
    stayAboveType: '', // "AMOUNT" or "PERCENTAGE"
    stayAboveValue: '',
    noCompetitionAction: 'USE_MAX_PRICE',
    maxPrice: '',
    minPrice: '',
    assignToActiveListings: false,
  });

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  // Effect to fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const productObj = AllProducts.filter((item) =>
          item.sku ? item.sku === sku : item.productId === ItemId
        );

        if (productObj.length === 0) {
          setError('Product not found');
          return;
        }

        setProduct(productObj);
        modifyProductsObj(productObj);

        // Set default prices from product data
        if (productObj[0]?.myPrice) {
          const priceString = productObj[0].myPrice;
          const priceValue = priceString.includes(' ')
            ? priceString.split(' ')[1]
            : priceString.replace(/[^0-9.]/g, '');

          setFormData((prev) => ({
            ...prev,
            minPrice: (parseFloat(priceValue) * 0.9).toFixed(2),
            maxPrice: (parseFloat(priceValue) * 1.5).toFixed(2),
          }));
        }
      } catch (err) {
        setError('Error loading product data: ' + err.message);
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (ItemId) {
      fetchProductData();
    }
  }, [ItemId, AllProducts, modifyProductsObj]);

  // Handle input changes
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle repricing rule change
  const handleRepricingRuleChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      repricingRule: value,
      // Reset dependent fields when rule changes
      beatByType: '',
      beatByValue: '',
      stayAboveType: '',
      stayAboveValue: '',
    }));
  };

  // Show alert
  const showAlert = (message, severity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);

    if (severity === 'success') {
      setTimeout(() => {
        setAlertOpen(false);
      }, 5000);
    }
  };

  // Create pricing strategy payload
  const getPricingStrategyPayload = () => {
    const payload = {
      strategyName: formData.strategyName,
      repricingRule: formData.repricingRule,
      noCompetitionAction: formData.noCompetitionAction,
    };

    if (formData.minPrice) {
      payload.minPrice = parseFloat(formData.minPrice);
    }
    if (formData.maxPrice) {
      payload.maxPrice = parseFloat(formData.maxPrice);
    }

    // Add strategy-specific parameters
    if (formData.repricingRule === 'BEAT_LOWEST') {
      if (formData.beatByType === 'AMOUNT') {
        payload.beatBy = 'AMOUNT';
        payload.value = parseFloat(formData.beatByValue);
      } else if (formData.beatByType === 'PERCENTAGE') {
        payload.beatBy = 'PERCENTAGE';
        payload.value = parseFloat(formData.beatByValue) / 100; // Convert to decimal
      }
    } else if (formData.repricingRule === 'STAY_ABOVE') {
      if (formData.stayAboveType === 'AMOUNT') {
        payload.stayAboveBy = 'AMOUNT';
        payload.value = parseFloat(formData.stayAboveValue);
      } else if (formData.stayAboveType === 'PERCENTAGE') {
        payload.stayAboveBy = 'PERCENTAGE';
        payload.value = parseFloat(formData.stayAboveValue) / 100; // Convert to decimal
      }
    }

    return payload;
  };

  // Handle Add Strategy button
  const handleAddStrategy = async () => {
    try {
      setSubmitting(true);

      // Debug token before making request
      let token;
      try {
        const userStore = JSON.parse(localStorage.getItem('app_jwt') || '{}');
        token =
          userStore?.state?.user?.token || localStorage.getItem('app_jwt');
      } catch {
        token = localStorage.getItem('app_jwt');
      }

      

      if (!token) {
        showAlert(
          'No authentication token found. Please log in again.',
          'error'
        );
        return;
      }

      // Validate required fields
      if (!formData.strategyName) {
        showAlert('Strategy name is required', 'error');
        return;
      }
      if (!formData.repricingRule) {
        showAlert('Repricing rule is required', 'error');
        return;
      }

      // Validate strategy-specific fields
      if (formData.repricingRule === 'BEAT_LOWEST') {
        if (!formData.beatByType || !formData.beatByValue) {
          showAlert(
            'Beat by type and value are required for Beat Lowest strategy',
            'error'
          );
          return;
        }
      } else if (formData.repricingRule === 'STAY_ABOVE') {
        if (!formData.stayAboveType || !formData.stayAboveValue) {
          showAlert(
            'Stay above type and value are required for Stay Above strategy',
            'error'
          );
          return;
        }
      }

      const strategyPayload = getPricingStrategyPayload();
      

      let response;
      if (formData.assignToActiveListings) {
        // Create strategy and apply to all active listings
        const strategyResp = await apiService.pricingStrategies.createStrategy(
          strategyPayload
        );
        if (strategyResp.success) {
          // Apply to all active listings would need a separate endpoint
          showAlert('Pricing strategy created successfully!', 'success');
          response = strategyResp;
        } else {
          throw new Error(strategyResp.message || 'Failed to create strategy');
        }
      } else {
        // Create strategy and apply to specific product
        response = await apiService.pricingStrategies.createStrategyOnProduct(
          ItemId,
          strategyPayload
        );
        showAlert(
          'Pricing strategy created and applied to product!',
          'success'
        );
      }

      

      // Navigate back after success
      setTimeout(() => {
        navigate(-1); // Go back to previous page
      }, 2000);
    } catch (error) {
      console.error('Error creating pricing strategy:', error);
      if (error.message.includes('Authentication failed')) {
        showAlert(
          'Authentication failed. Please refresh the page and try again.',
          'error'
        );
      } else {
        showAlert(`Error: ${error.message}`, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !product.length) {
    return (
      <Container>
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            {error}
            <Button
              variant="outlined"
              size="small"
              sx={{ ml: 2 }}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ px: 4, py: 5, width: '100%', maxWidth: 700 }}>
        {/* Alert */}
        <Collapse in={alertOpen}>
          <Alert
            severity={alertSeverity}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setAlertOpen(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {alertMessage}
          </Alert>
        </Collapse>

        {/* Title */}
        <Typography
          variant="h5"
          fontWeight="bold"
          mb={3}
          sx={{ textAlign: 'left', color: '#333' }}
        >
          Add Pricing Strategy
        </Typography>

        {/* Product Info */}
        <Box mb={3}>
          <Typography
            variant="body1"
            color="primary"
            fontWeight={600}
            sx={{ textAlign: 'left', fontSize: '15px' }}
          >
            {product[0]?.productTitle || 'Product'}
            <br />
            <Typography variant="caption" color="text.secondary">
              {product[0]?.productId || ItemId} |{' '}
              <span style={{ color: '#2E865F' }}>Active</span>
            </Typography>
          </Typography>
        </Box>

        <Box component="form" display="flex" flexDirection="column" gap={3}>
          {/* Strategy Name */}
          <TextField
            label="Strategy Name"
            name="strategyName"
            value={formData.strategyName}
            onChange={handleInputChange}
            required
            placeholder="e.g. Beat Competitors by $5"
            sx={{
              '& .MuiInputLabel-root': { fontSize: '16px' },
              '& .MuiInputBase-root': { fontSize: '16px' },
            }}
          />

          {/* Repricing Rule */}
          <TextField
            select
            label="Repricing Rule"
            name="repricingRule"
            value={formData.repricingRule}
            onChange={handleRepricingRuleChange}
            required
            sx={{
              '& .MuiInputLabel-root': { fontSize: '16px' },
              '& .MuiInputBase-root': { fontSize: '16px' },
            }}
          >
            <MenuItem value="">Select a rule</MenuItem>
            <MenuItem value="MATCH_LOWEST">Match Lowest Price</MenuItem>
            <MenuItem value="BEAT_LOWEST">Below the Lowest Price</MenuItem>
            <MenuItem value="STAY_ABOVE">Above the Lowest Price</MenuItem>
          </TextField>

          {/* Show additional fields based on repricing rule */}
          {formData.repricingRule === 'BEAT_LOWEST' && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Beat By"
                  name="beatByType"
                  value={formData.beatByType}
                  onChange={handleInputChange}
                  fullWidth
                  required
                >
                  <MenuItem value="">Select type</MenuItem>
                  <MenuItem value="AMOUNT">Amount ($)</MenuItem>
                  <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={
                    formData.beatByType === 'PERCENTAGE'
                      ? 'Percentage'
                      : 'Amount'
                  }
                  name="beatByValue"
                  value={formData.beatByValue}
                  onChange={handleInputChange}
                  placeholder={
                    formData.beatByType === 'PERCENTAGE'
                      ? 'e.g. 10'
                      : 'e.g. 5.00'
                  }
                  type="number"
                  inputProps={{
                    step: formData.beatByType === 'PERCENTAGE' ? '1' : '0.01',
                    min: '0',
                  }}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>
          )}

          {formData.repricingRule === 'STAY_ABOVE' && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Stay Above By"
                  name="stayAboveType"
                  value={formData.stayAboveType}
                  onChange={handleInputChange}
                  fullWidth
                  required
                >
                  <MenuItem value="">Select type</MenuItem>
                  <MenuItem value="AMOUNT">Amount ($)</MenuItem>
                  <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={
                    formData.stayAboveType === 'PERCENTAGE'
                      ? 'Percentage'
                      : 'Amount'
                  }
                  name="stayAboveValue"
                  value={formData.stayAboveValue}
                  onChange={handleInputChange}
                  placeholder={
                    formData.stayAboveType === 'PERCENTAGE'
                      ? 'e.g. 15'
                      : 'e.g. 10.00'
                  }
                  type="number"
                  inputProps={{
                    step:
                      formData.stayAboveType === 'PERCENTAGE' ? '1' : '0.01',
                    min: '0',
                  }}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>
          )}

          {/* Advanced Options */}
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: '#333', mt: 2 }}
          >
            Advanced Options
          </Typography>

          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={4}>
              <Typography>If there is no competition</Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                select
                name="noCompetitionAction"
                value={formData.noCompetitionAction}
                onChange={handleInputChange}
                fullWidth
                sx={{ '& .MuiInputBase-root': { fontSize: '14px' } }}
              >
                <MenuItem value="USE_MAX_PRICE">Use Max Price</MenuItem>
                <MenuItem value="USE_MIN_PRICE">Use Min Price</MenuItem>
                <MenuItem value="KEEP_CURRENT">Keep Current Price</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Price Constraints */}
          <TextField
            label="Min Price"
            name="minPrice"
            value={formData.minPrice}
            onChange={handleInputChange}
            type="number"
            inputProps={{ step: '0.01', min: '0' }}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '16px' },
              '& .MuiInputBase-root': { fontSize: '16px' },
            }}
          />

          <TextField
            label="Max Price"
            name="maxPrice"
            value={formData.maxPrice}
            onChange={handleInputChange}
            type="number"
            inputProps={{ step: '0.01', min: '0' }}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '16px' },
              '& .MuiInputBase-root': { fontSize: '16px' },
            }}
          />

          {/* Assign to Active Listings Checkbox */}
          <Box mt={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.assignToActiveListings}
                  onChange={handleInputChange}
                  name="assignToActiveListings"
                />
              }
              label="Assign this strategy now to all my active listings."
            />
          </Box>

          {/* Add Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddStrategy}
            disabled={submitting}
            sx={{
              padding: '12px 20px',
              width: '120px',
              fontWeight: 600,
              fontSize: '16px',
              borderRadius: '25px',
              '&:hover': {
                backgroundColor: '#1976d2',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Add Strategy'
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
