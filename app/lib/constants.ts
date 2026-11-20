export const DEFAULT_USE_CLUSTERS = true;
// The All Articles score filter's default. Also the starting value for a feed's own score filter.
export const DEFAULT_SCORE_THRESHOLD = -0.7;

// A feed's own filter: off shows every article, score hides below its threshold,
// top keeps its best N stories a day.
export type FeedFilterMode = "off" | "score" | "top";

// How All Articles filters: off, by the global threshold, by one daily top N of
// all feeds, or each feed's own filter before the lists merge.
export type AllArticlesFilter = "off" | "score" | "top" | "each";
export const DEFAULT_ALL_ARTICLES_FILTER: AllArticlesFilter = "score";

// Chosen by the user. Replay of 2026 labels: the day's top 40 clusters held 94-97% of the liked ones (Apr-Sep).
export const DEFAULT_TOP_PER_DAY = 40;
export const MAX_TOP_PER_DAY = 200;

// "sheet" opens the reader over the list; "page" replaces the list.
export type ReaderLayout = "sheet" | "page";
export const DEFAULT_READER_LAYOUT: ReaderLayout = "sheet";

// A feed stays exempt from its score or top filter until both of these are true:
// enough time has passed and enough of its articles have been read. Until then
// there is too little interaction history for the scores to mean anything, and
// filtering on them would just leave the feed looking empty.
export const NEW_FEED_FILTER_GRACE_DAYS = 7;
export const NEW_FEED_FILTER_GRACE_READS = 5;
