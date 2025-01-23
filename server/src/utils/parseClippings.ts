import { createHash } from 'crypto';

export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string[];
  location: string;
  date: Date;
  hash: string;
}

function generateHighlightHash(highlight: string[], location: string, bookTitle: string, author: string): string {
  // Generate hash from first chunk plus metadata to avoid length issues
  // This ensures unique identification while staying within Notion's limits
  const firstChunk = highlight[0] || '';
  const content = firstChunk + location + bookTitle + author;
  return createHash('sha256').update(content).digest('hex');
}

// Split text into chunks of maxLength, ensuring chunks end at sentence boundaries and strictly enforcing length limit
function splitText(text: string, maxLength = 2000): string[] {
  // Early validation
  if (!text || text.length === 0) {
    return [];
  }

  // Handle case where text is already within limits
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split text into sentences using common punctuation and handle ellipsis
  const sentences = text
    .split(/(?<=[.!?](?:\s+|$))/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const sentence of sentences) {
    const potentialChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    
    // If adding this sentence would exceed maxLength, start a new chunk
    if (potentialChunk.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If a single sentence is too long, split it into smaller chunks
      if (sentence.length > maxLength) {
        let remainingText = sentence;
        while (remainingText.length > 0) {
          // Find the last space within maxLength characters
          let cutoff = maxLength;
          if (remainingText.length > maxLength) {
            cutoff = remainingText.lastIndexOf(' ', maxLength);
            if (cutoff === -1) cutoff = maxLength; // If no space found, hard break at maxLength
          }
          
          chunks.push(remainingText.substring(0, cutoff).trim());
          remainingText = remainingText.substring(cutoff).trim();
        }
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  if (currentChunk) {
    // Final validation check
    if (currentChunk.length > maxLength) {
      const lastSpace = currentChunk.lastIndexOf(' ', maxLength);
      if (lastSpace !== -1) {
        chunks.push(currentChunk.substring(0, lastSpace).trim());
        chunks.push(currentChunk.substring(lastSpace).trim());
      } else {
        chunks.push(currentChunk.substring(0, maxLength).trim());
        if (currentChunk.length > maxLength) {
          chunks.push(currentChunk.substring(maxLength).trim());
        }
      }
    } else {
      chunks.push(currentChunk.trim());
    }
  }
  
  // Final validation to ensure no chunk exceeds maxLength
  return chunks.map(chunk => {
    if (chunk.length > maxLength) {
      console.warn(`Found chunk exceeding ${maxLength} characters, truncating...`);
      return chunk.substring(0, maxLength);
    }
    return chunk;
  });
}

export function parseClippings(fileContent: string): Highlight[] {
  console.log('Starting to parse clippings file');
  const entries = fileContent
    .split('==========')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
  
  console.log(`Found ${entries.length} valid entries`);
  
  const highlights: Highlight[] = [];
  const highlightGroups = new Map<string, Highlight[]>();

  for (const entry of entries) {
    try {
      const lines = entry.split(/\r?\n/).map(line => line.trim());
      
      if (lines.length < 3) {
        console.log('Skipping entry: insufficient lines', { lineCount: lines.length });
        continue;
      }

      const titleAuthorMatch = lines[0].match(/^(.*?)\s*\((.*?)\)$/);
      if (!titleAuthorMatch) {
        console.log('Skipping entry: invalid title/author format', { line: lines[0] });
        continue;
      }

      const bookTitle = titleAuthorMatch[1].trim();
      const author = titleAuthorMatch[2].trim();

      if (lines[1].includes('Your Bookmark')) {
        console.log('Skipping entry: bookmark');
        continue;
      }
      
      const metadataMatch = lines[1].match(/^- Your (?:Highlight|Note) (?:at|on page \d+)?\s*(?:\|?\s*(?:location(?:s)? (\d+(?:-\d+)?)|page \d+)?)?\s*(?:\|?\s*Added on (.+))?$/);
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

      const highlightContent = lines.slice(2).join('\n').trim();
      if (!highlightContent) {
        console.log('Skipping entry: empty highlight content');
        continue;
      }

      // Split highlight into chunks at sentence boundaries
      const highlightChunks = splitText(highlightContent);
      
      // Validate chunks and provide detailed logging
      highlightChunks.forEach((chunk, i) => {
        if (chunk.length > 2000) {
          console.error(`ERROR: Chunk exceeds Notion limit in "${bookTitle}": Chunk ${i + 1}/${highlightChunks.length} is ${chunk.length} characters`);
          // Truncate chunk to ensure it fits
          highlightChunks[i] = chunk.substring(0, 2000);
        } else if (chunk.length > 1900) {
          console.warn(`Warning: Chunk approaching Notion limit in "${bookTitle}": Chunk ${i + 1}/${highlightChunks.length} is ${chunk.length} characters`);
        }
      });

      // Additional validation for very large highlights
      if (highlightChunks.length > 10) {
        console.warn(`Warning: Large number of chunks (${highlightChunks.length}) for highlight in "${bookTitle}". Consider reviewing the content.`);
      }

      const groupKey = `${bookTitle}|${location.split('-')[0]}`;
      if (!highlightGroups.has(groupKey)) {
        highlightGroups.set(groupKey, []);
      }
      const highlight = {
        bookTitle,
        author,
        highlight: highlightChunks,
        location,
        date,
        hash: generateHighlightHash(highlightChunks, location, bookTitle, author)
      };
      highlightGroups.get(groupKey)!.push(highlight);
    } catch (error) {
      console.error('Error parsing entry:', error);
      continue;
    }
  }

  for (const group of highlightGroups.values()) {
    group.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const uniqueHighlights = new Set<string>();
    
    for (const highlight of group) {
      const isDuplicate = uniqueHighlights.has(highlight.hash);
      
      if (!isDuplicate) {
        uniqueHighlights.add(highlight.hash);
        highlights.push(highlight);
      }
    }
  }

  console.log(`Successfully parsed ${highlights.length} highlights`);
  
  // Log a sample highlight for verification
  if (highlights.length > 0) {
    console.debug('Sample highlight:', JSON.stringify(highlights[0], null, 2));
  }
  
  // Verify all highlights have required fields
  highlights.forEach((h, index) => {
    console.debug(`Verifying highlight ${index + 1}/${highlights.length}`);
    if (!h.bookTitle || !h.author || !h.highlight || !h.location || !h.date) {
      console.warn('Invalid highlight structure:', h);
    }
  });

  return highlights;
}
