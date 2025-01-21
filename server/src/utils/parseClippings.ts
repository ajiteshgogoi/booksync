export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string;
  location: string;
  date: Date;
}

export function parseClippings(fileContent: string): Highlight[] {
  console.log('Starting to parse clippings file');
  // Split and filter entries
  const entries = fileContent
    .split('==========')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
  
  console.log(`Found ${entries.length} valid entries`);
  
  const highlights: Highlight[] = [];
  const highlightGroups = new Map<string, Highlight[]>();

  // First pass: group highlights by book and page
  for (const entry of entries) {
    try {
      // Handle both Windows (\r\n) and Unix (\n) line endings
      const lines = entry.split(/\r?\n/).map(line => line.trim());
      
      // Skip entries that don't have at least 3 lines (title, metadata, content)
      if (lines.length < 3) {
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
      // Skip bookmarks
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

      // Group highlights by book and page
      const groupKey = `${bookTitle}|${location.split('-')[0]}`;
      if (!highlightGroups.has(groupKey)) {
        highlightGroups.set(groupKey, []);
      }
      highlightGroups.get(groupKey)!.push({
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

  // Second pass: process groups to find most complete highlights
  for (const group of highlightGroups.values()) {
    // Sort by date (newest first)
    group.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Keep track of unique highlights
    const uniqueHighlights = new Set<string>();
    
    for (const highlight of group) {
      // Check if this highlight is a subset of any existing highlight
      let isSubset = false;
      for (const existing of uniqueHighlights) {
        if (existing.includes(highlight.highlight)) {
          isSubset = true;
          break;
        }
      }
      
      // If not a subset, add to unique highlights
      if (!isSubset) {
        uniqueHighlights.add(highlight.highlight);
        highlights.push(highlight);
      }
    }
  }

  console.log(`Successfully parsed ${highlights.length} highlights`);
  return highlights;
}
