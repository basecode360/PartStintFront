import React, { useEffect } from 'react';
import {
  Box,
  InputBase,
  MenuItem,
  Select,
  Typography,
  Container,
} from '@mui/material';
import useProductStore from '../store/productStore';

export default function EntriesAndSearchBar() {
  const { searchTerm, entriesPerPage, modifySearch, getFilteredProducts } =
    useProductStore();

  const { totalItems } = getFilteredProducts();

  const handleSearchChange = (e) => {
    modifySearch({ searchTerm: e.target.value });
  };

  const handleEntriesChange = (e) => {
    modifySearch({ entriesPerPage: parseInt(e.target.value) });
  };

  return (
    <Container sx={{ mt: 4, mb: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 4, py: 2 }}
      >
        {/* Show entries dropdown */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">Show</Typography>
          <Select
            size="small"
            value={entriesPerPage}
            onChange={handleEntriesChange}
            sx={{ minWidth: 70 }}
          >
            {[5, 10, 25, 50, 100].map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2">Entries</Typography>
        </Box>

        {/* Results count */}
        <Typography variant="body2" color="textSecondary">
          Showing {totalItems} result{totalItems !== 1 ? 's' : ''}
        </Typography>

        {/* Search bar */}
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          sx={{
            backgroundColor: '#f5f5f5', // Subtle background color to contrast the search bar
            borderRadius: 25, // Rounded corners for a modern feel
            px: 2,
            py: 1,
            width: 'fit-content', // Adjust width based on content
            transition: 'all 0.3s ease', // Smooth transition on hover
            '&:hover': {
              backgroundColor: '#e0e0e0', // Subtle hover effect
            },
          }}
        >
          {/* Search Label */}
          <Typography variant="body1" sx={{ fontWeight: 500, color: '#333' }}>
            Search:
          </Typography>

          {/* Search Input */}
          <InputBase
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{
              backgroundColor: '#ffffff',
              color: '#333',
              px: 2,
              py: 1.2,
              borderRadius: 25,
              fontSize: '16px', // Slightly bigger text for readability
              width: 220, // Increased width for better UX
              boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)', // Add shadow for depth
              '&:focus': {
                border: '2px solid #1976d2', // Focus border color
                boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.15)', // Glow effect on focus
              },
            }}
          />
        </Box>
      </Box>
    </Container>
  );
}
