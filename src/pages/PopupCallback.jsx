// src/pages/PopupCallback.jsx
import React, { useEffect, useState } from 'react';

export default function PopupCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state'); // your userId
    const expiresIn = params.get('expires_in');

    if (!code) {
      // No “code” means something went wrong
      setError(
        'OAuth code not found in URL. Authorization failed or was cancelled.'
      );
      return;
    }

    // Send the code (and state) back to the opener window
    window.opener.postMessage(
      { code, state, expires_in: expiresIn },
      window.location.origin
    );

    console.log('[PopupCallback] OAuth code received:', code);
    console.log(
      '[PopupCallback] Posting message back to opener with state:',
      state
    );

    // Close this popup immediately
    window.close();
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      {error ? (
        <>
          <h2 style={{ color: 'red' }}>OAuth Error</h2>
          <p>{error}</p>
          <p>You may now close this window.</p>
        </>
      ) : (
        <>
          <h2>Authorization Complete</h2>
          <p>If this window does not close on its own, please close it.</p>
        </>
      )}
    </div>
  );
}
