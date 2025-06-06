import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EditListing from "./pages/EditListing";
import CompetitorDetails from "./componentsForEditListing/CompetitorDetails";
import { userStore } from "./store/authStore";
import PriceStrategy from "./pages/PriceStrategy";
import EditProductPrice from "./pages/EditPrice";
import AddStrategy from "./pages/AddStrategy";
import CompetitorRule from "./pages/CompetitorRule";
import getValidAuthToken  from "../src/utils/authToken"; // Assuming this is the function to validate token

export default function AppRoutes() {
  // State to manage login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const user = userStore(store => store.user)
  const authToken = userStore(store => store.authToken)
  const location = useLocation();

  useEffect(() => {
    const checkToken = async () => {
        if (location.pathname !== "/login") {
            try {
            console.log("Token is valid, redirecting to home.", location.pathname);
          await getValidAuthToken(); // auto-refresh on any page except login
        } catch (err) {
          console.warn("Could not refresh token, possibly redirect to login.");
        }
      }
    };
    checkToken();
  }, [location.pathname]);

  const handleLogin = () => {
    setIsLoggedIn(true); // Set login state to true when the user logs in
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // Set login state to false when the user logs out
  };

  return (
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isLoggedIn || user || authToken ? "/home" : "/login"} />}
        />
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
        <Route
          path="/home"
          element={
            isLoggedIn || user ? (
              <Home handleLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="edit-listing" element={<EditListing />} />
          <Route path="edit-price" element={<EditProductPrice />} />
          <Route path="update-strategy" element={<PriceStrategy />} />
          <Route path="competitors/:itemId" element={<CompetitorDetails />} />
          <Route path="add-strategy" element={<AddStrategy />} />
          <Route path="add-competitor-rule" element={<CompetitorRule />} />

        </Route>
      </Routes>
  );
}

