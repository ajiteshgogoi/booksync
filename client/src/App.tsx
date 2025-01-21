import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'parsing' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightCount, setHighlightCount] = useState<number>(0);
  const [syncedCount, setSyncedCount] = useState<number>(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name === 'My Clippings.txt') {
      setFile(selectedFile);
      setErrorMessage(null);
      setSyncStatus('parsing');

      // Parse file to get highlight count
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        console.log('Uploading file for parsing:', selectedFile);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/parse`, {
          method: 'POST',
          body: formData,
        });

        const responseText = await response.text();
        console.log('Parse response:', responseText);

        if (!response.ok) {
          throw new Error(responseText);
        }

        try {
          const data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
          setHighlightCount(data.count);
          setSyncStatus('idle');
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Parse error:', error);
        setSyncStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to parse highlights file');
      }
    } else {
      setErrorMessage('Please select "My Clippings.txt" from your Kindle');
    }
  };

  const handleSync = async () => {
    if (!file) return;

    setSyncStatus('syncing');
    setErrorMessage(null);
    setSyncedCount(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sync`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      // Read progress stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        try {
          const data = JSON.parse(text);
          if (data.type === 'progress') {
            setSyncedCount(data.count);
          }
        } catch (e) {
          console.error('Failed to parse progress:', e);
        }
      }

      setSyncStatus('success');
    } catch (error) {
      setSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sync highlights');
    }
  };

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/notion`;
  };

  // Check authentication status on load and after redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/check`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    // Check if we're returning from OAuth
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('auth') === 'success') {
      setIsAuthenticated(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      checkAuth();
    }
  }, []);

  return (
    <div className="container">
      <h1>Kindle → Notion Sync</h1>
      
      {!isAuthenticated ? (
        <div className="auth-section">
          <h2>Connect your Notion account</h2>
          <p>First, copy the Kindle Highlights template to your Notion workspace.</p>
          <button onClick={handleLogin} className="login-button">
            Connect to Notion
          </button>
        </div>
      ) : (
        <div className="sync-section">
          <h2>Upload your Kindle highlights</h2>
          <p>Connect your Kindle to your computer and find "My Clippings.txt" in the documents folder.</p>
          
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="file-input"
            disabled={syncStatus === 'parsing' || syncStatus === 'syncing'}
          />
          
          {file && (
            <div className="sync-container">
              {highlightCount > 0 && (
                <div className="highlight-count">
                  Found {highlightCount} highlights in your Kindle file
                </div>
              )}

              <button
                onClick={handleSync}
                disabled={syncStatus === 'syncing' || syncStatus === 'parsing'}
                className="sync-button"
              >
                {syncStatus === 'parsing' ? 'Parsing...' :
                 syncStatus === 'syncing' ? 'Syncing...' : 'Sync Highlights'}
              </button>

              {syncStatus === 'syncing' && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(syncedCount / highlightCount) * 100}%` }}
                  />
                  <span className="progress-text">
                    {syncedCount} / {highlightCount} highlights synced
                  </span>
                </div>
              )}

              {syncStatus === 'success' && (
                <div className="success-message">
                  ✅ {highlightCount} highlights synced successfully!
                </div>
              )}

              {errorMessage && (
                <div className="error-message">
                  ❌ {errorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
