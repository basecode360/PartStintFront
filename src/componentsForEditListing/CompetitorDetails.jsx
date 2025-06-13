import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  Button,
  Link,
} from '@mui/material';
import apiService from '../api/apiService';
import { useProductStore } from '../store/productStore';

export default function CompetitorPricesPage() {
  const { itemId } = useParams();
  const [loading, setLoading] = useState(true);
  const [competitorData, setCompetitorData] = useState([]);
  const [myItemTitle, setMyItemTitle] = useState('');
  const [error, setError] = useState(null);
  const [acceptedId, setAcceptedId] = useState(null);
  const competitors = useProductStore((state) => state.competitors);
  const productObj = useProductStore((state) => state.productObj);
  // 
  useEffect(() => {
    async function fetchData() {
      try {
        // Call the actual competitor prices API
        
        const competitorResponse =
          await apiService.inventory.getCompetitorPrice(itemId);

        

        if (productObj.title) setMyItemTitle(productObj.title);

        // Use API response data instead of store data
        if (
          competitorResponse.success !== false &&
          competitorResponse.productInfo &&
          competitorResponse.productInfo.length > 0
        ) {
          const detailed = competitorResponse.productInfo.map((p, i) => ({
            id: p.id || `comp-${i}`,
            title: p.title,
            imageurl: p.imageurl,
            country: p.locale || 'Unknown',
            image: p.imageurl,
            url: p.productUrl,
            price: p.price,
            currency: 'USD', // Default currency
            mpn: 'None',
            upc: 'None',
            ean: 'None',
            isbn: 'None',
          }));

          
          setCompetitorData(detailed);
        } else {
          // Fallback to store data if API doesn't return data
          if (competitors.length > 0) {
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
            }));
            setCompetitorData(detailed);
          } else {
            setError('No competitor listings found.');
          }
        }
      } catch (err) {
        console.error('Error fetching competitor prices:', err);
        setError('Failed to fetch competitor prices.');
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

  const handleDecline = (id) => {
    setCompetitorData((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Competitor Listing For: {myItemTitle || itemId}
      </Typography>

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
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Country</TableCell>
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
                      <img src={comp.image} alt="thumb" width={80} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDecline(comp.id)}
                        >
                          Decline
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
