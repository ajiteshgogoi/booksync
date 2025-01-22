export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // Replace multiple spaces/newlines with single space
    .replace(/\s+/g, ' ')
    // Remove punctuation except periods for sentence boundaries
    .replace(/[.,!?;:'"()\[\]{}]/g, '')
    .trim();
}

// Split text into chunks of maxLength, ensuring chunks end at sentence boundaries
export function splitText(text: string, maxLength = 2000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split text into sentences using common punctuation
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed maxLength, finalize current chunk
    if (currentChunk.length + sentence.length + 1 > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If a single sentence is too long, split it at spaces
      if (sentence.length > maxLength) {
        let words = sentence.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          if (currentLine.length + word.length + 1 > maxLength) {
            chunks.push(currentLine.trim());
            currentLine = '';
          }
          currentLine += (currentLine ? ' ' : '') + word;
        }
        
        if (currentLine) {
          chunks.push(currentLine.trim());
        }
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
