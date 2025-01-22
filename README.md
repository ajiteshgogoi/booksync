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
  - Background processing for large libraries
  - Continues syncing even if browser is closed
  - Real-time progress tracking
  - Automatic rate limiting
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

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/libsync.git
cd libsync
```

2. Set up Notion Integration
   - Go to https://www.notion.so/my-integrations
   - Create a new integration
   - Set the redirect URI to `http://localhost:3001/auth/notion/callback`
   - Copy the OAuth client ID and secret

3. Set up environment variables
```bash
# In server/.env
NOTION_OAUTH_CLIENT_ID=your_client_id
NOTION_OAUTH_CLIENT_SECRET=your_client_secret
NOTION_REDIRECT_URI=http://localhost:3001/auth/notion/callback
CLIENT_URL=http://localhost:5173

# In client/.env
VITE_API_URL=http://localhost:3001
```

4. Install dependencies and start servers
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

5. Visit http://localhost:5173 in your browser

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
- Each sync is queued with a unique job ID
- Progress is tracked across sessions
- Background processing continues if browser closes
- Automatic rate limiting and retries

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
   - The app will parse and start syncing your highlights
   - You can close the browser - sync will continue in background
   - Return anytime to check progress

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

### Vercel Deployment

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
   ```

4. Update client environment:
   - Create `.env.production` in client directory
   - Set `VITE_API_URL=https://your-vercel-url.vercel.app`

5. Deploy:
   ```bash
   vercel
   ```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
