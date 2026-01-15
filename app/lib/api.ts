const PROD_URL = import.meta.env.VITE_API_URL || "http://localhost";

export const BASE_URL = import.meta.env.PROD ? PROD_URL : "http://localhost";

async function handleResponse(response: Response) {
    if (response.status === 204) return null;
    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(errorBody || `API Error: ${response.statusText}`);
    }
    return response.json();
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
    getFeedSubscribers: (id: string) =>
        fetchClient(`${BASE_URL}/feeds/${id}/subscribers/count`),

    getUnreadCounts: () => fetchClient(`${BASE_URL}/items/unread-counts`),

    markAllRead: (since: string) =>
        fetchClient(`${BASE_URL}/items/mark-read`, {
            method: "POST",
            body: JSON.stringify({ since }),
        }),

    markFeedRead: (feedId: string, since: string) =>
        fetchClient(`${BASE_URL}/items/feed/${feedId}/mark-read`, {
            method: "POST",
            body: JSON.stringify({ since }),
        }),

    getFeedItems: (
        feedId: string,
        params: { before?: string; unread_only?: boolean; limit?: number } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());

        return fetchClient(
            `${BASE_URL}/items/feed/${feedId}?${query.toString()}`,
        );
    },

    getAllItems: (
        params: { before?: string; unread_only?: boolean; limit?: number } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());

        return fetchClient(`${BASE_URL}/items?${query.toString()}`);
    },

    updateItemStatus: (
        itemId: string,
        status: { is_read?: boolean; liked?: number },
    ) =>
        fetchClient(`${BASE_URL}/items/${itemId}/status`, {
            method: "PUT",
            body: JSON.stringify(status),
        }),

    getGlobalClusters: (
        params: { before?: string; unread_only?: boolean; limit?: number } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());
        return fetchClient(`${BASE_URL}/clusters?${query.toString()}`);
    },

    getFeedClusters: (
        feedId: string,
        params: { before?: string; unread_only?: boolean; limit?: number } = {},
    ) => {
        const query = new URLSearchParams();
        if (params.before) query.append("before", params.before);
        if (params.unread_only) query.append("unread_only", "true");
        if (params.limit) query.append("limit", params.limit.toString());
        return fetchClient(
            `${BASE_URL}/clusters/feed/${feedId}?${query.toString()}`,
        );
    },

    updateClusterStatus: (
        clusterId: string,
        status: { is_read?: boolean; liked?: number },
    ) =>
        fetchClient(`${BASE_URL}/clusters/${clusterId}/status`, {
            method: "PUT",
            body: JSON.stringify(status),
        }),

    markFeedClustersRead: (feedId: string, since: string) =>
        fetchClient(`${BASE_URL}/clusters/feed/${feedId}/mark-read`, {
            method: "POST",
            body: JSON.stringify({ since }),
        }),

    getClusterUnreadCount: () =>
        fetchClient(`${BASE_URL}/clusters/unread-count`),
};
