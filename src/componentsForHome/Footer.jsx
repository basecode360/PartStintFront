import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#2E3B4E',
        py: 2,
        px: 4,
        color: '#fff',
        fontSize: 14,
        textAlign: 'left',
        mt: 4
      }}
    >
      <Typography variant="body2">
        Copyright © 2025 Seller Bay Republic
      </Typography>
    </Box>
  );
}
