export const DEFAULT_FILTER_PREDICTION = true;
export const DEFAULT_FILTER_PREDICTION_THRESHOLD = -0.7;
export const DEFAULT_USE_CLUSTERS = true;

// A feed stays exempt from the prediction filter until both of these are true:
// enough time has passed and enough of its articles have been read. Until then
// there is too little interaction history for the scores to mean anything, and
// filtering on them would just leave the feed looking empty.
export const NEW_FEED_FILTER_GRACE_DAYS = 7;
export const NEW_FEED_FILTER_GRACE_READS = 5;
