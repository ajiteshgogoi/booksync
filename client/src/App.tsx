import { useState, useEffect } from 'react';
import './App.css';

type SyncStatus = 'idle' | 'parsing' | 'syncing' | 'success' | 'error';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightCount, setHighlightCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name === 'My Clippings.txt') {
      setFile(selectedFile);
      setErrorMessage(null);
      setSyncStatus('parsing');

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/parse`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setHighlightCount(data.count);
        setSyncStatus('idle');
      } catch (error) {
        setSyncStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to parse highlights');
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

      if (!response.ok) throw new Error(await response.text());

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/check`, {
          credentials: 'include'
        });
        if (response.ok) setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('auth') === 'success') {
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      checkAuth();
    }
  }, []);

  useEffect(() => {
    if (window.kofiWidgetOverlay) {
      window.kofiWidgetOverlay.draw('gogoi', {
        type: 'floating-chat',
        'floating-chat.donateButton.text': 'Support Me',
        'floating-chat.donateButton.background-color': '#6366f1',
        'floating-chat.donateButton.text-color': '#fff'
      });
    }
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>BookSync</h1>
        <p className="subtitle">Sync your Kindle highlights to Notion</p>
      </header>

      <main className="main-content">
        {!isAuthenticated ? (
          <div className="card auth-card">
            <h2>Connect to Notion</h2>
            <p>First, copy the Kindle Highlights template to your Notion workspace.</p>
            <button 
              onClick={handleLogin}
              className="primary-button"
            >
              Connect to Notion
            </button>
          </div>
        ) : (
          <div className="card sync-card">
            <h2>Sync Your Highlights</h2>
            <p>Connect your Kindle and upload "My Clippings.txt" to get started.</p>

            <div className="file-upload">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                disabled={syncStatus === 'parsing' || syncStatus === 'syncing'}
              />
            </div>

            {file && (
              <>
                {highlightCount > 0 && (
                  <div className="highlight-count">
                    Found {highlightCount} highlights
                  </div>
                )}

                <button
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing' || syncStatus === 'parsing'}
                  className="primary-button"
                >
                  {syncStatus === 'parsing' ? 'Parsing...' :
                   syncStatus === 'syncing' ? 'Syncing...' : 'Sync Highlights'}
                </button>

                {syncStatus === 'syncing' && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(syncedCount / highlightCount) * 100}%` }}
                      />
                    </div>
                    <div className="progress-text">
                      Synced {syncedCount} of {highlightCount} highlights
                    </div>
                  </div>
                )}

                {syncStatus === 'success' && (
                  <div className="success-message">
                    ✅ Successfully synced {highlightCount} highlights!
                  </div>
                )}

                {errorMessage && (
                  <div className="error-message">
                    ❌ {errorMessage}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <div className="support-container">
        <script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"></script>
        <div id="kofi-widget-container"></div>
      </div>

      <footer className="footer">
        <p>Made with ❤️ by Gogoi</p>
      </footer>
    </div>
  );
}

export default App;
