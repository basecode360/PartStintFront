import React from 'react';
import { Typography, Box, Container } from '@mui/material';

export default function ListingsHeading() {
  return (
    <Container>
      <>
        <Typography
          variant="h4" // Larger font size for improved readability
          sx={{
            fontWeight: 700, // Bold font for stronger visual presence
            fontFamily: `'Roboto', sans-serif`, // Clean, modern font
            fontSize: '29px', // Slightly larger font size
            color: '#333', // Darker text for contrast
            lineHeight: 1.5, // Better line spacing for easier reading
            textAlign: 'center', // Center align the heading
            transition: 'color 0.3s ease-in-out', // Smooth color transition on hover
          }}
        >
          View Active Listings - Set Min/Max Prices, Strategies & Competitors Individually
        </Typography>
      </>
    </Container>
  );
}
