// src/pages/Home.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import apiService from '../api/apiService';
import getValidAuthToken from '../utils/getValidAuthToken';
import { userStore } from '../store/authStore';

import Header from '../componentsForHome/Header';
import NavTabs from '../componentsForHome/NavTabs';
import ActionButtons from '../componentsForHome/ActionButtons';
import ListingsHeading from '../componentsForHome/ListingsHeading';
import EntriesAndSearchBar from '../componentsForHome/EntriesAndSearchBar';
import ListingsTable from '../componentsForHome/ListingsTable';
import PaginationBar from '../componentsForHome/PaginationBar';
import Footer from '../componentsForHome/Footer';
import ScrollToTopButton from '../componentsForHome/ScrollToTopButton';

export default function Home({ handleLogout }) {
  const [page, setPage] = useState(1);
  const [ebayToken, setEbayToken] = useState(null);
  const [needsConnection, setNeedsConnection] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState(null);

  const user = userStore((store) => store.user);
  const location = useLocation();
  const popupRef = useRef(null); // will hold reference to the OAuth popup window

  // Handle OAuth popup messages
  useEffect(() => {
    const handleMessage = async (event) => {
      console.log('[Home.jsx] Received postMessage from popup:', event.data);

      if (event.origin !== window.location.origin) return;

      const { code, state, expires_in } = event.data;

      if (code && user?.id) {
        try {
          console.log('[Home.jsx] Sending code to backend for exchange:', {
            code,
            userId: user.id,
          });

          const resp = await apiService.auth.exchangeCode({
            code,
            userId: user.id,
          });

          console.log('[Home.jsx] Exchange response from backend:', resp);

          if (!resp.success) throw new Error(resp.error || 'Exchange failed');
          localStorage.setItem('ebay_user_token', resp.data.access_token);
          setEbayToken(resp.data.access_token);
          setNeedsConnection(false);
        } catch (err) {
          console.error('❌ Error exchanging code:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  // 1) On mount (and whenever the "user" changes), try to fetch/refresh the eBay token.
  //    If none is available, show “Connect to eBay” button.
  useEffect(() => {
    async function checkToken() {
      if (!user || !user.id) {
        // No logged‐in user → bail out.
        return;
      }
      try {
        // Pass user.id into getValidAuthToken so it can do GET /auth/token?userId=<…>
        const token = await getValidAuthToken(user.id);
        if (!token) {
          // Backend says “no eBay token stored yet” → show the Connect button.
          setNeedsConnection(true);
          return;
        }
        // We have a valid (or freshly‐refreshed) eBay token:
        setEbayToken(token);
        setNeedsConnection(false);
      } catch (err) {
        console.warn('⚠️ Unable to fetch/refresh eBay token:', err);
        setNeedsConnection(true);
      }
    }
    checkToken();
  }, [user]);

  // 2) Once we have a valid ebayToken, fetch the user’s active listings.
  useEffect(() => {
    if (!ebayToken) {
      return;
    }

    async function fetchListings() {
      setLoadingListings(true);
      setListingsError(null);
      try {
        // Our interceptor attaches “Authorization: Bearer <ebayToken>”
        const data = await apiService.inventory.getActiveListings();
        if (!data.success) {
          setListingsError(data.error || 'Failed to load listings.');
        }
        // TODO: store “data” (listings) into local state or a global store.
      } catch (err) {
        setListingsError(err.message || 'Error loading listings.');
      } finally {
        setLoadingListings(false);
      }
    }

    fetchListings();
  }, [ebayToken]);

  // 3) If the user never connected to eBay, show “Connect to eBay” UI.
  if (needsConnection) {
    const backendBase = import.meta.env.VITE_BACKEND_URL; // e.g. “http://localhost:5000”

    const openEbayOAuthPopup = () => {
      if (!user || !user.id) {
        console.error('No user ID available – cannot start eBay OAuth.');
        return;
      }

      // 3a) Open a small popup centered on the screen:
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const authUrl = `${backendBase}/auth/ebay-login?userId=${user.id}`;
      window.open(
        authUrl,
        '_blank',
        `width=${width},height=${height},top=${top},left=${left}`
      );
    };

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h2>You need to connect your eBay account</h2>
        <button
          onClick={openEbayOAuthPopup}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#2E3B4E',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Connect to eBay
        </button>
      </div>
    );
  }

  // 4) Normal dashboard rendering once we have “ebayToken”
  const isDashboard = location.pathname === '/home';

  return (
    <>
      <Header handleLogout={handleLogout} />
      <NavTabs />

      {/* If you have nested routes under /home, render them here: */}
      <Outlet />

      {isDashboard && (
        <>
          <ActionButtons />
          <ListingsHeading />

          {loadingListings ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>
              Loading your eBay listings…⏳
            </p>
          ) : listingsError ? (
            <p style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>
              Error loading listings: {listingsError}
            </p>
          ) : (
            <>
              <EntriesAndSearchBar />
              <ListingsTable />
              <PaginationBar
                currentPage={page}
                totalPages={4}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      <Footer />
      <ScrollToTopButton />
    </>
  );
}
