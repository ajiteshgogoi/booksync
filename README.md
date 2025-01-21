# BookSync

A clean, simple web application to sync your Kindle highlights to Notion. BookSync automatically organizes your highlights by book, preserves metadata like locations and dates, and prevents duplicates.

## Features

- OAuth integration with Notion
- Automatic database detection
- Parses My Clippings.txt from Kindle
- Groups highlights by book
- Preserves highlight metadata (location, date)
- Prevents duplicate highlights
- Real-time sync progress tracking

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

## Usage

1. Copy the Kindle Highlights template to your Notion workspace
2. Connect your Notion account through the app
3. Upload your Kindle's My Clippings.txt file
4. Watch your highlights sync to Notion!

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
│   ├── services/
│   │   ├── notionClient.ts    # Notion API integration
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