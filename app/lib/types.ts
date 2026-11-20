import type { FeedFilterMode } from "./constants";

export interface Feed {
    id: string;
    owner_id: string | null;
    url: string;
    title: string | null;
    description: string | null;
    is_public: boolean;
    subscriber_count: number;
    created_at: string;
    unread_count?: number;
    read_count?: number;
    full_text?: boolean;
}

/** A feed's own filter: off, its score threshold, or its daily top N. */
export interface FeedFilter {
    mode: FeedFilterMode;
    score_threshold: number | null;
    top_n: number | null;
}

export interface Item {
    id: string;
    feed_ids: string[];
    title: string;
    link: string;
    content: string | null;
    author: string | null;
    published_at: string;
    is_read: boolean;
    liked: number | null; // 1, 0 or -1; null until rated
    cluster_id: string | null;
    prediction_score?: number;
}

export interface Cluster {
    id: string;
    is_cluster: boolean;
    sort_date: string;
    items: Item[];
    is_read?: boolean;
    liked?: number | null;
    // Picked from below the day's top N so the model learns what it would hide.
    explored?: boolean;
}

export interface User {
    user_id: string;
    username: string;
}

export interface AccessCode {
    code: string;
    uses_left: number;
}

export interface StorySummaryStatus {
    // "ready", "pending" or "not-applicable".
    status: string;
    summary?: string;
    model?: string;
    updated_at?: string;
    can_recreate: boolean;
    used_today: number;
    daily_limit: number;
}

export interface UnreadCountResponse {
    total_unread: number;
    feeds: {
        feed_id: string;
        unread_count: number;
    }[];
}
