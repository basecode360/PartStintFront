import React from 'react';
import { Box, Typography, Menu, MenuItem, IconButton } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useNavigate } from 'react-router-dom';

const tabs = [{ label: 'Listings', hasDropdown: false, route: '/' }];

export default function NavTabs({ activeTab = 'Listings' }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuTab, setMenuTab] = React.useState('');
  const navigate = useNavigate(); // Initialize the navigate function

  const handleMenuOpen = (event, tab) => {
    setAnchorEl(event.currentTarget);
    setMenuTab(tab);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTab('');
  };

  const handleTabClick = (route) => {
    navigate(route); // Navigate to the respective route when a tab is clicked
  };

  return (
    <Box
      display="flex"
      justifyContent="center" // Center the tabs
      sx={{
        backgroundColor: '#fff',
        borderBottom: '2px solid #ccc',
        py: 2,
        width: '100%', // Make navbar full width
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', // Add subtle shadow for a modern effect
        justifyContent: 'space-around',
        gap: 50,
      }}
    >
      {tabs.map(({ label, hasDropdown, route }) => {
        const isActive = label === activeTab;
        return (
          <Box
            key={label}
            display="flex"
            alignItems="center"
            sx={{
              cursor: 'pointer',
              padding: '0 15px', // Add padding between each tab
              borderRadius: 2, // Rounded corners for each tab
              '&:hover': {
                backgroundColor: '#f5f5f5', // Light hover effect
              },
            }}
            onClick={() => handleTabClick(route)} // Redirect to the selected route
          >
            <Typography
              variant="h6" // Increased font size for better readability
              sx={{
                fontWeight: isActive ? 'bold' : 'medium',
                color: isActive ? '#1976d2' : '#666', // Blue for active tab
                borderBottom: isActive ? '2px solid #1976d2' : 'none',
                pb: 0.5,
                transition: 'all 0.3s ease-in-out', // Smooth transition for hover and active state
              }}
            >
              {label}
            </Typography>
            {hasDropdown && (
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, label)}
                sx={{
                  color: isActive ? '#1976d2' : '#999',
                  padding: 0,
                  ml: 1,
                  transition: 'color 0.3s ease-in-out', // Smooth transition for icon color
                  '&:hover': { color: '#1976d2' },
                }}
              >
                <ArrowDropDownIcon />
              </IconButton>
            )}
          </Box>
        );
      })}

      {/* Dropdown Menu for Active Tabs */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>{menuTab} Option 1</MenuItem>
        <MenuItem onClick={handleMenuClose}>{menuTab} Option 2</MenuItem>
      </Menu>
    </Box>
  );
}
