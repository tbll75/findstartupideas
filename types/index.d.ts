declare type SearchResultItem = {
  id: number;
  painTitle: string;
  mentions: number;
  tag: string;
  quotes: Array<{
    text: string;
    upvotes: number;
    author: string;
    permalink?: string;
  }>;
};