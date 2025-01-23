# BookSync

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://booksync.vercel.app/)

A clean, simple web application to sync your Kindle highlights to Notion. BookSync automatically organizes your highlights by book, preserves metadata like locations and dates, and uses smart deduplication to ensure clean data.

## Features

- **Smart Deduplication**
  - Parser-level deduplication of overlapping highlights
  - Content + location based duplicate detection
  - Hash-based syncing using SHA-256 of highlight content and metadata
  - Automatic handling of edited highlights
  - Enhanced hash generation using book title, author and content
  - Redis cache with multiple TTLs:
    - Highlights: 24 hours
    - Books: 24 hours
    - Page IDs: 24 hours
    - OAuth tokens: 2 hours
  - Automatic cache invalidation for updated books
  - Metrics collection for cache operations
- **Efficient and Protected Syncing**
  - Fair usage background processing:
    - Runs every 30 minutes via GitHub Actions
    - Limited to 2 uploads per user per run
    - Processes up to 1000 highlights per run
    - Uses batches of 25 for optimal performance
    - Jobs processed in strict FIFO order (oldest first)
  - Smart resource management:
    - Instant duplicate detection saves processing time
    - Only processes new or modified highlights
    - Automatic continuation for large files
    - 5 hour maximum runtime per workflow
  - Protected against abuse:
    - Rate limiting (10 Notion API requests/minute)
    - IP-based upload limiting (2 uploads per IP every 30 minutes)
    - Shared 2000 minutes/month fairly distributed
    - Upload validation and format checking
    - User session expiration after 1 hour of inactivity
- **Notion Integration**
  - OAuth integration with automatic refresh and invalidation
  - Automatic database detection
  - Book cover fetching from multiple sources
  - Preserves all highlight metadata
  - Rate limited API calls (10 requests per minute)
  - Automatic retry mechanism for failed requests
  - Detailed sync metrics collection
- **User Experience**
- Simplified status UI
- Background processing notifications
- Sync status persistence
- Clean, intuitive interface with parchment texture background
- Cache management options
- Detailed error reporting
- Responsive design for mobile and desktop

## Prerequisites

- Node.js v18 or higher
- Redis v6 or higher (for caching and queue management)

## Setup

1. Clone the repository
```bash
git clone https://github.com/ajiteshgogoi/booksync.git
cd booksync
```

2. Set up Redis
   - Install Redis on your system (if not already installed)
   - Start Redis server locally or use a cloud service like Redis Labs
   - Note down your Redis connection URL

3. Set up Notion Integration
   - Go to https://www.notion.so/my-integrations
   - Create a new integration
   - Set the redirect URI to `http://localhost:3001/auth/notion/callback`
   - Copy the OAuth client ID and secret

4. Set up environment variables
```bash
# In server/.env
NOTION_OAUTH_CLIENT_ID=your_client_id
NOTION_OAUTH_CLIENT_SECRET=your_client_secret
NOTION_REDIRECT_URI=http://localhost:3001/auth/notion/callback
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379  # Or your Redis connection URL
REDIS_TTL=86400                   # Default cache TTL in seconds (24 hours)
REDIS_HIGHLIGHT_TTL=86400         # Highlight cache TTL
REDIS_BOOK_TTL=86400              # Book cache TTL
REDIS_PAGE_TTL=86400              # Page ID cache TTL
REDIS_OAUTH_TTL=7200              # OAuth token cache TTL
NOTION_RATE_LIMIT=10              # API calls per minute
GITHUB_ACCESS_TOKEN=your_token    # GitHub personal access token for Actions

# R2 Storage Configuration
R2_ENDPOINT=your_r2_endpoint
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_r2_bucket_name

# In client/.env
VITE_API_URL=http://localhost:3001
```

5. Install dependencies and start servers
```bash
# Install server dependencies
cd server
npm install
npm run dev

# In another terminal, install client dependencies
cd client
npm install
npm run dev
```

6. Visit http://localhost:5173 in your browser

## How It Works

