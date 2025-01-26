export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string[];
  location: string;
  date: Date;
  hash: string;
  version?: number;
  lastModified?: Date;
}