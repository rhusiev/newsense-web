export const DEFAULT_FILTER_PREDICTION = true;
export const DEFAULT_FILTER_PREDICTION_THRESHOLD = -0.7;
export const DEFAULT_USE_CLUSTERS = true;
// "score" hides articles below the threshold; "top" keeps the day's N best.
export const DEFAULT_FILTER_MODE: FilterMode = "score";
// Chosen by the user. Replay of 2026 labels: the day's top 40 clusters held 94-97% of the liked ones (Apr-Sep).
export const DEFAULT_TOP_PER_DAY = 40;
export const MAX_TOP_PER_DAY = 200;

export type FilterMode = "score" | "top";

// A feed stays exempt from the prediction filter until both of these are true:
// enough time has passed and enough of its articles have been read. Until then
// there is too little interaction history for the scores to mean anything, and
// filtering on them would just leave the feed looking empty.
export const NEW_FEED_FILTER_GRACE_DAYS = 7;
export const NEW_FEED_FILTER_GRACE_READS = 5;
