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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">BookSync</h1>
          <p className="mt-2 text-lg text-gray-600">Sync your Kindle highlights to Notion</p>
        </div>
        {!isAuthenticated ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Connect to Notion</h2>
            <p className="mt-2 text-gray-600">First, copy the Kindle Highlights template to your Notion workspace.</p>
            <button 
              onClick={handleLogin}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-md transition-colors"
            >
              Connect to Notion
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900">Sync Your Highlights</h2>
            <p className="mt-2 text-gray-600">Connect your Kindle and upload "My Clippings.txt" to get started.</p>

            <div className="mt-4">
              <label className="block bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium px-6 py-2 rounded-md cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  disabled={syncStatus === 'parsing' || syncStatus === 'syncing'}
                  className="hidden"
                />
                Upload My Clippings.txt
              </label>
            </div>

            {file && (
              <>
                {highlightCount > 0 && (
                  <div className="mt-4 text-gray-700">
                    Found {highlightCount} highlights
                  </div>
                )}

                <button
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing' || syncStatus === 'parsing'}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {syncStatus === 'parsing' ? 'Parsing...' :
                   syncStatus === 'syncing' ? 'Syncing...' : 'Sync Highlights'}
                </button>

                {syncStatus === 'syncing' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full"
                        style={{ width: `${(syncedCount / highlightCount) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Synced {syncedCount} of {highlightCount} highlights
                    </div>
                  </div>
                )}

                {syncStatus === 'success' && (
                  <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                    ✅ Successfully synced {highlightCount} highlights!
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    ❌ {errorMessage}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-4 right-4">
        <script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"></script>
        <div id="kofi-widget-container"></div>
      </div>

      <footer className="mt-8 py-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-4">
          <a 
            href="https://ko-fi.com/gogoi" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <img 
              src="https://storage.ko-fi.com/cdn/cup-border.png" 
              alt="Ko-fi logo" 
              className="w-5 h-5"
            />
            Buy Me a Coffee
          </a>
          <p className="text-gray-600">© {new Date().getFullYear()} Ajitesh Gogoi</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
