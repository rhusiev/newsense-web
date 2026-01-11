export interface Feed {
    id: string;
    owner_id: string | null;
    url: string;
    title: string | null;
    description: string | null;
    is_public: boolean;
    created_at: string;
    unread_count?: number;
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
    liked: number; // 0, 1, or -1
    cluster_id: string | null;
}

export interface Cluster {
    id: string;
    is_cluster: boolean;
    sort_date: string;
    items: Item[];
    is_read?: boolean;
    liked?: number;
}

export interface User {
    user_id: string;
    username: string;
}

export interface UnreadCountResponse {
    total_unread: number;
    feeds: {
        feed_id: string;
        unread_count: number;
    }[];
}
