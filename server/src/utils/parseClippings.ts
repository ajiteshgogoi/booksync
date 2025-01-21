export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string;
  location: string;
  date: Date;
}

export function parseClippings(fileContent: string): Highlight[] {
  console.log('Starting to parse clippings file');
  const entries = fileContent.split('==========');
  console.log(`Found ${entries.length} raw entries`);
  
  const highlights: Highlight[] = [];

  for (const entry of entries) {
    try {
      // Handle both Windows (\r\n) and Unix (\n) line endings
      const lines = entry.trim().split(/\r?\n/).map(line => line.trim());
      
      // Skip empty entries
      if (lines.length < 4) {
        console.log('Skipping entry: insufficient lines', { lineCount: lines.length });
        continue;
      }

      // Log the entry being processed
      console.log('Processing entry:', {
        titleLine: lines[0],
        metadataLine: lines[1],
        contentPreview: lines.slice(2).join('\n').substring(0, 50) + '...'
      });

      // Extract book title and author
      const titleAuthorMatch = lines[0].match(/^(.*?)\s*\((.*?)\)$/);
      if (!titleAuthorMatch) {
        console.log('Skipping entry: invalid title/author format', { line: lines[0] });
        continue;
      }

      const bookTitle = titleAuthorMatch[1].trim();
      const author = titleAuthorMatch[2].trim();

      // Extract highlight metadata
      const metadataMatch = lines[1].match(/- Your Highlight (?:at|on page \d+) \| location (\d+-\d+) \| Added on (.+)$/);
      if (!metadataMatch) {
        console.log('Skipping entry: invalid metadata format', { line: lines[1] });
        continue;
      }

      const location = metadataMatch[1];
      const dateStr = metadataMatch[2];
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        console.log('Skipping entry: invalid date', { dateStr });
        continue;
      }

      // Extract highlight content
      const highlight = lines.slice(2).join('\n').trim();
      if (!highlight) {
        console.log('Skipping entry: empty highlight content');
        continue;
      }

      // Log successful parse
      console.log('Successfully parsed highlight:', {
        bookTitle,
        author,
        location,
        date: date.toISOString(),
        contentPreview: highlight.substring(0, 50) + '...'
      });

      highlights.push({
        bookTitle,
        author,
        highlight,
        location,
        date
      });
    } catch (error) {
      console.error('Error parsing entry:', error);
      continue;
    }
  }

  console.log(`Successfully parsed ${highlights.length} highlights`);
  return highlights;
}
