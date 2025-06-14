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
      if (event.origin !== window.location.origin) return;

      const { code, state, expires_in } = event.data;

      if (code && user?.id) {
        try {
          const resp = await apiService.auth.exchangeCode({
            code,
            userId: user.id,
          });

          if (!resp.success) throw new Error(resp.error || 'Exchange failed');
          localStorage.setItem('userId', user.id);

          const expiresIn = resp.data.expires_in || 7200; // fallback to 2h
          const expiresAt = Date.now() + expiresIn * 1000;

          localStorage.setItem(
            'ebay_user_token',
            JSON.stringify({
              value: resp.data.access_token,
              expiry: expiresAt,
            })
          );

          if (resp.data.refresh_token) {
            localStorage.setItem('ebay_refresh_token', resp.data.refresh_token);
          }

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
  //    If none is available, show "Connect to eBay" button.
  useEffect(() => {
    async function checkToken() {
      if (!user || !user.id) return;

      // 1. Try localStorage first
      const localToken = localStorage.getItem('ebay_user_token');
      if (localToken) {
        setEbayToken(localToken); // use it
        setNeedsConnection(false); // hide "connect" button
      }

      // 2. Still validate via backend in case token is expired
      try {
        const token = await getValidAuthToken(user.id);
        if (token) {
          localStorage.setItem('ebay_user_token', token);
          setEbayToken(token);
          setNeedsConnection(false);
        } else if (!localToken) {
          // If no local token either
          setNeedsConnection(true);
        }
      } catch (err) {
        if (!localToken) {
          setNeedsConnection(true);
        }
        console.warn('⚠️ Unable to fetch/refresh eBay token:', err);
      }
    }

    checkToken();
  }, [user]);

  // 2) Once we have a valid ebayToken, fetch the user's active listings.
  useEffect(() => {
    if (!ebayToken) {
      return;
    }

    async function fetchListings() {
      setLoadingListings(true);
      setListingsError(null);
      try {
        // Our interceptor attaches "Authorization: Bearer <ebayToken>"
        const data = await apiService.inventory.getActiveListings();
        if (!data.success) {
          // Check if token expired
          if (data.errors?.[0]?.errorId === 932) {
            console.warn('eBay token expired. Refreshing…');
            const refreshed = await apiService.auth.refreshEbayUserToken(
              user.id
            );
            if (refreshed?.success && refreshed.data?.access_token) {
              const expires = refreshed.data.expires_in || 7200;
              localStorage.setItem(
                'ebay_user_token',
                JSON.stringify({
                  value: refreshed.data.access_token,
                  expiry: Date.now() + expires * 1000,
                })
              );
              setEbayToken(refreshed.data.access_token);
              return; // re-trigger fetchListings on next effect run
            } else {
              // Refresh failed, clear tokens and show connect page
              localStorage.removeItem('ebay_user_token');
              localStorage.removeItem('ebay_refresh_token');
              setEbayToken(null);
              setNeedsConnection(true);
              return;
            }
          }
          setListingsError(data.error || 'Failed to load listings.');
        }
        // TODO: store "data" (listings) into local state or a global store.
      } catch (err) {
        console.error('Error fetching listings:', err);
        // Check if it's a 401 error (token expired)
        if (err.response?.status === 401 || err.status === 401) {
          console.warn(
            '⚠️ eBay token expired (401 error). Clearing tokens and showing connect page.'
          );
          localStorage.removeItem('ebay_user_token');
          localStorage.removeItem('ebay_refresh_token');
          setEbayToken(null);
          setNeedsConnection(true);
          setListingsError(null); // Clear error since we're handling it
        } else {
          setListingsError(err.message || 'Error loading listings.');
        }
      } finally {
        setLoadingListings(false);
      }
    }

    fetchListings();
  }, [ebayToken, user]);

  // Handle global eBay token expiry events
  useEffect(() => {
    const handleTokenExpiry = () => {
      setEbayToken(null);
      setNeedsConnection(true);
      setListingsError(null);
    };

    const handleAuthFailure = () => {
      console.warn(
        '⚠️ Authentication failure detected. Clearing storage and reloading...'
      );

      // Clear all authentication-related data
      localStorage.removeItem('user-store');
      localStorage.removeItem('ebay_user_token');
      localStorage.removeItem('ebay_refresh_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user_id');

      // Reload the page to redirect to login
      window.location.reload();
    };

    window.addEventListener('ebayTokenExpired', handleTokenExpiry);
    window.addEventListener('authenticationFailed', handleAuthFailure);

    return () => {
      window.removeEventListener('ebayTokenExpired', handleTokenExpiry);
      window.removeEventListener('authenticationFailed', handleAuthFailure);
    };
  }, []);

  // 3) If the user never connected to eBay, show “Connect to eBay” UI.
  if (needsConnection) {
    const backendBase = import.meta.env.VITE_BACKEND_URL;

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
