import { useState, useEffect } from 'react';
import BookIcon from '../public/book.svg';
import './App.css';
import { uploadFileToR2, pollJobStatus } from './services/uploadService';

type SyncStatus = 'idle' | 'parsing' | 'queued' | 'error' | 'starting' | 'validating';

const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;

function App() {
  const checkAuthExpiration = () => {
    const authTimestamp = localStorage.getItem('authTimestamp');
    const workspaceId = localStorage.getItem('workspaceId');
    
    if (!authTimestamp || !workspaceId) return false;
    
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // Poll job status when jobId exists
  useEffect(() => {
    if (!jobId || syncStatus !== 'queued') return;

    const pollInterval = setInterval(async () => {
      try {
        const job = await pollJobStatus(jobId);
        
        if (job.status === 'completed') {
          setSyncStatus('idle');
          setJobId(null);
          clearInterval(pollInterval);
        } else if (job.status === 'failed') {
          setSyncStatus('error');
          setErrorMessage(job.error || 'Sync failed');
          setJobId(null);
          clearInterval(pollInterval);
        } else if (job.status === 'processing') {
          setSyncProgress(job.progress || 0);
        }
      } catch (error) {
        console.error('Job polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, syncStatus]);

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
    setSyncStatus('validating');

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const userId = searchParams.get('userId') || localStorage.getItem('userId') || 'anonymous';
      // Validate first before doing any processing
      setSyncStatus('validating');
      const validationResponse = await fetch(`${apiBase}/validate-sync`, {
        method: 'POST',
        headers: {
          'x-user-id': userId
        },
        credentials: 'include'
      });

      if (!validationResponse.ok) {
        const validationResult = await validationResponse.json();
        setSyncStatus('error');
        setFile(null);
        throw new Error(validationResult.error || 'Validation failed');
      }
      const validationResult = await validationResponse.json();
      if (!validationResult.valid) {
        setSyncStatus('error');
        setFile(null);
        throw new Error(validationResult.error || 'Validation failed');
      }

      // Only proceed with upload after validation passes
      const timestamp = Date.now();
      const fileKey = `clippings-${userId}-${timestamp}.txt`;
      const { count, job } = await uploadFileToR2(selectedFile, fileKey);
      
      setHighlightCount(count);
      setJobId(job.id);
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      setFile(null);
      setHighlightCount(0);
      
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse highlights');
    }
  };
  const handleSync = async () => {
    if (!file || !jobId || highlightCount === 0) return;
    
    // Check auth expiration before sync
    if (!checkAuthExpiration()) {
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authTimestamp');
      setErrorMessage('Your session has expired. Please reconnect to Notion.');
      return;
    }

    // Check workspace ID exists
    const workspaceId = localStorage.getItem('workspaceId');
    if (!workspaceId) {
      setErrorMessage('Notion workspace not found. Please reconnect to Notion.');
      setIsAuthenticated(false);
      return;
    }

    setSyncStatus('starting');
    setErrorMessage(null);

    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const response = await fetch(`${apiBase}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          jobId,
          userId,
          workspaceId
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('authTimestamp');
          throw new Error('Authentication failed. Please reconnect to Notion.');
        } else {
          throw new Error(errorData.error || 'Failed to sync highlights');
        }
      }

      setSyncStatus('queued');
      setErrorMessage(null);

      // Start polling immediately after queuing
      const job = await pollJobStatus(jobId);
      if (job.status === 'failed') {
        throw new Error(job.error || 'Sync failed to start');
      }
    } catch (error) {
      setSyncStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync highlights';
      setErrorMessage(errorMessage);
      
      // Log detailed error for debugging
      console.error('Sync error:', {
        error,
        jobId,
        timestamp: new Date().toISOString()
      });
      
      // Reset file state for specific errors
      if (error instanceof Error &&
          (errorMessage.includes('Validation failed') ||
           errorMessage.includes('active file upload') ||
           errorMessage.includes('Authentication failed'))) {
        setFile(null);
        setHighlightCount(0);
        setJobId(null);
      }
    }
  };

  useEffect(() => {
    // Initialize authentication state
    const initializeAuth = async () => {
      const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
      
      // Check URL parameters for auth status
      const searchParams = new URLSearchParams(window.location.search);
      const status = searchParams.get('status');
      const workspaceId = searchParams.get('workspaceId');
      const error = searchParams.get('error');
      
      // Clear URL parameters regardless of result
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (status === 'success' && workspaceId) {
        // Validate that both OAuth and database setup were successful
        try {
          const response = await fetch(`${apiBase}/auth/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workspaceId }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to validate setup');
          }
          
          const data = await response.json();
          if (data.databaseId) {
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('authTimestamp', Date.now().toString());
            localStorage.setItem('workspaceId', workspaceId);
          } else {
            throw new Error('Database not found');
          }
        } catch (error) {
          setIsAuthenticated(false);
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('authTimestamp');
          setErrorMessage('Database not found. Please ensure you have copied the template to your workspace.');
        }
      } else if (status === 'error' || error) {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        setErrorMessage(error === 'Invalid OAuth state' ?
          'Connection to Notion was canceled. Please try again.' :
          'Failed to connect to Notion. Please try again.');
      }

      // Check authentication status with proper error handling
      try {
        const authResponse = await fetch(`${apiBase}/auth/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!authResponse.ok) {
          if (authResponse.status === 401) {
            // Only reload if we have an auth token but it's invalid
            const hasAuthToken = document.cookie.includes('auth_token=');
            if (hasAuthToken) {
              // Clear auth state and cookies
              setIsAuthenticated(false);
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('authTimestamp');
              localStorage.removeItem('userId');
              localStorage.removeItem('workspaceId');
              
              // Clear cookies by setting expired auth_token
              document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              
              // Show error instead of reloading
              setErrorMessage('Session expired. Please reconnect to Notion.');
              return;
            }
            
            // No auth token - just set unauthenticated state
            setIsAuthenticated(false);
            return;
          }
          throw new Error(`Authentication check failed with status ${authResponse.status}`);
        }

        const authData = await authResponse.json();
        if (authData.id && authData.email && authData.workspaceId) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('authTimestamp', Date.now().toString());
          localStorage.setItem('userId', authData.id);
          localStorage.setItem('workspaceId', authData.workspaceId);
        } else {
          throw new Error('Invalid auth response');
        }
      } catch (error) {
        console.error('Auth check error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          status: error instanceof Error ? error.message : undefined
        });
        
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('userId');
        localStorage.removeItem('workspaceId');
        
        setErrorMessage('Session expired. Please reconnect to Notion.');
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
<label className={`mt-4 max-w-sm mx-auto bg-[#8b7355] hover:bg-[#6b5a46] text-white text-center font-medium px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-serif block ${
  syncStatus === 'parsing' || syncStatus === 'queued' || syncStatus === 'starting' || syncStatus === 'validating'
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer'
}`}>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    disabled={syncStatus === 'parsing' || syncStatus === 'queued' || syncStatus === 'starting' || syncStatus === 'validating'}
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
                    disabled={syncStatus === 'parsing' || syncStatus === 'queued' || syncStatus === 'starting' || syncStatus === 'validating'}
                    className={`mt-4 max-w-sm mx-auto bg-[#8b7355] hover:bg-[#6b5a46] text-white font-medium px-6 py-2 rounded-md transition-colors font-serif block ${
                      syncStatus === 'parsing' || syncStatus === 'queued' || syncStatus === 'starting' || syncStatus === 'validating'
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    {syncStatus === 'parsing' ? 'Parsing...' :
                     syncStatus === 'queued' ? 'In Queue...' :
                     syncStatus === 'starting' ? 'Starting sync...' :
                     syncStatus === 'validating' ? 'Please wait...' : 'Sync Highlights'}
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
                           <div>• Processing runs in the background in a queue.</div>
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
                    className={`mt-4 max-w-sm mx-auto bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-center font-medium px-6 py-2 rounded-md transition-colors font-serif block ${
                      ['parsing', 'queued', 'starting', 'validating'].includes(syncStatus)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    disabled={['parsing', 'queued', 'starting', 'validating'].includes(syncStatus)}
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
