import {
    useEffect,
    useState,
    useRef,
    useCallback,
    useLayoutEffect,
} from "react";
import {
    Check,
    Circle,
    CheckCheck,
    RotateCw,
    ThumbsUp,
    ThumbsDown,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";
import { api } from "~/lib/api";
import type { Item } from "~/lib/types";

export function ArticleList({
    feed,
    refreshKey,
    feedMap,
    onItemRead,
    triggerConfirm,
    onError,
}: any) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);
    const lastScrollHeight = useRef<number>(0);
    const observerTarget = useRef(null);

    useLayoutEffect(() => {
        if (scrollRef.current && lastScrollHeight.current > 0) {
            const diff =
                scrollRef.current.scrollHeight - lastScrollHeight.current;
            scrollRef.current.scrollTop += diff;
            lastScrollHeight.current = 0;
        }
    }, [items]);

    const loadItems = useCallback(async () => {
        if (!feed) return;
        setLoading(true);
        setHasMore(true);
        try {
            const params = { limit: 20, unread_only: unreadOnly };
            const data =
                feed.id === "all"
                    ? await api.getAllItems(params)
                    : await api.getFeedItems(feed.id, params);
            setItems(data);
            setHasMore(data.length === 20);
        } catch (err: any) {
            onError("Failed to load articles.");
        } finally {
            setLoading(false);
        }
    }, [feed, unreadOnly, onError]);

    const loadMore = async () => {
        if (!feed || loadingMore || !hasMore || items.length === 0) return;
        setLoadingMore(true);
        const lastItem = items[items.length - 1];

        try {
            const params = {
                limit: 20,
                before: lastItem.published_at || undefined,
                unread_only: unreadOnly,
            };
            const data =
                feed.id === "all"
                    ? await api.getAllItems(params)
                    : await api.getFeedItems(feed.id, params);

            if (data.length === 0) {
                setHasMore(false);
            } else {
                setItems((prev) => [...prev, ...data]);
                if (data.length < 20) setHasMore(false);
            }
        } catch (err: any) {
            onError(`Could not load more items: ${err.message}`);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasMore &&
                    !loading &&
                    !loadingMore
                ) {
                    loadMore();
                }
            },
            { threshold: 0.1 },
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, items, loading, loadingMore]);

    const handleSync = async () => {
        if (!feed || isSyncing) return;
        setIsSyncing(true);
        try {
            const params = { limit: 20, unread_only: unreadOnly };
            const newData: Item[] =
                feed.id === "all"
                    ? await api.getAllItems(params)
                    : await api.getFeedItems(feed.id, params);

            setItems((prev) => {
                const existingIds = new Set(prev.map((i) => i.id));
                const unique = newData.filter((i) => !existingIds.has(i.id));
                if (unique.length > 0 && scrollRef.current) {
                    lastScrollHeight.current = scrollRef.current.scrollHeight;
                    return [...unique, ...prev];
                }
                return prev;
            });
        } catch (e) {
            onError("Sync failed.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUpdateStatus = async (
        itemId: string,
        updates: { is_read?: boolean; liked?: number },
    ) => {
        try {
            await api.updateItemStatus(itemId, updates);
            setItems((prev) =>
                prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
            );
            if (updates.is_read !== undefined) onItemRead();
        } catch (e) {
            onError("Failed to update status");
        }
    };

    const handleLikeToggle = async (item: Item, value: number) => {
        const newValue = item.liked === value ? 0 : value;
        await handleUpdateStatus(item.id, { liked: newValue, is_read: true });
    };

    useEffect(() => {
        loadItems();
    }, [loadItems, refreshKey]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex-1 h-full flex flex-col bg-[#fcfdfc]">
            <div className="px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-serif text-[#0e3415] mb-1 truncate">
                        {feed?.title || "Feed"}
                    </h1>
                    <p className="text-sm text-gray-400">
                        {feed?.id === "all" ? "All subscriptions" : feed?.url}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                        title="Sync"
                    >
                        <RotateCw
                            size={18}
                            className={isSyncing ? "animate-spin" : ""}
                        />
                    </button>

                    <button
                        onClick={() => setUnreadOnly(!unreadOnly)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${unreadOnly ? "bg-[#eef5ef] text-[#0e3415]" : "hover:bg-gray-100 text-gray-600"}`}
                    >
                        {unreadOnly ? <EyeOff size={18} /> : <Eye size={18} />}
                        <span>
                            {unreadOnly ? "Showing Unread" : "Show Unread Only"}
                        </span>
                    </button>

                    <button
                        onClick={() =>
                            triggerConfirm({
                                title: "Mark All Read",
                                message: "Mark all items in this view as read?",
                                onConfirm: async () => {
                                    try {
                                        const since = "1970-01-01T00:00:00Z";
                                        feed.id === "all"
                                            ? await api.markAllRead(since)
                                            : await api.markFeedRead(
                                                  feed.id,
                                                  since,
                                              );
                                        loadItems();
                                        onItemRead();
                                    } catch (e) {
                                        onError("Action failed.");
                                    }
                                },
                            })
                        }
                        className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-2"
                    >
                        <CheckCheck size={18} />
                        <span className="hidden sm:inline">Mark All Read</span>
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6"
            >
                {items.length === 0 && !loading ? (
                    <div className="text-center py-20 text-gray-400 italic">
                        No articles found.
                    </div>
                ) : (
                    items.map((item) => (
                        <article
                            key={item.id}
                            className={`bg-white border border-gray-100 rounded-xl p-6 shadow-sm transition-opacity ${item.is_read ? "opacity-50" : ""}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#587e5b]">
                                        {feedMap.get(item.feed_id) ||
                                            "Subscription"}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {formatDate(
                                            item.published_at || item.id,
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            handleLikeToggle(item, 1)
                                        }
                                        className={`p-1.5 rounded-md transition-all duration-200 active:scale-90 ${
                                            item.liked === 1
                                                ? "text-green-700 bg-green-100 hover:bg-green-200 hover:text-green-800"
                                                : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                                        }`}
                                    >
                                        <ThumbsUp
                                            size={18}
                                            fill={
                                                item.liked === 1
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleLikeToggle(item, -1)
                                        }
                                        className={`p-1.5 rounded-md transition-all duration-200 active:scale-90 ${
                                            item.liked === -1
                                                ? "text-red-700 bg-red-100 hover:bg-red-200 hover:text-red-800"
                                                : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        }`}
                                    >
                                        <ThumbsDown
                                            size={18}
                                            fill={
                                                item.liked === -1
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>

                                    <div className="w-px h-4 bg-gray-200 mx-1" />

                                    <button
                                        onClick={() =>
                                            handleUpdateStatus(item.id, {
                                                is_read: !item.is_read,
                                            })
                                        }
                                        className={`p-1.5 rounded-md transition-all duration-200 active:scale-90 ${
                                            item.is_read
                                                ? "text-[#587e5b] bg-[#587e5b]/10 hover:bg-[#587e5b]/20"
                                                : "text-gray-400 hover:bg-gray-100 hover:text-[#587e5b]"
                                        }`}
                                    >
                                        {item.is_read ? (
                                            <Check size={18} strokeWidth={3} />
                                        ) : (
                                            <Circle size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-xl font-semibold mb-2 hover:underline decoration-[#9ac39d]"
                            >
                                {item.title}
                            </a>
                            <div className="text-gray-600 text-sm line-clamp-2">
                                {item.content
                                    ?.replace(/<[^>]*>?/gm, "")
                                    .substring(0, 200)}
                                ...
                            </div>
                        </article>
                    ))
                )}

                <div
                    ref={observerTarget}
                    className="h-20 flex justify-center items-center text-[#587e5b]"
                >
                    {loadingMore && <Loader2 className="animate-spin" />}
                </div>
            </div>
        </div>
    );
}
