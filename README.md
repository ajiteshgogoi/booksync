# BookSync

BookSync is a streamlined tool that automatically syncs your Kindle highlights to Notion. It provides an efficient and user-friendly way to maintain a personal library of your favourite book passages.

📚 **[Try BookSync](https://booksync.vercel.app/)**

## Key Features

- **One-Click Integration**: Connect to Notion and copy a template to get started
- **Smart Deduplication**: Handles duplicate highlights intelligently to keep your library clean
- **Fast Processing**: Efficiently processes and syncs highlights in the background
- **Book Cover Integration**: Automatically fetches book covers from OpenLibrary or Google Books
- **Robust Error Handling**: Reliable processing with retry mechanisms and validation
- **Rate Limiting**: Prevents API abuse and ensures stable operation

## How It Works

1. **Setup**: 
   - Copy the Kindle Highlights template to your Notion workspace
   - Connect BookSync to your Notion account
   - Upload the 'My Clippings.txt' file from your Kindle

2. **Processing**:
   - Your highlights are parsed and validated
   - Book information is extracted and organized
   - Duplicates are identified and filtered
   - Highlights are queued for background processing

3. **Syncing**:
   - Highlights are synced to your Notion database
   - Book covers are automatically fetched
   - Background processing. Just click sync and close the page.

## Technical Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, TypeScript
- Storage: Cloudflare R2
- Processing: GitHub Actions for background jobs
- API Integration: Notion API

## Support

For bugs or feedback, please contact ajiteshgogoi@gmail.com.

<p align="left">
  <a href="https://ko-fi.com/gogoi">
    <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-Support_Development-FFDD00?style=for-the-badge&logo=ko-fi&logoColor=black" alt="Buy Me A Coffee" />
  </a>
</p>