### 1. Authentication Layer
- Uses OAuth 2.0 for secure Notion integration
- Implements automatic token refresh before expiration
- Stores OAuth tokens securely in Redis with 2 hour TTL
- Handles token revocation and re-authentication
- Maintains separate tokens per workspace

### 2. Parser Layer
When you upload My Clippings.txt, the parser:
- Groups highlights by book and location
- Generates SHA-256 hashes for each highlight using:
  - Highlight content
  - Location information
  - Book title
  - Author name
- Preserves metadata (location, timestamp)
- Handles multi-line highlights and special characters
- Uses Redis cache with multiple TTLs:
  - Highlight hashes: 24 hours
  - Book metadata: 24 hours
  - Page IDs: 24 hours
- Memory-efficient batch processing:
  - Processes entries in configurable batches (default 100)
  - Reduces memory usage for large files
  - Shows progress per batch
  - Maintains full validation and deduplication

### 3. Sync Layer
During synchronization:
- Processes highlights in batches of 100
- Implements Notion API rate limiting (10 requests per minute)
- Automatically fetches book covers from:
  - OpenLibrary (with retry mechanism)
  - Google Books (with retry mechanism)
- Implements robust retry mechanism:
  - Exponential backoff with jitter
  - Configurable retry attempts (default 3)
  - Smart delay between retries (1s, 2s, 4s with randomization)
- Creates or updates Notion pages with:
  - Title
  - Author
  - Highlight count
  - Last highlighted date
  - Last synced date
  - Highlight hash list
- Updates highlights with:
  - Full text content
  - Location information
  - Timestamp
  - Formatting
- Implements automatic retry with exponential backoff
- Tracks sync metrics:
  - Cache hit rate
  - Error rate
  - Operation count
  - API call statistics

### 4. Database Requirements
The Notion database must have these properties:
- Title (title)
- Author (rich_text)
- Highlights (number)
- Last Highlighted (date)
- Last Synced (date)
- Highlight Hash (rich_text)

### 4. UI Layer
The interface provides:
- Real-time sync progress
- Estimated time remaining
- Current operation status
- Background processing notifications
- Error handling with retry options
- Sync metrics visualization

## Usage

