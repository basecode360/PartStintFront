import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const rows = [
  {
    sentPrice: 279.98,
    oldPrice: 279.95,
    competition: 280.00,
    strategyName: "0.02 low price",
    minPrice: 278.00,
    maxPrice: 350.00,
    status: "Done",
    submitted: "Feb 22, 2025 19:30",
  },
  {
    sentPrice: 279.98,
    oldPrice: 279.88,
    competition: 280.00,
    strategyName: "0.02 low price",
    minPrice: 278.00,
    maxPrice: 350.00,
    status: "Done",
    submitted: "Feb 15, 2025 17:30",
  },
  {
    sentPrice: 279.88,
    oldPrice: 280.00,
    competition: 280.00,
    strategyName: "0.12 low price",
    minPrice: 267.00,
    maxPrice: 350.00,
    status: "Done",
    submitted: "Feb 13, 2025 16:30",
  },
];

export default function PriceChangeSubmissions() {
  return (
    <Box sx={{ px: 4, py: 5, width: "100%", maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" fontWeight="bold" mb={3} sx={{ textAlign: "left", fontFamily: "'Roboto', sans-serif", color: "#333" }}>
        Price Change Submissions (Last 100)
      </Typography>

      <TableContainer sx={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {[
                "Sent Price",
                "Old Price",
                "Competition",
                "Strategy Name",
                "Min Price",
                "Max Price",
                "Status",
                "Submitted",
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    border: "1px solid #ddd",
                    backgroundColor: "#f5f5f5",
                    fontSize: "16px",
                    color: "#333",
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center">
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
            {rows.map((row, idx) => (
              <TableRow
                key={idx}
                sx={{
                  "&:hover": {
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.sentPrice}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.oldPrice}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.competition}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.strategyName}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.minPrice}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.maxPrice}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.status}</TableCell>
                <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{row.submitted}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
