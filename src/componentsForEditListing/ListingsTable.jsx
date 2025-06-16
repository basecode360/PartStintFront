import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import apiService from '../api/apiService';

export default function PriceChangeSubmissions() {
  const { productId } = useParams();
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch price history from MongoDB
  const fetchPriceHistory = async () => {
    try {
      setLoading(true);

      // Use the price history API to get MongoDB data
      const historyData = await apiService.priceHistory.getProductHistory(
        productId,
        100 // Get last 100 records
      );

      if (historyData.success && historyData.priceHistory) {
        setPriceHistory(historyData.priceHistory);
        setError(null);
      } else {
        setPriceHistory([]);
        setError('No price history found');
      }
    } catch (error) {
      console.error('📊 ❌ Error fetching price history from MongoDB:', error);
      setError(error.message || 'Failed to fetch price history');
      setPriceHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (priceHistory.length === 0) {
      return;
    }

    const headers = [
      'Sent Price',
      'Old Price',
      'Competition',
      'Strategy Name',
      'Min Price',
      'Max Price',
      'Status',
      'Submitted Date',
      'Submitted Time',
    ];

    const csvData = priceHistory.map((record) => [
      record.newPrice,
      record.oldPrice || 'N/A',
      record.competitorPrice || 'N/A',
      record.strategyName || 'Manual',
      record.minPrice || 'N/A',
      record.maxPrice || 'N/A',
      record.success ? 'Done' : 'Error',
      new Date(record.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      new Date(record.date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `price-history-${productId}-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch data when component mounts
  useEffect(() => {
    if (productId) {
      fetchPriceHistory();
    }
  }, [productId]);

  if (loading) {
    return (
      <Box sx={{ px: 4, py: 5, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 4, py: 10, width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            textAlign: 'left',
            fontFamily: "'Roboto', sans-serif",
            color: '#333',
          }}
        >
          Price Change Submissions (Last 100)
          <Chip
            label="MongoDB"
            size="small"
            color="success"
            variant="outlined"
            sx={{ ml: 2 }}
          />
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export to CSV">
            <IconButton
              onClick={exportToCSV}
              disabled={loading || priceHistory.length === 0}
              sx={{ color: '#4caf50' }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchPriceHistory}
              disabled={loading}
              sx={{ color: '#1976d2' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {priceHistory.length > 0 ? (
        <TableContainer
          sx={{
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {[
                  'Sent Price',
                  'Old Price',
                  'Competition',
                  'Strategy Name',
                  'Min Price',
                  'Max Price',
                  'Status',
                  'Submitted',
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      backgroundColor: '#f5f5f5',
                      fontSize: '16px',
                      color: '#333',
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography variant="body2">{header}</Typography>
                      <IconButton sx={{ padding: 0, marginLeft: 1 }}>
                        <ArrowDropDownIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {priceHistory.map((record, idx) => (
                <TableRow
                  key={record.id || idx}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f9f9f9',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      color: '#1976d2',
                      fontWeight: 'bold',
                    }}
                  >
                    ${record.newPrice}
                  </TableCell>
                  <TableCell
                    sx={{ textAlign: 'center', border: '1px solid #ddd' }}
                  >
                    ${record.oldPrice || 'N/A'}
                  </TableCell>
                  <TableCell
                    sx={{ textAlign: 'center', border: '1px solid #ddd' }}
                  >
                    ${record.competitorPrice || 'N/A'}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      color: '#1976d2',
                    }}
                  >
                    {record.strategyName || 'Manual'}
                  </TableCell>
                  <TableCell
                    sx={{ textAlign: 'center', border: '1px solid #ddd' }}
                  >
                    {record.minPrice ? `$${record.minPrice}` : 'N/A'}
                  </TableCell>
                  <TableCell
                    sx={{ textAlign: 'center', border: '1px solid #ddd' }}
                  >
                    {record.maxPrice ? `$${record.maxPrice}` : 'N/A'}
                  </TableCell>
                  <TableCell
                    sx={{ textAlign: 'center', border: '1px solid #ddd' }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: record.success ? '#4caf50' : '#f44336',
                        fontWeight: 'bold',
                      }}
                    >
                      {record.success ? 'Done' : 'Error'}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{ textAlign: 'center', border: '1px solid #ddd' }}
                  >
                    {new Date(record.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {new Date(record.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box
          sx={{
            p: 5,
            textAlign: 'center',
            border: '1px dashed #ccc',
            borderRadius: 1,
          }}
        >
          <Typography color="text.secondary">
            {loading
              ? 'Loading price history...'
              : 'No price changes recorded yet'}
          </Typography>
          {!loading && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              Price changes will appear here when strategies are executed
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
