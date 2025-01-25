import { useState, useEffect } from 'react';
import BookIcon from '../public/book.svg';
import './App.css';
import { uploadFileToR2 } from './services/uploadService';

type SyncStatus = 'idle' | 'parsing' | 'queued' | 'error' | 'starting';

const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;

function App() {
  const checkAuthExpiration = () => {
    const authTimestamp = localStorage.getItem('authTimestamp');
    if (!authTimestamp) return false;
    
    const expirationTime = 60 * 60 * 1000; // 1 hour in milliseconds
    const elapsed = Date.now() - parseInt(authTimestamp);
    return elapsed < expirationTime;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true' && checkAuthExpiration();
  });
  const [file, setFile] = useState<File | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightCount, setHighlightCount] = useState(0);
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

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const userId = searchParams.get('userId') || localStorage.getItem('userId') || 'anonymous';
      const timestamp = Date.now();
      const fileKey = `clippings-${userId}-${timestamp}.txt`;
      const { count } = await uploadFileToR2(selectedFile, fileKey);

      setHighlightCount(count);
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse highlights');
    }
  };
  const handleSync = async () => {
  if (!file || highlightCount === 0) return;
  
  // Check auth expiration before sync
  if (!checkAuthExpiration()) {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTimestamp');
    setErrorMessage('Your session has expired. Please reconnect to Notion.');
    return;
  }

  setSyncStatus('starting');
  setErrorMessage(null);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiBase}/sync`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || await response.text());
    }

    const syncResponse = await response.json();
    if (syncResponse.success) {
      setSyncStatus('queued');
      setErrorMessage(null);
    } else {
      setSyncStatus('idle');
      setErrorMessage(syncResponse.message || 'Failed to sync highlights');
    }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sync highlights');
    }
  };

  useEffect(() => {
    // Initialize authentication state
    const initializeAuth = async () => {
      const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
      
      // Check URL parameters for auth status
      const searchParams = new URLSearchParams(window.location.search);
      const authResult = searchParams.get('auth');
      const error = searchParams.get('error');
      
      // Clear URL parameters regardless of result
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (authResult === 'success') {
        const userId = searchParams.get('userId');
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authTimestamp', Date.now().toString());
        if (userId) {
          localStorage.setItem('userId', userId);
        }
      } else if (authResult === 'error' || error) {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        setErrorMessage(error === 'Invalid OAuth state' ?
          'Connection to Notion was canceled. Please try again.' :
          'Failed to connect to Notion. Please try again.');
      }

      // Check authentication status
      try {
        const authResponse = await fetch(`${apiBase}/auth/check`, {
          credentials: 'include'
        });
        if (authResponse.ok) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('isAuthenticated');
        }
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
      }
    };

    initializeAuth().catch(console.error);
  }, []);

  // Check auth expiration periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (isAuthenticated && !checkAuthExpiration()) {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        setErrorMessage('Your session has expired. Please reconnect to Notion.');
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [isAuthenticated]);

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
    <div className="min-h-screen bg-[#f5f2e9] bg-[url('/src/assets/parchment-texture.png')] bg-cover bg-center flex flex-col items-center justify-center">
      <main className="max-w-4xl w-full mx-auto px-4 py-8 my-auto overflow-y-auto">
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
            <p className="mt-2 text-gray-600">First, copy the <a href="https://ajiteshgogoi.notion.site/182089fab37880bebf22e98f12c1ba1b?v=182089fab3788167a0e8000c719a4d5a" target="_blank" rel="noopener noreferrer" className="text-[#8b7355] underline hover:text-blue-600 hover:underline">Kindle Highlights Template</a> to your Notion workspace.</p>
            <p className="text-gray-600">Then connect to Notion and allow access.</p>
              <button
                onClick={() => window.location.href = `${apiBase}/auth/notion`}
                className="mt-4 bg-[#8b7355] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md transition-colors font-serif block mx-auto disabled:cursor-not-allowed focus:outline-none"
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
                  className="text-[#8b7355] hover:text-blue-600 underline"
                >
                  My Clippings.txt
                </a>{' '}
                to get started.
              </p>

              <div className="mt-4">
<label className={`block bg-[#8b7355] hover:bg-[#6b5a46] text-white text-center font-medium px-6 py-2 rounded-md disabled:cursor-not-allowed transition-colors font-serif cursor-pointer ${
  syncStatus === 'parsing' || syncStatus === 'queued' || syncStatus === 'starting'
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer'
}`}>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    disabled={syncStatus === 'parsing' || syncStatus === 'queued'}
                    className="hidden"
                  />
                  Upload My Clippings.txt
                </label>
              </div>

                  {errorMessage && (
                    <div className="mt-4 p-4 bg-[#ffebee] text-[#c62828] rounded-md font-serif text-center">
                      ❌ {errorMessage}
                    </div>
                  )}
                  {file && (
                    <>
                      {highlightCount > 0 && (
                    <div className="mt-4 text-[#4a7c59] text-center font-serif">
                      Found {highlightCount} highlights
                    </div>
                  )}

                  <button
                    onClick={handleSync}
                    disabled={syncStatus === 'parsing' || syncStatus === 'queued' || syncStatus === 'starting'}
                    className="mt-4 max-w-sm mx-auto bg-[#8b7355] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-serif block"
                  >
                    {syncStatus === 'parsing' ? 'Parsing...' :
                     syncStatus === 'queued' ? 'In Queue...' :
                     syncStatus === 'starting' ? 'Starting sync...' : 'Sync Highlights'}
                  </button>

                  {syncStatus === 'queued' && !errorMessage && (
                     <div className="mt-4 text-sm text-[#5a463a] font-serif space-y-1">
                       <div className="text-center p-4 bg-[#fffaf0] border border-[#e0d6c2] rounded-lg">
                         <div className="text-[#3d2b1f] font-semibold text-lg relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffffff66] to-transparent animate-pulse-slow w-[200%] h-full"></div>
                           <span className="relative z-10 animate-pulse">
                             ⏳ Processing your highlights...
                           </span>
                         </div>
                         <div className="text-xs text-[#5a463a] mt-2 space-y-1">
                           <div>• You can safely close this page.</div>
                           <div>• Processing runs in the background every 30 minutes.</div>
                           <div>• Highlights are added to Notion as they are processed.</div>
                           <div>• If you have a lot of highlights, it may take a few hours for everything to sync.</div>
                           <div>• To prevent syncing issues, you are limited to 2 'My Clippings.txt' uploads per hour.</div>
                         </div>
                       </div>
                     </div>
                   )}
                </>
              )}

              {syncStatus !== 'queued' && (
                  <button
                    onClick={async () => {
                      localStorage.removeItem('isAuthenticated');
                      localStorage.removeItem('authTimestamp');
                      localStorage.removeItem('userId');
                      await fetch(`${apiBase}/auth/disconnect`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                      window.location.href = '/';
                    }}
                    className={`mt-4 max-w-sm mx-auto bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-center font-medium px-6 py-2 rounded-md disabled:cursor-not-allowed transition-colors font-serif block ${
                      ['parsing', 'queued'].includes(syncStatus)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                    disabled={['parsing', 'queued'].includes(syncStatus)}
                  >
                  Disconnect Notion
                </button>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <a 
                href="mailto:ajiteshgogoi@gmail.com?subject=BookSync Feedback" 
                className="text-[#8b7355] font-serif text-sm underline hover:text-blue-600"
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
          <div className="bg-[#fffaf0] rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border border-[#e0d6c2] relative">
            <h2 className="text-xl font-bold text-[#3d2b1f] font-serif mb-2">
              About 'My Clippings.txt'
            </h2>
            <p className="text-sm text-[#5a463a] font-serif mb-3">
              Automatically created by Kindle when you highlight text or add notes.
            </p>
            <ol className="list-decimal list-inside text-sm text-[#5a463a] font-serif space-y-1 mb-3">
              <li>Connect Kindle via USB.</li>
              <li>Open Kindle drive.</li>
              <li>Find 'My Clippings.txt' in the root directory.</li>
            </ol>
            <button
              onClick={() => setShowClippingsModal(false)}
              className="w-full bg-[#8b7355] hover:bg-[#6b5a46] text-white text-sm px-4 py-2 rounded-md transition-colors font-serif"
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
