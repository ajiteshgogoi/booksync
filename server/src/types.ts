export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string;
  location: string;
  date: Date;
}

export interface NotionBookPage {
  title: string;
  author: string;
  highlights: Highlight[];
  lastHighlighted: Date;
  lastSynced: Date;
}
