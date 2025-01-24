# BookSync

[![Live Website](https://img.shields.io/badge/demo-live-brightgreen)](https://booksync.vercel.app/)

A modern web application to sync Kindle highlights to Notion, using Redis streams and GitHub Actions backend processing.

## Key Features

- **Stream-based Processing**
  - Redis streams for reliable job queuing
  - Consumer groups for parallel processing
  - At-least-once delivery semantics
  - Automatic job retries and dead-letter handling

- **Smart Deduplication**
  - SHA-256 based content hashing
  - Location-aware duplicate detection
  - Automatic handling of edited highlights
  - Redis-backed hash storage with TTL

- **Client-side File Handling**
  - Secure file upload with progress tracking
  - Client-side parsing and validation
  - Chunked uploads for large files
  - Automatic retries on network failures

- **GitHub Actions Backend**
  - Scheduled processing every 30 minutes
  - Fair usage limits per user
  - Automatic scaling based on queue size
  - Detailed processing metrics

## Architecture

### 1. Client Layer
- React frontend with Vite
- File upload and parsing
- Progress tracking and status updates
- OAuth integration with Notion

### 2. Queue Layer
- Redis streams for job management
- Consumer groups for parallel processing
- Automatic retry mechanism
- Dead-letter queue for failed jobs

### 3. Processing Layer
- GitHub Actions backend
- Scheduled processing every 30 minutes
- Batch processing of highlights
- Rate-limited Notion API calls
- Automatic retries with exponential backoff

### 4. Storage Layer
- Redis for job queues and caching
- R2 storage for temporary file storage
- Notion as primary data store

## Setup & Deployment

### Prerequisites
- Node.js v18+
- Redis v6+ with streams support
- GitHub repository with Actions enabled
- Notion integration credentials

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_STREAM_NAME=booksync-jobs
REDIS_CONSUMER_GROUP=booksync-workers

# GitHub Actions
GITHUB_ACCESS_TOKEN=your_token
GITHUB_WORKFLOW_FILE=.github/workflows/process.yml

# Notion Integration
NOTION_OAUTH_CLIENT_ID=your_client_id
NOTION_OAUTH_CLIENT_SECRET=your_client_secret
NOTION_REDIRECT_URI=http://localhost:3001/auth/notion/callback
```

### Deployment Steps

1. Set up Redis with streams support
2. Configure GitHub Actions workflow
3. Set up Notion integration
4. Deploy frontend and backend
5. Configure environment variables

## Usage

1. Connect your Notion account
2. Upload My Clippings.txt
3. Highlights are queued for processing
4. View progress and status
5. Access synced highlights in Notion

## Development

### Client Structure

```
client/
├── src/
│   ├── components/      # UI components
│   ├── services/        # API clients
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application
│   └── main.tsx         # Entry point
```

### Server Structure

```
server/
├── src/
│   ├── services/
│   │   ├── redisJobService.ts    # Redis stream management
│   │   ├── notionClient.ts       # Notion API integration
│   │   └── githubService.ts      # GitHub Actions integration
│   ├── worker.ts                 # Background processor
│   └── index.ts                  # API server
```

## Troubleshooting

### Common Issues

- **Redis Connection Issues**
  - Verify Redis streams support
  - Check consumer group configuration

- **GitHub Actions Failures**
  - Verify workflow permissions
  - Check rate limits

- **Notion API Errors**
  - Verify integration permissions
  - Check rate limits

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
