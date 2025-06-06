// src/pages/PopupCallback.jsx
import React, { useEffect, useState } from 'react';

export default function PopupCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Parse query string for eBay’s code & expires_in, etc.
    const params = new URLSearchParams(window.location.search);
    const isAuthSuccessful = params.get('isAuthSuccessful');
    const code = params.get('code');
    const expiresIn = params.get('expires_in');

    // We expect eBay to send us something like:
    //   /auth/popup-callback?isAuthSuccessful=true&code=<LONG_CODE>&expires_in=299
    if (isAuthSuccessful !== 'true' || !code) {
      setError('Authentication failed or canceled.');
      return;
    }

    // Build a payload to send back to the opener window:
    const payload = {
      code,
      expires_in: expiresIn,
    };

    // Send the payload to the parent window
    // Make sure to replace '*' with your exact origin if you want extra safety:
    window.opener.postMessage(payload, window.location.origin);

    // Once posted, close this popup:
    window.close();
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      {error ? (
        <div>
          <h2 style={{ color: 'red' }}>OAuth error</h2>
          <p>{error}</p>
          <p>You may now close this window.</p>
        </div>
      ) : (
        <div>
          <h2>Connecting to eBay…</h2>
          <p>If this window does not close automatically, please close it.</p>
        </div>
      )}
    </div>
  );
}
