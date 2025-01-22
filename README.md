# BookSync

A clean, simple web application to sync your Kindle highlights to Notion. BookSync automatically organizes your highlights by book, preserves metadata like locations and dates, and uses smart deduplication to ensure clean data.

## Features

- **Smart Deduplication**
  - Parser-level deduplication of overlapping highlights
  - Content + location based duplicate detection
  - Time-based syncing (only syncs highlights newer than last sync)
  - Automatic handling of edited highlights
  - Enhanced hash generation using book title, author and content
  - Redis cache with 24-hour TTL for efficient duplicate checking
- **Efficient Syncing**
  - Daily background processing via Vercel Cron Jobs (runs at midnight UTC)
  - Resilient processing with automatic retries and error recovery
  - Real-time progress tracking with job status persistence
  - Intelligent batch processing with rate limiting
- **Notion Integration**
  - OAuth integration with automatic refresh
  - Automatic database detection
  - Book cover fetching from multiple sources
  - Preserves all highlight metadata
- **User Experience**
  - Real-time progress bar with time estimates
  - Background processing notifications
  - Sync status persistence
  - Clean, intuitive interface

## Prerequisites

- Node.js v18 or higher
- Redis v6 or higher (for caching and queue management)

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/libsync.git
cd libsync
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
REDIS_TTL=86400                   # Cache TTL in seconds (24 hours)
CRON_SECRET=your_cron_secret     # Required for Vercel Cron authentication

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

### 1. Parser Layer
When you upload My Clippings.txt, the parser:
- Groups highlights by book and location
- Removes duplicates and overlapping content using enhanced hash generation
- Preserves metadata (location, timestamp)
- Handles multi-line highlights and special characters
- Uses Redis cache with 24-hour TTL for efficient duplicate checking

### 2. Queue Layer
For reliable processing:
- Each sync is queued with a unique job ID in Redis
- Progress is tracked across sessions with lastProcessedIndex
- Processing handled by GitHub Actions workflow (runs every 30 minutes)
- Automatic retries with exponential backoff
- Efficient batch processing with no timeout limits
- Support for large highlight files (thousands of entries)

### 3. Sync Layer
During synchronization:
- Checks last sync time for each book in Notion
- Only processes highlights newer than last sync
- Updates both 'Last Highlighted' and 'Last Synced' dates
- Chunks large highlights to meet Notion's limits

### 4. UI Layer
The interface provides:
- Real-time sync progress
- Estimated time remaining
- Current operation status
- Background processing notifications
- Error handling with retry options

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
   - Efficient batch processing with no timeout limits:
     - Can handle thousands of highlights
     - Processes up to 100 highlights per run
     - Progress is saved and can be checked anytime
     - Automatic continuation from last processed position
   - Free and unlimited processing using GitHub's free tier (2000 minutes/month)

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
│   │   └── syncService.ts     # Highlight sync logic
│   └── utils/
│       └── parseClippings.ts  # Kindle file parser
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
   ```

4. Add GitHub Repository Secrets:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     ```
     REDIS_URL=your_redis_connection_url
     NOTION_OAUTH_CLIENT_ID=your_client_id
     NOTION_OAUTH_CLIENT_SECRET=your_client_secret
     NOTION_REDIRECT_URI=https://your-vercel-url.vercel.app/auth/notion/callback
     ```
   Note: Use the same Notion OAuth credentials as your Vercel deployment

4. Update client environment:
   - Create `.env.production` in client directory
   - Set `VITE_API_URL=https://your-vercel-url.vercel.app`

5. Configure vercel.json with cron jobs:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "client/package.json",
         "use": "@vercel/static-build",
         "config": { "distDir": "dist" }
       },
       {
         "src": "server/src/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "server/src/index.ts" },
       { "src": "/(.*)", "dest": "client/dist/$1" }
     ],
     "crons": [
       {
         "path": "/api/cron/process-sync",
         "schedule": "*/2 * * * *"
       }
     ]
   }
   ```

6. Deploy:
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

3. **Sync Processing Issues**
   - Check if CRON_SECRET is properly set in Vercel environment variables
   - Monitor Vercel Cron job logs for any errors
   - Verify Redis connection and job queue state
   - Check for rate limiting or timeout issues

4. **Build Errors**
   - Ensure Node.js version is 18 or higher
   - Clear node_modules and package-lock.json, then run npm install again
   - Check for TypeScript compilation errors

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
