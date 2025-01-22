import { areSimilarTexts } from './fuzzyMatching';
import { Highlight, ProcessedHighlight } from '../types';

export class HighlightDeduplicator {
  private readonly processedHighlights: ProcessedHighlight[] = [];

  isDuplicate(highlight: Highlight): boolean {
    const content = highlight.highlight.join(' ');
    const location = highlight.location;

    // First check for exact location matches with fuzzy content comparison
    const locationMatches = this.processedHighlights.filter(h => 
      h.location.split('-')[0] === location.split('-')[0]
    );

    if (locationMatches.length > 0) {
      // If we have highlights with the same location, check content similarity
      return locationMatches.some(h => areSimilarTexts(h.content, content));
    }

    // If no location matches, check for very high similarity in content
    // This catches cases where the same text appears in different locations
    return this.processedHighlights.some(h => 
      areSimilarTexts(h.content, content) && 
      Math.abs(
        parseInt(h.location.split('-')[0]) - 
        parseInt(location.split('-')[0])
      ) < 5 // Allow small location differences
    );
  }

  add(highlight: Highlight): void {
    this.processedHighlights.push({
      content: highlight.highlight.join(' '),
      location: highlight.location,
      highlight
    });
  }
}
