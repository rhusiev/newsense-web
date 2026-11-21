import type {
    FeedFilter,
    StorySummaryStatus,
    ThreadBrief,
    ThreadTimeline,
    Item,
} from "./types";

const PROD_URL = import.meta.env.VITE_API_URL || "http://localhost";

export const BASE_URL = import.meta.env.PROD ? PROD_URL : "http://localhost";

async function handleResponse(response: Response) {
    if (response.status === 204) return null;
    if (!response.ok) {
        const text = await response.text().catch(() => "");
        let message = text || `Request failed (${response.status}).`;
        try {
            const parsed = JSON.parse(text);
            if (typeof parsed.error === "string") message = parsed.error;
        } catch {
            if (response.status === 429) message = "Too many requests. Try again shortly.";
        }
        throw new Error(message);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}

async function fetchClient(url: string, options: RequestInit = {}) {
    const config = {
        ...options,
        credentials: "include" as RequestCredentials,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    };

    const response = await fetch(url, config);
    return handleResponse(response);
}

export const api = {
    me: (headers?: HeadersInit) => fetchClient(`${BASE_URL}/auth/me`, { headers }),
    login: (data: any) =>
        fetchClient(`${BASE_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    register: (data: any) =>
        fetchClient(`${BASE_URL}/auth/register`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    registerWithCode: (code: string, data: any) =>
        fetchClient(`${BASE_URL}/auth/register/${code}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    logout: () => fetchClient(`${BASE_URL}/auth/logout`, { method: "POST" }),

    getSubscribed: () => fetchClient(`${BASE_URL}/feeds/subscribed`),
    getOwned: () => fetchClient(`${BASE_URL}/feeds/owned`),
    searchFeeds: (q: string) => fetchClient(`${BASE_URL}/feeds/search?q=${q}`),
    subscribe: (id: string) =>
        fetchClient(`${BASE_URL}/feeds/${id}/subscription`, {
            method: "POST",
        }),
    unsubscribe: (id: string) =>
        fetchClient(`${BASE_URL}/feeds/${id}/subscription`, {
            method: "DELETE",
        }),
    deleteFeed: (id: string) =>
        fetchClient(`${BASE_URL}/feeds/${id}`, { method: "DELETE" }),
    createFeed: (data: any) =>
        fetchClient(`${BASE_URL}/feeds`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateFeed: (id: string, data: any) =>
        fetchClient(`${BASE_URL}/feeds/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    getPopularFeeds: (params: { limit?: number; offset?: number } = {}) => {
        const query = new URLSearchParams();
        if (params.limit) query.append("limit", params.limit.toString());
        if (params.offset) query.append("offset", params.offset.toString());
        return fetchClient(`${BASE_URL}/feeds/popular?${query.toString()}`);
    },

    getUnreadCounts: (
        params: { score_min?: number; score_max?: number } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        return fetchClient(`${BASE_URL}/items/unread-counts?${query.toString()}`);
    },

    getItemUnreadCount: (
        params: {
            score_min?: number;
            score_max?: number;
            top_n?: number;
            tz?: string;
            per_feed?: boolean;
        } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        if (params.per_feed) query.append("per_feed", "true");
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        return fetchClient(`${BASE_URL}/items/unread-count?${query.toString()}`);
    },

    getFeedItemUnreadCount: (
        feedId: string,
        params: {
            score_min?: number;
            score_max?: number;
            top_n?: number;
            tz?: string;
        } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        return fetchClient(
            `${BASE_URL}/items/feed/${feedId}/unread-count?${query.toString()}`,
        );
    },

    markAllRead: (since: string, before?: string) =>
        fetchClient(`${BASE_URL}/items/mark-read`, {
            method: "POST",
            body: JSON.stringify(before ? { since, before } : { since }),
        }),

    markFeedRead: (feedId: string, since: string, before?: string) =>
        fetchClient(`${BASE_URL}/items/feed/${feedId}/mark-read`, {
            method: "POST",
            body: JSON.stringify(before ? { since, before } : { since }),
        }),

    getFeedItems: (
        feedId: string,
        params: {
            before?: string;
            unread_only?: boolean;
            limit?: number;
            score_min?: number;
            score_max?: number;
            top_n?: number;
            tz?: string;
            per_feed?: boolean;
        } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        if (params.per_feed) query.append("per_feed", "true");

        return fetchClient(
            `${BASE_URL}/items/feed/${feedId}?${query.toString()}`,
        );
    },

    getAllItems: (
        params: {
            before?: string;
            unread_only?: boolean;
            limit?: number;
            score_min?: number;
            score_max?: number;
            top_n?: number;
            tz?: string;
            per_feed?: boolean;
        } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        if (params.per_feed) query.append("per_feed", "true");

        return fetchClient(`${BASE_URL}/items?${query.toString()}`);
    },

    getFullText: (itemId: string) =>
        fetchClient(`${BASE_URL}/items/${itemId}/full-text`),

    updateItemStatus: (
        itemId: string,
        status: { is_read?: boolean; liked?: number | null },
    ) =>
        fetchClient(`${BASE_URL}/items/${itemId}/status`, {
            method: "PUT",
            body: JSON.stringify(status),
        }),

    getThreads: (): Promise<ThreadBrief[]> =>
        fetchClient(`${BASE_URL}/threads`),

    getThread: (threadId: string): Promise<ThreadTimeline> =>
        fetchClient(`${BASE_URL}/threads/${threadId}`),

    getStoryThread: (storyId: string): Promise<ThreadTimeline> =>
        fetchClient(`${BASE_URL}/clusters/${storyId}/thread`),

    getItem: (itemId: string): Promise<Item> =>
        fetchClient(`${BASE_URL}/items/${itemId}`),

    getGlobalClusters: (
        params: {
            before?: string;
            unread_only?: boolean;
            limit?: number;
            score_min?: number;
            score_max?: number;
            top_n?: number;
            tz?: string;
            per_feed?: boolean;
        } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        if (params.per_feed) query.append("per_feed", "true");
        return fetchClient(`${BASE_URL}/clusters?${query.toString()}`);
    },

    getFeedClusters: (
        feedId: string,
        params: {
            before?: string;
            unread_only?: boolean;
            limit?: number;
            score_min?: number;
            score_max?: number;
            top_n?: number;
            tz?: string;
        } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        return fetchClient(
            `${BASE_URL}/clusters/feed/${feedId}?${query.toString()}`,
        );
    },

    getStorySummaryStatus: (storyId: string): Promise<StorySummaryStatus> =>
        fetchClient(`${BASE_URL}/clusters/${storyId}/summary/status`),

    refreshStorySummary: (storyId: string) =>
        fetchClient(`${BASE_URL}/clusters/${storyId}/summary/refresh`, {
            method: "POST",
        }),

    updateClusterStatus: (
        clusterId: string,
        status: { is_read?: boolean; liked?: number | null },
    ) =>
        fetchClient(`${BASE_URL}/clusters/${clusterId}/status`, {
            method: "PUT",
            body: JSON.stringify(status),
        }),

    getFeedClusterUnreadCount: (
        feedId: string,
        params: { top_n?: number; tz?: string } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        return fetchClient(
            `${BASE_URL}/clusters/feed/${feedId}/unread-count?${query.toString()}`,
        );
    },

    getClusterUnreadCount: (
        params: {
            score_min?: number;
            score_max?: number;
            top_n?: number;
            tz?: string;
            per_feed?: boolean;
        } = {},
    ) => {        const query = new URLSearchParams();
        if (params.top_n !== undefined)
            query.append("top_n", params.top_n.toString());
        if (params.tz) query.append("tz", params.tz);
        if (params.per_feed) query.append("per_feed", "true");
        if (params.score_min !== undefined)
            query.append("score_min", params.score_min.toString());
        if (params.score_max !== undefined)
            query.append("score_max", params.score_max.toString());
        return fetchClient(
            `${BASE_URL}/clusters/unread-count?${query.toString()}`,
        );
    },

    getSettings: () => fetchClient(`${BASE_URL}/settings`),
    getLlmKey: () => fetchClient(`${BASE_URL}/settings/llm-key`),
    setLlmKey: (data: { base_url: string; model: string; api_key: string }) =>
        fetchClient(`${BASE_URL}/settings/llm-key`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    deleteLlmKey: () =>
        fetchClient(`${BASE_URL}/settings/llm-key`, { method: "DELETE" }),
    updateSettings: (data: Record<string, unknown>) =>
        fetchClient(`${BASE_URL}/settings`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    setFeedFilter: (feedId: string, filter: FeedFilter) =>
        fetchClient(`${BASE_URL}/feeds/${feedId}/filter`, {
            method: "PUT",
            body: JSON.stringify(filter),
        }),

    checkAdmin: () => fetchClient(`${BASE_URL}/admin`),
    getLlmUsers: () => fetchClient(`${BASE_URL}/admin/users/llm`),
    setUserLlm: (userId: string, data: { allowed?: boolean; daily_limit?: number }) =>
        fetchClient(`${BASE_URL}/admin/users/${userId}/llm`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    getAdminCodes: () => fetchClient(`${BASE_URL}/admin/codes`),
    getAdminCodesCount: () => fetchClient(`${BASE_URL}/admin/codes/count`),
    generateAdminCodes: (count: number, uses?: number) =>
        fetchClient(`${BASE_URL}/admin/codes/generate`, {
            method: "POST",
            body: JSON.stringify({ count, uses }),
        }),
    createAdminCode: (code: string, uses?: number) =>
        fetchClient(`${BASE_URL}/admin/codes`, {
            method: "POST",
            body: JSON.stringify({ code, uses }),
        }),
    updateAdminCodeUses: (code: string, uses_left: number) =>
        fetchClient(`${BASE_URL}/admin/codes/${code}`, {
            method: "PATCH",
            body: JSON.stringify({ uses_left }),
        }),
    deleteAdminCode: (code: string) =>
        fetchClient(`${BASE_URL}/admin/codes/${code}`, {
            method: "DELETE",
        }),
};
