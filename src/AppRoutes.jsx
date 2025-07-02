// src/AppRoutes.jsx
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import useAuthStore from './store/authStore'; // Fixed import
import getValidAuthToken from './utils/getValidAuthToken';

// Import your page components
const Login = React.lazy(() => import('./pages/Login.jsx'));
const Home = React.lazy(() => import('./pages/Home.jsx'));
const EditListing = React.lazy(() => import('./pages/EditListing.jsx'));
const PricingStrategiesPage = React.lazy(() =>
  import('./pages/PricingStrategiesPage.jsx')
);
const CompetitorsPage = React.lazy(() => import('./pages/CompetitorsPage.jsx'));

// Import missing components
const PriceStrategy = React.lazy(() => import('./pages/PriceStrategy.jsx'));
const CompetitorDetails = React.lazy(() =>
  import('./componentsForEditListing/CompetitorDetails.jsx')
);
const AddCompetitorManually = React.lazy(() =>
  import('./componentsForEditListing/AddCompetitorManually.jsx')
);
const AddStrategy = React.lazy(() => import('./pages/AddStrategy.jsx'));
const CompetitorRule = React.lazy(() => import('./pages/CompetitorRule.jsx'));
const EditStrategyPage = React.lazy(() =>
  import('./pages/EditStrategyPage.jsx')
);
const EditCompetitorRulePage = React.lazy(() =>
  import('./pages/EditCompetitorRulePage.jsx')
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const user = useAuthStore((store) => store.user); // Fixed reference
  const location = useLocation();

  useEffect(() => {
    // Only attempt to refresh eBay token if user is already logged in
    if (!user) return;
    if (
      location.pathname === '/login' ||
      location.pathname === '/auth/popup-callback'
    ) {
      return; // skip auto‐refresh on login or popup callback
    }
    (async () => {
      try {
        await getValidAuthToken(user.id);
      } catch (err) {
        console.warn(
          'Could not refresh eBay token. User may need to reconnect.'
        );
      }
    })();
  }, [location.pathname, user]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout(); // Fixed reference - use logout method from store
    localStorage.removeItem('ebay_user_token');
    setIsLoggedIn(false);
  };

  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <Routes>
        {/* If root, redirect based on login status */}
        <Route
          path="/"
          element={
            <Navigate to={isLoggedIn || user ? '/home' : '/login'} replace />
          }
        />

        {/* 1) Login (your existing username/password page) */}
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />

        {/* 3) Protected "Home" + nested children */}
        <Route
          path="/home"
          element={
            isLoggedIn || user ? (
              <Home handleLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="edit-listing" element={<EditListing />} />
          <Route
            path="update-strategy/:productId"
            element={<PriceStrategy />}
          />
          <Route path="competitors/:itemId" element={<CompetitorDetails />} />
          <Route
            path="add-competitor-manually/:itemId"
            element={<AddCompetitorManually />}
          />
          <Route path="add-strategy" element={<AddStrategy />} />
          <Route path="add-competitor-rule" element={<CompetitorRule />} />
          <Route path="competitors" element={<CompetitorsPage />} />
          <Route
            path="pricing-strategies"
            element={<PricingStrategiesPage />}
          />
          <Route
            path="edit-strategy/:strategyName"
            element={<EditStrategyPage />}
          />
          <Route
            path="edit-competitor-rule/:ruleName"
            element={<EditCompetitorRulePage />}
          />
        </Route>

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-listing/:itemId"
          element={
            <ProtectedRoute>
              <EditListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing-strategies"
          element={
            <ProtectedRoute>
              <PricingStrategiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/competitors"
          element={
            <ProtectedRoute>
              <CompetitorsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </React.Suspense>
  );
}
