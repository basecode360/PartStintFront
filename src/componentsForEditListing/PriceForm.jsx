import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Container,
  Modal
} from "@mui/material";
import { useProductStore } from "../store/productStore";
import apiService from "../api/apiService";
import { useNavigate } from "react-router-dom";

export default function EditPrice() {
  const { ItemId, AllProducts, modifyProductsObj, sku, modifyProductsArray } = useProductStore();
  const [product, setProduct] = useState([]);
  const [newPrice, setNewPrice] = useState(0);
  const [oldPrice, setOldPrice] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

  useEffect(() => {
    const productObj = AllProducts.filter((item) =>
      item.sku ? item.sku === sku : item.productId === ItemId
    );
    setProduct(productObj);
    modifyProductsObj(productObj);
  }, []);

  useEffect(() => {
    console.log("AllProducts updated:", product);
    console.log(`Item id =>  ${ItemId}`);
    if (product[0]) {
      let p = product[0].myPrice.split(" ");
      setOldPrice(p[1]);
      console.log("new price ", oldPrice);
    }
  }, [product, oldPrice]);

  const handlEditPrice = async () => {
    try {
      const response = await apiService.inventory.editPrice({
        itemId: product[0].productId,
        price: newPrice,
        sku: product[0].sku,
      });
      
      navigate("/home");
      modifyProductsArray(null);
      console.log(newPrice);
    } catch (error) {
      console.error("Error fetching eBay data:", error);
      setError(error.message);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Container>
        <Box sx={{ px: 4, py: 5, width: "100%", maxWidth: 700 }}>
          {/* Title */}
          <Typography
            variant="h5"
            fontWeight="bold"
            mb={3}
            sx={{ textAlign: "left", color: "#333" }}
          >
            Edit Price
          </Typography>

          {/* Product Info */}
          <Box mb={3} sx={{ textAlign: "center" }}>
            <Typography
              variant="body1"
              color="primary"
              fontWeight={600}
              sx={{ textAlign: "left", fontSize: "15px" }}
            >
              {product[0]?.productTitle}
              <br />
              <Typography variant="caption" color="text.secondary">
                {product[0]?.productId} |{" "}
                <span style={{ color: "#2E865F" }}>Active</span>
              </Typography>
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" display="flex" flexDirection="column" gap={3}>
           

            {/* Landed Price */}
            {oldPrice && (
              <TextField
                label="My Landed Price"
                defaultValue={oldPrice}
                sx={{
                  "& .MuiInputLabel-root": { fontSize: "16px" },
                  "& .MuiInputBase-root": { fontSize: "16px" },
                }}
              />
            )}

           

            {/* Max Price */}
            <TextField
              label="New Price (Landed)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              sx={{
                "& .MuiInputLabel-root": { fontSize: "16px" },
                "& .MuiInputBase-root": { fontSize: "16px" },
              }}
            />

            {/* Update Button */}
            <Button
              variant="contained"
              color="primary"
              sx={{
                padding: "12px 20px",
                fontWeight: 600,
                fontSize: "16px",
                borderRadius: "25px",
                "&:hover": {
                  backgroundColor: "#1976d2",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                },
                transition: "all 0.3s ease-in-out",
              }}
              onClick={() => {
                handlEditPrice();
                handleOpen();
              }}
            >
              Update
            </Button>

            {/* <Button onClick={handleOpen}>Open modal</Button> */}
            <Modal
              open={open}
              onClose={handleClose}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                  Price Changed
                </Typography>
              </Box>
            </Modal>
          </Box>
        </Box>
      </Container>
    </>
  );
}
