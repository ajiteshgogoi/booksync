export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string[];
  location: string;
  date: Date;
  id?: string; // Optional for backward compatibility
}

export interface ProcessedHighlight {
  content: string;
  location: string;
  highlight: Highlight;
}

export interface NotionBookPage {
  title: string;
  author: string;
  highlights: Highlight[];
  lastHighlighted: Date;
  lastSynced: Date;
  pageId?: string;
}
