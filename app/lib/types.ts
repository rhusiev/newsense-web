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
    feed_id: string;
    title: string;
    link: string;
    content: string | null;
    author: string | null;
    published_at: string | null;
    is_read: boolean | null;
    liked: number | null;
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
