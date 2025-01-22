import stringSimilarity from 'string-similarity';
import { normalizeText } from './textUtils';

// Minimum similarity threshold (0-1)
const SIMILARITY_THRESHOLD = 0.9;

interface SimilarityResult {
  similar: boolean;
  isSubset: boolean;
}

// Check if two pieces of text are similar enough to be considered duplicates
// and determine if one is a subset of the other
export function areSimilarTexts(text1: string, text2: string): SimilarityResult {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  // If texts are exactly the same after normalization, they're duplicates
  if (normalized1 === normalized2) {
    return { similar: true, isSubset: false };
  }

  // Calculate similarity using Levenshtein distance
  const similarity = stringSimilarity.compareTwoStrings(normalized1, normalized2);

  // Check if one text is a subset of the other with high similarity
  const isSubset = (shorter: string, longer: string): boolean => {
    // Find the longest common substring
    const words1 = shorter.split(' ');
    const words2 = longer.split(' ');
    let maxCommonLength = 0;
    
    for (let i = 0; i < words1.length; i++) {
      for (let j = 0; j < words2.length; j++) {
        let commonLength = 0;
        while (i + commonLength < words1.length &&
               j + commonLength < words2.length &&
               words1[i + commonLength] === words2[j + commonLength]) {
          commonLength++;
        }
        maxCommonLength = Math.max(maxCommonLength, commonLength);
      }
    }

    // If the shorter text's words appear mostly in sequence in the longer text
    return maxCommonLength >= words1.length * 0.8;
  };

  const shorter = normalized1.length <= normalized2.length ? normalized1 : normalized2;
  const longer = normalized1.length <= normalized2.length ? normalized2 : normalized1;
  
  const subset = isSubset(shorter, longer);

  return {
    similar: similarity >= SIMILARITY_THRESHOLD || subset,
    isSubset: subset
  };
}

// Find the most similar text in an array of texts
export function findMostSimilarText(needle: string, haystack: string[]): { text: string; similarity: number } | null {
  if (haystack.length === 0) return null;

  const normalized = normalizeText(needle);
  let maxSimilarity = 0;
  let mostSimilar = haystack[0];

  for (const text of haystack) {
    const similarity = stringSimilarity.compareTwoStrings(normalized, normalizeText(text));
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilar = text;
    }
  }

  return {
    text: mostSimilar,
    similarity: maxSimilarity
  };
}
