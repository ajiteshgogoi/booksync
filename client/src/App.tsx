import { useState, useEffect } from 'react';
import BookIcon from '../public/book.svg';
import './App.css';

type SyncStatus = 'idle' | 'parsing' | 'syncing' | 'success' | 'error';

const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;

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
        const response = await fetch(`${apiBase}/parse`, {
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
      const response = await fetch(`${apiBase}/sync`, {
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
    const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
    window.location.href = `${apiBase}/auth/notion`;
  };

  const handleDisconnect = async () => {
    try {
      const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiBase}/auth/disconnect`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to disconnect');
      
      setIsAuthenticated(false);
      setFile(null);
      setErrorMessage(null);
      setSyncStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to disconnect');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiBase}/auth/check`, {
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
    <div className="min-h-screen bg-[#f5f2e9] bg-[url('/src/assets/parchment-texture.jpg')] bg-cover bg-center flex flex-col">
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#8b7355] to-[#3d2b1f] bg-clip-text text-transparent font-serif tracking-wide [text-shadow:0_2px_4px_rgba(0,0,0,0.3)] relative after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-[2px] after:bg-gradient-to-r after:from-[#8b7355] after:to-[#3d2b1f]">
            <img src={BookIcon} className="inline-block w-14 h-14 align-text-bottom" /> BookSync
          </h1>
          <p className="mt-2 text-lg text-[#5a463a] font-serif">Sync your Kindle highlights to Notion</p>
        </div>
        {!isAuthenticated ? (
          <div className="bg-[#fffaf0] rounded-lg shadow-lg p-6 text-center border border-[#e0d6c2]">
            <h2 className="text-2xl font-bold text-gray-900">Connect to Notion</h2>
            <p className="mt-2 text-gray-600">First, copy the <a href="https://ajiteshgogoi.notion.site/182089fab37880bebf22e98f12c1ba1b?v=182089fab3788167a0e8000c719a4d5a" target="_blank" rel="noopener noreferrer" className="text-[#8b7355] underline hover:underline">Kindle Highlights template</a> to your Notion workspace.</p>
            <p className="text-gray-600">Then connect to Notion and allow access.</p>
            <button 
              onClick={handleLogin}
              className="mt-4 bg-[#8b7355] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md transition-colors font-serif"
            >
              Connect to Notion
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#fffaf0] rounded-lg shadow-lg p-6 border border-[#e0d6c2] mb-4">
              <h2 className="text-2xl font-bold text-[#3d2b1f] font-serif text-center">Sync Your Highlights</h2>
              <p className="mt-2 text-[#5a463a] font-serif text-center">Connect your Kindle and upload 'My Clippings.txt' to get started.</p>

              <div className="mt-4">
                <label className="block bg-[#8b7355] hover:bg-[#6b5a46] text-white text-center font-medium px-6 py-2 rounded-md cursor-pointer transition-colors font-serif">
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
                    <div className="mt-4 text-gray-700 text-center">
                      Found {highlightCount} highlights
                    </div>
                  )}

                  <button
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing' || syncStatus === 'parsing'}
                    className="mt-4 w-full bg-[#8b7355] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-serif"
                  >
                    {syncStatus === 'parsing' ? 'Parsing...' :
                     syncStatus === 'syncing' ? 'Syncing...' : 'Sync Highlights'}
                  </button>

                  {syncStatus === 'syncing' && (
                    <div className="mt-4">
                      <div className="w-full bg-[#e0d6c2] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#8b7355] h-full"
                          style={{ width: `${(syncedCount / highlightCount) * 100}%` }}
                        />
                      </div>
                      <div className="mt-2 text-sm text-[#5a463a] font-serif">
                        Synced {syncedCount} of {highlightCount} highlights
                      </div>
                    </div>
                  )}

                  {syncStatus === 'success' && (
                    <div className="mt-4 p-4 bg-[#e8f5e9] text-[#2e7d32] rounded-md font-serif">
                      ✅ Successfully synced {highlightCount} highlights!
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mt-4 p-4 bg-[#ffebee] text-[#c62828] rounded-md font-serif">
                      ❌ {errorMessage}
                    </div>
                  )}

                </>
              )}

              <button
                onClick={handleDisconnect}
                className="mt-4 w-full bg-[#8d6e63] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md transition-colors font-serif"
              >
                Disconnect Notion
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <a 
                href="mailto:ajiteshgogoi@gmail.com?subject=BookSync Feedback" 
                className="text-[#5a463a] font-serif text-sm underline hover:underline"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Feedback and Bugs
              </a>
            </div>
          </>
        )}
      </main>

      <div className="fixed bottom-4 right-4">
        <script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"></script>
        <div id="kofi-widget-container"></div>
      </div>

      <footer className="mt-8 py-4 border-t border-gray-100 relative z-20">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-2">
            <a 
              href="https://ko-fi.com/gogoi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#4a6cf7] text-white hover:text-white px-3 py-1.5 text-sm rounded-md transition-all font-serif hover:-translate-y-0.5 hover:shadow-lg [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]"
            >
            <img 
              src="https://storage.ko-fi.com/cdn/cup-border.png" 
              alt="Ko-fi logo" 
              className="w-5 h-5"
            />
            Buy Me a Coffee
          </a>
          <p className="text-[#5a463a] font-serif text-sm">© {new Date().getFullYear()} ajitesh gogoi</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