1. **First Time Setup**
   - Copy the [Kindle Highlights template](https://ajiteshgogoi.notion.site/182089fab37880bebf22e98f12c1ba1b?v=182089fab3788167a0e8000c719a4d5a) to your Notion workspace
   - Connect your Notion account through the app
   - The app will automatically find your highlights database

2. **Syncing Highlights**
   - Connect your Kindle to your computer
   - Find "My Clippings.txt" in your Kindle's documents folder
   - Upload the file through the BookSync interface
   - The app will parse and queue your highlights for processing
   - Processing happens via GitHub Actions workflow (runs every 30 minutes)
   - Fair usage limits:
     - Maximum 2 uploads per user every 30 minutes
     - Process 1000 highlights per run in batches of 25
     - 24-hour job storage ensures large file completion
     - Progress saved after each batch
   - Smart processing:
     - Continues from last position after interruptions
     - Instant duplicate detection via content hash
     - Safe to close browser - progress persists
     - Large files (5000+ highlights) process across runs
   - Protected multi-user system:
     - Notion API rate limiting (10 requests/minute)
     - 2000 monthly GitHub minutes shared fairly
     - Jobs processed in strict FIFO order (oldest first)
     - Re-uploading same content only affects your quota

3. **Organizing in Notion**
   - Highlights are organized by book
   - Each book page includes:
     - Cover image (auto-fetched)
     - Author information
     - Highlight count
     - Last highlighted date
     - Last sync date
   - Highlights preserve:
     - Original text
     - Location information
     - Timestamp
     - Formatting

## Development

The project is split into two parts:

- `client/`: React + TypeScript + Vite frontend
- `server/`: Node.js + Express + TypeScript backend

### Client Structure

```
client/
├── src/
│   ├── App.tsx         # Main application component
│   ├── App.css         # Styles
│   └── main.tsx        # Entry point
```

### Server Structure

```
server/
├── src/
│   ├── index.ts               # Express server setup
│   ├── worker.ts              # Background job processor
│   ├── services/
│   │   ├── notionClient.ts    # Notion API integration
│   │   ├── redisService.ts    # Redis queue management
│   │   ├── r2Service.ts       # R2 storage operations
│   │   ├── githubService.ts   # GitHub Actions trigger & file handling
│   │   └── syncService.ts     # Highlight sync logic
│   └── utils/
│       └── parseClippings.ts  # Kindle file parser

File Processing Flow:
1. Frontend uploads "My Clippings.txt"
2. githubService.ts:
   - Gets user ID from Redis OAuth data
   - Generates filename: clippings-{userId}-{timestamp}.txt
   - Uploads file to R2 storage
   - Triggers GitHub workflow with filename

3. GitHub Actions (processHighlights.js):
   - Gets filename from workflow payload
   - Retrieves file from R2 storage
   - Gets same user ID from Redis
   - Processes highlights using parseClippings.ts
```

## Deployment

### Hybrid Deployment (Vercel + GitHub Actions)

The application uses a hybrid deployment approach for optimal performance:
- Frontend and API endpoints on Vercel (free tier)
- Background sync processing on GitHub Actions (free tier)

1. Push your repository to GitHub

2. Create a new project on Vercel
   - Import your GitHub repository
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: client/dist
   - Install Command: `cd client && npm install`

3. Add Environment Variables in Vercel:
    ```
    NOTION_OAUTH_CLIENT_ID=your_client_id
    NOTION_OAUTH_CLIENT_SECRET=your_client_secret
    NOTION_REDIRECT_URI=https://your-vercel-url.vercel.app/auth/notion/callback
    CLIENT_URL=https://your-vercel-url.vercel.app
    REDIS_URL=your_redis_connection_url
    REDIS_TTL=86400

    # R2 Storage Configuration
    R2_ENDPOINT=your_r2_endpoint
    R2_ACCESS_KEY_ID=your_r2_access_key
    R2_SECRET_ACCESS_KEY=your_r2_secret_key
    R2_BUCKET_NAME=your_r2_bucket_name
    ```

    Note: The same R2 configuration must be added to GitHub Actions secrets in step 4

4. Add GitHub Repository Secrets:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     ```
     REDIS_URL=your_redis_connection_url
     NOTION_OAUTH_CLIENT_ID=your_client_id
     NOTION_OAUTH_CLIENT_SECRET=your_client_secret
     NOTION_REDIRECT_URI=https://your-vercel-url.vercel.app/auth/notion/callback
     GITHUB_ACCESS_TOKEN=your_github_token    # Required for GitHub Actions workflow
     ```
   Note: Use the same Notion OAuth credentials as your Vercel deployment
   For GITHUB_ACCESS_TOKEN, create a personal access token with 'repo' scope

5. Update client environment:
   - Create `.env.production` in client directory
   - Set `VITE_API_URL=https://your-vercel-url.vercel.app`

6. Set up Ko-fi widget (optional):
   - Sign up at Ko-fi.com
   - Get your Ko-fi username
   - Replace 'gogoi' with your username in the Ko-fi widget code in App.tsx

7. Deploy:
   ```bash
   vercel
   ```

## Troubleshooting

### Common Issues

1. **Redis Connection Issues**
   - Ensure Redis server is running (`redis-cli ping` should return 'PONG')
   - Check if REDIS_URL is correct in environment variables
   - For cloud Redis, verify network access and authentication

2. **Notion OAuth Errors**
   - Verify redirect URI matches exactly in both Notion integration settings and environment variables
   - Ensure all required environment variables are set
   - Check if Notion integration has required capabilities enabled

3. **Build Errors**
   - Ensure Node.js version is 18 or higher
   - Clear node_modules and package-lock.json, then run npm install again
   - Check for TypeScript compilation errors

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

Found a bug or have feedback? Email me at ajiteshgogoi@gmail.com

## Support

[![Buy Me a Coffee](https://img.shields.io/badge/Ko--fi-Buy%20me%20a%20coffee-blue?style=flat-square&logo=ko-fi)](https://ko-fi.com/gogoi)

## License

[MIT](LICENSE)
