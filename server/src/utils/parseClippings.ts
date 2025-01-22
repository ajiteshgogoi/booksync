import { splitText } from './textUtils';
import { HighlightDeduplicator } from './deduplicationUtils';
import { Highlight } from '../types';

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

      const groupKey = `${bookTitle}|${location.split('-')[0]}`;
      if (!highlightGroups.has(groupKey)) {
        highlightGroups.set(groupKey, []);
      }
      highlightGroups.get(groupKey)!.push({
        bookTitle,
        author,
        highlight: highlightChunks,
        location,
        date
      });
    } catch (error) {
      console.error('Error parsing entry:', error);
      continue;
    }
  }

  // Process each group with fuzzy deduplication
  for (const group of highlightGroups.values()) {
    // Sort by date, newest first
    group.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const deduplicator = new HighlightDeduplicator();
    
    for (const highlight of group) {
      if (!deduplicator.isDuplicate(highlight)) {
        deduplicator.add(highlight);
        highlights.push(highlight);
      } else {
        console.debug('Skipping duplicate highlight:', {
          content: highlight.highlight.join(' '),
          location: highlight.location
        });
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
