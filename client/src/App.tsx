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
  // Initialize sync state immediately from localStorage
  const initialSyncStatus = localStorage.getItem('syncStatus') as SyncStatus || 'idle';
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(initialSyncStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightCount, setHighlightCount] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);
  const [showClippingsModal, setShowClippingsModal] = useState(false);

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

    console.log('Starting sync...');
    console.log('Initial localStorage state:', {
      jobId: localStorage.getItem('syncJobId'),
      syncStatus: localStorage.getItem('syncStatus'),
      hasFileData: !!localStorage.getItem('syncFileData'),
      fileName: localStorage.getItem('syncFileName')
    });

    // Set queued state immediately
    setSyncStatus('queued');
    localStorage.setItem('syncStatus', 'queued');
    setErrorMessage(null);
    setIsTimeout(false);

    console.log('Set sync status to syncing');

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
      console.log('Received jobId:', jobId);
      
      // Update state to syncing now that we have a jobId
      setSyncStatus('syncing');
      localStorage.setItem('syncStatus', 'syncing');
      
      // Store sync data
      localStorage.setItem('syncJobId', jobId);
      
      // Store file content as base64 string
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem('syncFileData', reader.result as string);
        localStorage.setItem('syncFileName', file.name);
      };
      reader.readAsDataURL(file);
      
      console.log('Updated sync status to syncing with jobId:', jobId);
      
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

      console.log('Before auth check localStorage state:', {
        jobId: localStorage.getItem('syncJobId'),
        syncStatus: localStorage.getItem('syncStatus'),
        isAuthenticated: localStorage.getItem('isAuthenticated')
      });

      // First check authentication
      try {
        const authResponse = await fetch(`${apiBase}/auth/check`, {
          credentials: 'include'
        });
        if (authResponse.ok) {
          console.log('Auth check success');
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          console.log('Auth check failed - clearing state');
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
        console.log('Auth error - clearing state');
        // Clear state on error
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('syncJobId');
        localStorage.removeItem('syncFileData');
        localStorage.removeItem('syncFileName');
        localStorage.removeItem('syncStatus');
        setSyncStatus('idle');
      }

      console.log('After auth check localStorage state:', {
        jobId: localStorage.getItem('syncJobId'),
        syncStatus: localStorage.getItem('syncStatus'),
        isAuthenticated: localStorage.getItem('isAuthenticated')
      });

      console.log('Current localStorage state:', {
        jobId: localStorage.getItem('syncJobId'),
        syncStatus: localStorage.getItem('syncStatus'),
        hasFileData: !!localStorage.getItem('syncFileData'),
        fileName: localStorage.getItem('syncFileName')
      });
    
      // First restore file state if available
      const jobId = localStorage.getItem('syncJobId');
      const storedSyncStatus = localStorage.getItem('syncStatus') as SyncStatus;
      const fileData = localStorage.getItem('syncFileData');
      const fileName = localStorage.getItem('syncFileName');
    
      console.log('Initializing with:', { jobId, storedSyncStatus });
    
      // Initialize sync status from storage
      if (storedSyncStatus === 'syncing') {
        console.log('Found stored sync status, setting to syncing');
        setSyncStatus('syncing');
      }
    
      // Restore file state before checking server
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

      // Then check server status if we have a job ID
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
          
          // First restore file state if available
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

          if (status.state === 'processing') {
            setSyncStatus('syncing');
            localStorage.setItem('syncStatus', 'syncing');
          } else {
            // If not processing, clear ALL state
            setFile(null);
            setSyncStatus('idle');
            localStorage.removeItem('syncJobId');
            localStorage.removeItem('syncFileData');
            localStorage.removeItem('syncFileName');
            localStorage.removeItem('syncStatus');
          }
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

  // Set up polling when we have an active job
  useEffect(() => {
    let isCurrent = true;
    const jobId = localStorage.getItem('syncJobId');
    console.log('Checking for active sync on refresh, jobId:', jobId);
    const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
    
    // Don't start polling if we don't have a jobId or if we're just queued
    const storedStatus = localStorage.getItem('syncStatus') as SyncStatus;
    if (!jobId || storedStatus === 'queued') return;

    console.log('Starting polling on page load...');
    const pollStatus = async () => {
      try {
        console.log('Polling sync status for jobId:', jobId);
        const pollResponse = await fetch(`${apiBase}/sync/status/${jobId}`, {
          credentials: 'include'
        });
        
        if (!pollResponse.ok) {
          console.log('Poll response not ok:', pollResponse.status);
          throw new Error('Failed to check status');
        }
        
        const status = await pollResponse.json();
        console.log('Poll response status:', status.state);
        
        if (status.state === 'completed' || status.state !== 'processing') {
          console.log('Sync no longer active, cleaning up...');
          if (isCurrent) {
            // First update state to trigger re-render
            setSyncStatus('idle');
            setFile(null);
            // Then clear storage
            localStorage.removeItem('syncJobId');
            localStorage.removeItem('syncFileData');
            localStorage.removeItem('syncFileName');
            localStorage.removeItem('syncStatus');
          }
          return true;
        }
        console.log('Sync still running, continuing to poll...');
        return false;
      } catch (error) {
        console.error('Poll error:', error);
        return true;
      }
    };

    console.log('Running initial poll...');
    pollStatus();

    console.log('Setting up polling interval...');
    const interval = setInterval(async () => {
      if (!isCurrent) {
        console.log('Component no longer current, skipping poll');
        return;
      }
      const shouldStop = await pollStatus();
      if (shouldStop && interval) {
        console.log('Clearing polling interval');
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      console.log('Cleaning up polling effect');
      isCurrent = false;
      if (interval) clearInterval(interval);
    };
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
    <div className="min-h-screen bg-[#f5f2e9] bg-[url('/src/assets/parchment-texture.png')] bg-cover bg-center flex flex-col">
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 
            className="text-5xl font-bold bg-gradient-to-r from-[#8b7355] to-[#3d2b1f] bg-clip-text text-transparent font-serif tracking-wide [text-shadow:0_2px_4px_rgba(0,0,0,0.3)] relative after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-[2px] after:bg-gradient-to-r after:from-[#8b7355] after:to-[#3d2b1f] cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
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
                onClick={() => window.location.href = `${apiBase}/auth/notion`}
                className="mt-4 bg-[#8b7355] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md transition-colors font-serif"
              >
                Connect to Notion
              </button>
          </div>
        ) : (
          <>
            <div className="bg-[#fffaf0] rounded-lg shadow-lg p-6 border border-[#e0d6c2] mb-4">
              <h2 className="text-2xl font-bold text-[#3d2b1f] font-serif text-center">Sync Your Highlights</h2>
              <p className="mt-2 text-[#5a463a] font-serif text-center">
                Connect your Kindle and upload{' '}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setShowClippingsModal(true); }}
                  className="text-[#8b7355] hover:text-[#8b7355] underline"
                >
                  My Clippings.txt
                </a>{' '}
                to get started.
              </p>

              <div className="mt-4">
                <label className={`block bg-[#8b7355] hover:bg-[#6b5a46] text-white text-center font-medium px-6 py-2 rounded-md disabled:cursor-not-allowed transition-colors font-serif ${
                  syncStatus === 'parsing' || syncStatus === 'syncing' || syncStatus === 'success' || syncStatus === 'queued'
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    disabled={syncStatus === 'parsing' || syncStatus === 'syncing' || syncStatus === 'queued'}
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
                    disabled={syncStatus === 'syncing' || syncStatus === 'parsing' || syncStatus === 'queued'}
                    className="mt-4 w-full bg-[#8b7355] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-serif"
                  >
                    {syncStatus === 'parsing' ? 'Parsing...' :
                     syncStatus === 'syncing' ? 'Syncing...' :
                     syncStatus === 'queued' ? 'In Queue...' : 'Sync Highlights'}
                  </button>

{(syncStatus === 'syncing' || syncStatus === 'queued' || syncStatus === 'parsing') && (
                     <div className="mt-4 text-sm text-[#5a463a] font-serif space-y-1">
                       <div className="text-center p-4 bg-[#fffaf0] border border-[#e0d6c2] rounded-lg">
                         <div className="text-gray-900 font-semibold text-lg pulse-horizontal">
                           {syncStatus === 'queued' ?
                             '⏳ Preparing to sync...' :
                             '⏳ Sync is running in the background'
                           }
                         </div>
                         <div className="text-sm text-[#5a463a] mt-2 space-y-1">
                           <div>• You can safely close this page</div>
                           <div>• {syncStatus === 'queued' ? 'Processing will begin shortly' : 'Sync will continue server-side'}</div>
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
                  onClick={async () => {
                    localStorage.removeItem('isAuthenticated');
                    await fetch(`${apiBase}/auth/disconnect`, {
                      method: 'POST',
                      credentials: 'include'
                    });
                    window.location.href = '/';
                  }}
                  className={`mt-4 mx-auto block bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium px-6 py-2 rounded-md transition-colors font-serif shadow-md hover:shadow-lg ${
                    ['parsing', 'syncing', 'queued'].includes(syncStatus)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  disabled={['parsing', 'syncing', 'queued'].includes(syncStatus)}
                >
                  Disconnect Notion
                </button>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <a 
                href="mailto:ajiteshgogoi@gmail.com?subject=BookSync Feedback" 
                className="text-[#8b7355] font-serif text-sm underline hover:text-[#8b7355]"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Feedback and Bugs
              </a>
            </div>
          </>
        )}
      </main>

      {showClippingsModal && (
        <div role="dialog" className="fixed inset-0 bg-black bg-opacity-50 z-50 grid place-items-center">
          <div className="bg-[#fffaf0] rounded-lg shadow-lg p-4 max-w-sm w-full mx-4 border border-[#e0d6c2] relative">
            <h2 className="text-lg font-bold text-[#3d2b1f] font-serif mb-1">
              About My Clippings.txt
            </h2>
            <p className="text-xs text-[#5a463a] font-serif mb-2">
              Automatically created by Kindle when you highlight text or add notes.
            </p>
            <ol className="list-decimal list-inside text-xs text-[#5a463a] font-serif space-y-0.5 mb-2">
              <li>Connect Kindle via USB</li>
              <li>Open Kindle drive</li>
              <li>Find file in root directory</li>
            </ol>
            <button
              onClick={() => setShowClippingsModal(false)}
              className="w-full bg-[#8b7355] hover:bg-[#6b5a46] text-white text-xs px-3 py-1 rounded-md transition-colors font-serif"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4">
        <script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"></script>
        <div id="kofi-widget-container"></div>
      </div>

      <footer className="mt-8 py-4 relative z-20">
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
