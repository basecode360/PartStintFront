import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  CircularProgress,
} from '@mui/material';
import apiService from '../api/apiService';
import { useProductStore } from '../store/productStore';

export default function CompetitorPricesPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [competitorData, setCompetitorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decliningCompetitor, setDecliningCompetitor] = useState(null);
  const [myItemTitle, setMyItemTitle] = useState('');
  const competitors = useProductStore((state) => state.competitors);
  const productObj = useProductStore((state) => state.productObj);
  //
  useEffect(() => {
    async function fetchData() {
      try {
        // Call both APIs concurrently
        const [competitorResponse, manualCompetitorsResponse] =
          await Promise.all([
            apiService.inventory.getCompetitorPrice(itemId),
            apiService.inventory.getManuallyAddedCompetitors(itemId),
          ]);

        if (productObj.title) setMyItemTitle(productObj.title);

        let allCompetitors = [];

        // Process API search results
        if (
          competitorResponse.success !== false &&
          competitorResponse.productInfo &&
          competitorResponse.productInfo.length > 0
        ) {
          const apiCompetitors = competitorResponse.productInfo.map((p, i) => ({
            id: p.id || `comp-${i}`,
            title: p.title,
            imageurl: p.imageurl,
            country: p.locale || 'Unknown',
            image: p.imageurl,
            url: p.productUrl,
            price: p.price,
            currency: 'USD',
            mpn: 'None',
            upc: 'None',
            ean: 'None',
            isbn: 'None',
            source: 'API Search',
          }));
          allCompetitors = [...allCompetitors, ...apiCompetitors];
        }

        // Process manually added competitors
        if (
          manualCompetitorsResponse.success &&
          manualCompetitorsResponse.competitors
        ) {
          const manualCompetitors = manualCompetitorsResponse.competitors.map(
            (comp) => ({
              id: `manual-${comp.itemId}`,
              title: comp.title,
              imageurl: comp.imageUrl,
              country: comp.locale || 'US',
              image: comp.imageUrl,
              url: comp.productUrl,
              price: comp.price,
              currency: comp.currency || 'USD',
              mpn: 'None',
              upc: 'None',
              ean: 'None',
              isbn: 'None',
              source: 'Manual',
              addedAt: comp.addedAt,
            })
          );
          allCompetitors = [...allCompetitors, ...manualCompetitors];
        }

        // Fallback to store data if no API data
        if (allCompetitors.length === 0 && competitors.length > 0) {
          const detailed = competitors.map((p, i) => ({
            id: p.id,
            title: p.title,
            imageurl: p.imageurl,
            country: p.locale,
            image: p.imageurl,
            url: p.productUrl,
            price: p.price,
            currency: p.currency,
            mpn: 'None',
            upc: 'None',
            ean: 'None',
            isbn: 'None',
            source: 'Store',
          }));
          allCompetitors = detailed;
        }

        if (allCompetitors.length === 0) {
          setError('No competitor listings found.');
        } else {
          setCompetitorData(allCompetitors);
        }
      } catch (err) {
        console.error('Error fetching competitor data:', err);
        setError('Failed to fetch competitor data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [itemId]);

  const handleAccept = async (comp) => {
    try {
      const numericPrice = parseFloat(comp.price);
      const response = await apiService.inventory.editPrice({
        itemId,
        newPrice: numericPrice,
        reason: 'Accepted competitor price',
      });

      if (response.success) {
        setAcceptedId(comp.id);
        alert(`Updated price to USD ${numericPrice}`);
      } else {
        alert('Failed to update price.');
      }
    } catch (err) {
      alert('An error occurred while updating price.');
    }
  };

  const handleDecline = async (competitorId) => {
    setDecliningCompetitor(competitorId);

    try {
      // Check if this is a manual competitor (starts with 'manual-')
      if (competitorId.startsWith('manual-')) {
        const competitorItemId = competitorId.replace('manual-', '');
        const response = await apiService.inventory.removeManualCompetitor(
          itemId,
          competitorItemId
        );

        if (response.success) {
          // Remove from local state
          setCompetitorData((prev) =>
            prev.filter((comp) => comp.id !== competitorId)
          );
          // You could show a success message here if needed
        } else {
          setError('Failed to remove competitor: ' + response.error);
        }
      } else {
        // For API competitors, you might want to implement a different removal method
        // or just remove from local state
        setCompetitorData((prev) =>
          prev.filter((comp) => comp.id !== competitorId)
        );
      }
    } catch (err) {
      console.error('Error removing competitor:', err);
      setError('An error occurred while removing the competitor');
    } finally {
      setDecliningCompetitor(null);
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 10 }}>
      <Typography variant="h5" gutterBottom>
        Competitor Listing For: {myItemTitle || itemId}
      </Typography>{' '}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/home/add-competitor-manually/${itemId}`)}
        >
          Add Competitor Manually
        </Button>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          {/* Detailed Table */}
          <Paper>
            <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
              Detailed Competitor Listings
            </Typography>{' '}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {competitorData.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell>
                      <Link href={comp.url} target="_blank" underline="hover">
                        {comp.title}
                      </Link>
                      <Typography variant="caption" color="textSecondary">
                        MPN: {comp.mpn} | UPC: {comp.upc} | EAN: {comp.ean} |
                        ISBN: {comp.isbn}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {comp.currency} {parseFloat(comp.price).toFixed(2)}
                    </TableCell>
                    <TableCell>{comp.country}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          backgroundColor:
                            comp.source === 'Manual' ? '#e3f2fd' : '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        {comp.source || 'API'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {comp.image ? (
                        <img src={comp.image} alt="thumb" width={80} />
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          No image
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDecline(comp.id)}
                          disabled={decliningCompetitor === comp.id}
                          startIcon={
                            decliningCompetitor === comp.id ? (
                              <CircularProgress size={16} />
                            ) : null
                          }
                        >
                          {decliningCompetitor === comp.id
                            ? 'Removing...'
                            : 'Decline'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Container>
  );
}
