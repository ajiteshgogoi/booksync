# BookSync - Kindle Highlights to Notion Sync

BookSync helps you sync your Kindle highlights to Notion automatically. Upload your My Clippings.txt file and BookSync will create a beautiful database of your book highlights in Notion.

## Migration to Cloudflare Workers

We're migrating from GitHub Actions to Cloudflare Workers for better scalability and reliability. This guide will help you transition to the new system.

### Setting Up Cloudflare Worker

1. Create a Cloudflare account if you don't have one
2. Set up the following resources:
   - Workers KV namespace for OAuth tokens
   - R2 bucket for highlight file storage
   - Durable Objects for job tracking

3. Configure secrets in Cloudflare:
   ```bash
   wrangler secret put NOTION_CLIENT_ID
   wrangler secret put NOTION_CLIENT_SECRET
   ```

4. Deploy the worker:
   ```bash
   cd workers
   npm install
   npm run deploy
   ```

### Update Notion App Settings

1. Update your Notion OAuth redirect URI to point to your worker:
   ```
   https://booksync-worker.your-workers-dev.workers.dev/oauth/callback
   ```

2. Update your app's callback URL in the Notion developer dashboard

### Environment Variables

The worker requires the following environment variables:

```toml
# In .dev.vars for local development
NOTION_CLIENT_ID="your-client-id"
NOTION_CLIENT_SECRET="your-client-secret"
NOTION_REDIRECT_URI="https://booksync-worker.your-workers-dev.workers.dev/oauth/callback"
```

### API Endpoints

The worker exposes the following endpoints:

#### Upload Endpoint
```http
POST /upload
Content-Type: multipart/form-data

file: My Clippings.txt
userId: string
workspaceId: string
```

#### Sync Endpoint
```http
POST /sync
Content-Type: application/json

{
  "jobId": "string",
  "userId": "string"
}
```

#### Health Check
```http
GET /health
```

### Monitoring & Debugging

- Check worker health: `GET /health`
- Test webhook: `POST /test-webhook`
- Monitor job status via the job store
- Logs available in Cloudflare dashboard

### Cleanup

After migrating:

1. Remove GitHub Actions workflows:
   - `.github/workflows/sync.yml`
   - `.github/workflows/webhook.yml`

2. Update frontend configuration to use worker endpoints

3. Clean up old Redis setup:
   ```bash
   # Optional: Export data if needed
   npm run export-redis
   
   # Remove Redis service
   npm run cleanup-redis
   ```

### Development

Run locally:
```bash
cd workers
npm install
npm run dev
```

Run tests:
```bash
npm test
```

### Architecture

The new architecture uses:
- Cloudflare Workers for processing
- R2 for file storage
- Workers KV for OAuth tokens
- Durable Objects for job state
- Scheduled tasks for sync and cleanup

Benefits:
- Better scalability
- Reduced latency
- No Redis dependency
- Automatic cleanup
- Built-in monitoring

### Troubleshooting

1. Check worker health endpoint for service status
2. Verify environment variables are set
3. Monitor job progress in Cloudflare dashboard
4. Check R2 and KV access

### Support

For issues or questions:
1. Check the health endpoint
2. Review worker logs in Cloudflare dashboard
3. Open an issue on GitHub

## License

MIT License - see [LICENSE](LICENSE) for details
