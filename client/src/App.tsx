import { useState, useEffect } from 'react';
import BookIcon from '../public/book.svg';
import './App.css';

type SyncStatus = 'idle' | 'parsing' | 'syncing' | 'success' | 'error' | 'queued';

const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [file, setFile] = useState<File | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    () => (localStorage.getItem('syncStatus') as SyncStatus) || 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightCount, setHighlightCount] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.name !== 'My Clippings.txt') {
      setFile(null);
      setErrorMessage("Please upload 'My Clippings.txt' only.");
      setSyncStatus('error');
      return;
    }
    
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
  };

  const handleSync = async () => {
    if (!file) return;

    // Set and persist sync status
    setSyncStatus('syncing');
    localStorage.setItem('syncStatus', 'syncing');
    setErrorMessage(null);
    setIsTimeout(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiBase}/sync`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error(await response.text());

      const { jobId } = await response.json();
      // Store file content as base64 string
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem('syncJobId', jobId);
        localStorage.setItem('syncFileData', reader.result as string);
        localStorage.setItem('syncFileName', file.name);
      };
      reader.readAsDataURL(file);
      
      // Start polling for job status
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`${apiBase}/sync/status/${jobId}`, {
            credentials: 'include'
          });
          
          if (!statusResponse.ok) throw new Error('Failed to check status');
          
          const status = await statusResponse.json();
          
          if (status.progress) {
            // Update progress
          }
          
          if (status.state === 'completed') {
            setSyncStatus('success');
            // Sync completed
            return true;
          }
          
          if (status.state === 'failed') {
            throw new Error(status.error || 'Sync failed');
          }
          
          // Continue polling
          return false;
        } catch (error) {
          setSyncStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Failed to check sync status');
          // Error occurred
          return true;
        }
      };

      // Initial poll
      if (await pollStatus()) return;

      // Set up interval polling
      const interval = setInterval(async () => {
        if (await pollStatus()) {
          clearInterval(interval);
        }
      }, 1000);

      // Set timeout check
      const timeout = setTimeout(() => {
        setIsTimeout(true);
        // Sync is taking longer than expected
        setErrorMessage('Sync is still running. You can safely close this page and check back later.');
      }, 60000);

      // Cleanup interval on component unmount
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } catch (error) {
      setSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sync highlights');
      // Error occurred
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
      localStorage.removeItem('isAuthenticated');
      setFile(null);
      setErrorMessage(null);
      setSyncStatus('idle');
      localStorage.removeItem('syncJobId');
      localStorage.removeItem('syncFileData');
      localStorage.removeItem('syncFileName');
      localStorage.removeItem('syncStatus');
      // Reset state
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to disconnect');
    }
  };

  useEffect(() => {
    // Initialize application state
    const initializeState = async () => {
      const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
      
      // Check URL parameters for auth status
      const searchParams = new URLSearchParams(window.location.search);
      const authResult = searchParams.get('auth');
      const error = searchParams.get('error');
      
      // Clear URL parameters regardless of result
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (authResult === 'success') {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
      } else if (authResult === 'error' || error) {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        setErrorMessage(error === 'Invalid OAuth state' ?
          'Connection to Notion was canceled. Please try again.' :
          'Failed to connect to Notion. Please try again.');
      }

      // First check authentication
      try {
        const authResponse = await fetch(`${apiBase}/auth/check`, {
          credentials: 'include'
        });
        if (authResponse.ok) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          // Clear auth state on failed check
          setIsAuthenticated(false);
          localStorage.removeItem('isAuthenticated');
          // Also clear any sync state since auth is required
          localStorage.removeItem('syncJobId');
          localStorage.removeItem('syncFileData');
          localStorage.removeItem('syncFileName');
          localStorage.removeItem('syncStatus');
          setSyncStatus('idle');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear state on error
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('syncJobId');
        localStorage.removeItem('syncFileData');
        localStorage.removeItem('syncFileName');
        localStorage.removeItem('syncStatus');
        setSyncStatus('idle');
      }

      // First check if we have a sync job ID
      const jobId = localStorage.getItem('syncJobId');
      const storedSyncStatus = localStorage.getItem('syncStatus') as SyncStatus;
      const fileData = localStorage.getItem('syncFileData');
      const fileName = localStorage.getItem('syncFileName');

      // If we have a job ID, check server status first
      if (jobId) {
        try {
          const statusResponse = await fetch(`${apiBase}/sync/status/${jobId}`, {
            credentials: 'include'
          });
          
          if (!statusResponse.ok || statusResponse.status === 207) {
            // Job no longer exists or multi-status response - clear stale state
            localStorage.removeItem('syncJobId');
            localStorage.removeItem('syncFileData');
            localStorage.removeItem('syncFileName');
            localStorage.removeItem('syncStatus');
            setSyncStatus('idle');
            return;
          }

          const status = await statusResponse.json();
          
          if (status.state === 'processing') {
            // Sync is still active - restore state
            setSyncStatus('syncing');
            localStorage.setItem('syncStatus', 'syncing');
            
            if (fileData && fileName) {
              try {
                const base64Data = fileData.split(',')[1];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const restoredFile = new File([bytes], fileName);
                setFile(restoredFile);
              } catch (error) {
                console.error('Failed to restore file:', error);
                if (fileName) {
                  setFile(new File([], fileName));
                }
              }
            }
            return;
          }
          
          // If we get here, sync is not active - clear stale state
          localStorage.removeItem('syncJobId');
          localStorage.removeItem('syncFileData');
          localStorage.removeItem('syncFileName');
          localStorage.removeItem('syncStatus');
          setSyncStatus('idle');
        } catch (error) {
          console.error('Failed to check sync status:', error);
          // On error, assume sync is not active
          localStorage.removeItem('syncJobId');
          localStorage.removeItem('syncFileData');
          localStorage.removeItem('syncFileName');
          localStorage.removeItem('syncStatus');
          setSyncStatus('idle');
        }
      }
    };

    // Run initialization
    initializeState().catch(console.error);
  }, []);

  // Save sync status to localStorage whenever it changes
  useEffect(() => {
    if (syncStatus) {
      localStorage.setItem('syncStatus', syncStatus);
    }
  }, [syncStatus]);

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
            <p className="mt-2 text-gray-600">First, copy the <a href="https://ajiteshgogoi.notion.site/182089fab37880bebf22e98f12c1ba1b?v=182089fab3788167a0e8000c719a4d5a" target="_blank" rel="noopener noreferrer" className="text-[#8b7355] underline hover:underline">Kindle Highlights Template</a> to your Notion workspace.</p>
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
                <label className={`block bg-[#8b7355] hover:bg-[#6b5a46] text-white text-center font-medium px-6 py-2 rounded-md cursor-pointer transition-colors font-serif ${
                  syncStatus === 'parsing' || syncStatus === 'syncing' || syncStatus === 'success' || syncStatus === 'queued'
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    disabled={syncStatus === 'parsing' || syncStatus === 'syncing' || syncStatus === 'success' || syncStatus === 'queued'}
                    className="hidden"
                  />
                  Upload My Clippings.txt
                </label>

              </div>

              {errorMessage && !isTimeout && (
                <div className="mt-4 p-4 bg-[#ffebee] text-[#c62828] rounded-md font-serif text-center">
                  ❌ {errorMessage}
                </div>
              )}

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
                    <div className="mt-4 text-sm text-[#5a463a] font-serif space-y-1">
                      <div className="text-center p-4 bg-[#fffaf0] border border-[#e0d6c2] rounded-lg">
                        <div className="text-[#5a463a] font-semibold text-lg">
                          ⏳ Sync is running in the background
                        </div>
                        <div className="text-sm text-[#5a463a] mt-2 space-y-1">
                          <div>• You can safely close this page</div>
                          <div>• Sync will continue server-side</div>
                          <div>• You'll see results in Notion when complete</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {syncStatus === 'success' && (
                    <div className="mt-4 p-4 bg-[#e8f5e9] text-[#2e7d32] rounded-md font-serif text-center">
                      ✅ Sync completed successfully
                    </div>
                  )}
                </>
              )}

              {syncStatus !== 'syncing' && syncStatus !== 'success' && (
                <button
                  onClick={handleDisconnect}
                  className="mt-4 mx-auto w-55 bg-[#9c4a3c] hover:bg-[#7c3a2c] text-white font-medium px-4 py-1.5 rounded-md transition-colors font-serif flex justify-center"
                >
                  Disconnect Notion
                </button>
              )}
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
