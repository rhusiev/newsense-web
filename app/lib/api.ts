const AUTH_URL = "http://localhost:3000";
const FEEDS_URL = "http://localhost:3001";
const ITEMS_URL = "http://localhost:3002";
export const AUTH_API_URL = AUTH_URL;

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
    me: (headers?: HeadersInit) => fetchClient(`${AUTH_URL}/me`, { headers }),

    login: (data: any) =>
        fetchClient(`${AUTH_URL}/login`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    register: (data: any) =>
        fetchClient(`${AUTH_URL}/register`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    logout: () => fetchClient(`${AUTH_URL}/logout`, { method: "POST" }),

    getSubscribed: () => fetchClient(`${FEEDS_URL}/feeds/subscribed`),
    getOwned: () => fetchClient(`${FEEDS_URL}/feeds/owned`),
    searchFeeds: (q: string) => fetchClient(`${FEEDS_URL}/feeds/search?q=${q}`),
    subscribe: (id: string) =>
        fetchClient(`${FEEDS_URL}/feeds/${id}/subscription`, {
            method: "POST",
        }),
    unsubscribe: (id: string) =>
        fetchClient(`${FEEDS_URL}/feeds/${id}/subscription`, {
            method: "DELETE",
        }),
    deleteFeed: (id: string) =>
        fetchClient(`${FEEDS_URL}/feeds/${id}`, { method: "DELETE" }),
    createFeed: (data: any) =>
        fetchClient(`${FEEDS_URL}/feeds`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateFeed: (id: string, data: any) =>
        fetchClient(`${FEEDS_URL}/feeds/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    getFeedSubscribers: (id: string) =>
        fetchClient(`${FEEDS_URL}/feeds/${id}/subscribers/count`),

    getFeedItems: (feedId: string) =>
        fetchClient(`${ITEMS_URL}/feeds/${feedId}/items`),

    getAllItems: () => fetchClient(`${ITEMS_URL}/items`),

    updateItemStatus: (
        itemId: string,
        status: { is_read?: boolean; liked?: number },
    ) =>
        fetchClient(`${ITEMS_URL}/items/${itemId}/status`, {
            method: "PUT",
            body: JSON.stringify(status),
        }),

    markRead: (itemId: string) =>
        fetchClient(`${ITEMS_URL}/items/${itemId}/status`, {
            method: "PUT",
            body: JSON.stringify({ is_read: true }),
        }),
};
