import {
    useEffect,
    useState,
    useRef,
    useCallback,
    useLayoutEffect,
} from "react";
import {
    CheckCheck,
    RotateCw,
    Eye,
    EyeOff,
    Loader2,
    PanelLeft,
} from "lucide-react";
import { api } from "~/lib/api";
import type { Item, Cluster } from "~/lib/types";
import { ArticleItem } from "./ArticleItem";
import { ClusterItem } from "./ClusterItem";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";

interface ArticleListProps {
    feed: any;
    refreshKey: number;
    feedMap: Map<string, string>;
    onItemRead: () => void;
    triggerConfirm: (config: any) => void;
    onError: (msg: string) => void;
    externalUnreadOnly?: boolean;
    setExternalUnreadOnly?: (val: boolean) => void;
    isMobile?: boolean;
    showSidebarToggle?: boolean;
    onSidebarToggle?: () => void;
}

export function ArticleList({
    feed,
    refreshKey,
    feedMap,
    onItemRead,
    triggerConfirm,
    onError,
    externalUnreadOnly,
    setExternalUnreadOnly,
    isMobile = false,
    showSidebarToggle = false,
    onSidebarToggle,
}: ArticleListProps) {
    const USE_CLUSTERS = true;

    const [localUnreadOnly, setLocalUnreadOnly] = useState(false);

    const unreadOnly =
        externalUnreadOnly !== undefined ? externalUnreadOnly : localUnreadOnly;
    const setUnreadOnly = setExternalUnreadOnly || setLocalUnreadOnly;

    const [items, setItems] = useState<Item[]>([]);
    const [clusters, setClusters] = useState<Cluster[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
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
    }, [items, clusters]);

    const loadItems = useCallback(async () => {
        if (!feed) return;
        setLoading(true);
        setHasMore(true);
        try {
            const params = { limit: 20, unread_only: unreadOnly };

            if (USE_CLUSTERS) {
                const data =
                    feed.id === "all"
                        ? await api.getGlobalClusters(params)
                        : await api.getFeedClusters(feed.id, params);
                setClusters(data);
                setHasMore(data.length === 20);
                setItems([]);
            } else {
                const data =
                    feed.id === "all"
                        ? await api.getAllItems(params)
                        : await api.getFeedItems(feed.id, params);
                setItems(data);
                setHasMore(data.length === 20);
                setClusters([]);
            }
        } catch (err: any) {
            onError("Failed to load content.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [feed, unreadOnly, onError, USE_CLUSTERS]);

    const loadMore = async () => {
        if (
            !feed ||
            loadingMore ||
            !hasMore ||
            (items.length === 0 && clusters.length === 0)
        )
            return;
        setLoadingMore(true);

        try {
            let cursor = "";
            if (USE_CLUSTERS && clusters.length > 0) {
                cursor = clusters[clusters.length - 1].sort_date;
            } else if (!USE_CLUSTERS && items.length > 0) {
                const lastItem = items[items.length - 1];
                cursor = lastItem.published_at;
            }

            const params = {
                limit: 20,
                before: cursor || undefined,
                unread_only: unreadOnly,
            };

            if (USE_CLUSTERS) {
                const data =
                    feed.id === "all"
                        ? await api.getGlobalClusters(params)
                        : await api.getFeedClusters(feed.id, params);

                if (data.length === 0) {
                    setHasMore(false);
                } else {
                    setClusters((prev) => [...prev, ...data]);
                    if (data.length < 20) setHasMore(false);
                }
            } else {
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
    }, [hasMore, items, clusters, loading, loadingMore]);

    const handleSync = async () => {
        if (!feed || isSyncing) return;
        setIsSyncing(true);
        try {
            const params = { limit: 20, unread_only: unreadOnly };

            if (USE_CLUSTERS) {
                const newData: Cluster[] =
                    feed.id === "all"
                        ? await api.getGlobalClusters(params)
                        : await api.getFeedClusters(feed.id, params);

                setClusters((prev) => {
                    const existingIds = new Set(prev.map((c) => c.id));
                    const unique = newData.filter(
                        (c) => !existingIds.has(c.id),
                    );
                    if (unique.length > 0 && scrollRef.current) {
                        lastScrollHeight.current =
                            scrollRef.current.scrollHeight;
                        return [...unique, ...prev];
                    }
                    return prev;
                });
            } else {
                const newData: Item[] =
                    feed.id === "all"
                        ? await api.getAllItems(params)
                        : await api.getFeedItems(feed.id, params);

                setItems((prev) => {
                    const existingIds = new Set(prev.map((i) => i.id));
                    const unique = newData.filter(
                        (i) => !existingIds.has(i.id),
                    );
                    if (unique.length > 0 && scrollRef.current) {
                        lastScrollHeight.current =
                            scrollRef.current.scrollHeight;
                        return [...unique, ...prev];
                    }
                    return prev;
                });
            }
        } catch (e) {
            onError("Sync failed.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUpdateItemStatus = async (
        itemId: string,
        updates: { is_read?: boolean; liked?: number },
    ) => {
        try {
            await api.updateItemStatus(itemId, updates);

            if (USE_CLUSTERS) {
                setClusters((prev) =>
                    prev.map((c) => {
                        const itemExists = c.items.some((i) => i.id === itemId);
                        if (!itemExists) return c;

                        return {
                            ...c,
                            items: c.items.map((i) =>
                                i.id === itemId ? { ...i, ...updates } : i,
                            ),
                        };
                    }),
                );
            } else {
                setItems((prev) =>
                    prev.map((i) =>
                        i.id === itemId ? { ...i, ...updates } : i,
                    ),
                );
            }

            if (updates.is_read !== undefined) onItemRead();
        } catch (e) {
            onError("Failed to update status");
        }
    };

    const handleUpdateClusterStatus = async (
        clusterId: string,
        updates: { is_read?: boolean; liked?: number },
    ) => {
        try {
            await api.updateClusterStatus(clusterId, updates);

            setClusters((prev) =>
                prev.map((c) => {
                    if (c.id === clusterId) {
                        const updatedItems = c.items.map((i) => ({
                            ...i,
                            ...updates,
                        }));
                        return { ...c, items: updatedItems };
                    }
                    return c;
                }),
            );
            if (updates.is_read !== undefined) onItemRead();
        } catch (e) {
            onError("Failed to update cluster status");
        }
    };

    const handleLikeToggleItem = async (item: Item, value: number) => {
        const newValue = item.liked === value ? 0 : value;
        await handleUpdateItemStatus(item.id, {
            liked: newValue,
            is_read: true,
        });
    };

    useEffect(() => {
        loadItems();
    }, [loadItems, refreshKey]);

    const isEmpty = USE_CLUSTERS ? clusters.length === 0 : items.length === 0;

    return (
        <div className="flex-1 h-full flex flex-col bg-brand-surface">
            <header
                className={`${isMobile ? "hidden" : "flex"} px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 justify-between items-start gap-4`}
            >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    {showSidebarToggle && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onSidebarToggle}
                            className="-ml-2 mt-0.5 text-gray-500"
                            title="Toggle Sidebar"
                        >
                            <PanelLeft size={20} />
                        </Button>
                    )}
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-serif text-brand-950 mb-1 truncate">
                            {feed?.title || "Feed"}
                        </h1>
                        <p className="text-sm text-gray-400 truncate">
                            {feed?.id === "all"
                                ? "All subscriptions"
                                : feed?.url}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSync}
                        isLoading={isSyncing}
                        title="Refresh Articles"
                    >
                        {!isSyncing && <RotateCw size={18} />}
                    </Button>

                    <Button
                        variant={unreadOnly ? "secondary" : "ghost"}
                        onClick={() => setUnreadOnly(!unreadOnly)}
                        title={
                            unreadOnly
                                ? "Show all articles"
                                : "Show unread only"
                        }
                    >
                        {unreadOnly ? (
                            <EyeOff size={18} className="mr-2" />
                        ) : (
                            <Eye size={18} className="mr-2" />
                        )}
                        <span className="hidden sm:inline">
                            {unreadOnly ? "Unread Shown" : "All Shown"}
                        </span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() =>
                            triggerConfirm({
                                title: "Mark All Read",
                                message: "Mark all items in this view as read?",
                                onConfirm: async () => {
                                    try {
                                        const since = "1970-01-01T00:00:00Z";
                                        if (USE_CLUSTERS) {
                                            if (feed.id === "all") {
                                                await api.markAllRead(since);
                                            } else {
                                                await api.markFeedClustersRead(
                                                    feed.id,
                                                    since,
                                                );
                                            }
                                        } else {
                                            feed.id === "all"
                                                ? await api.markAllRead(since)
                                                : await api.markFeedRead(
                                                      feed.id,
                                                      since,
                                                  );
                                        }
                                        loadItems();
                                        onItemRead();
                                    } catch (e) {
                                        onError("Action failed.");
                                    }
                                },
                            })
                        }
                        title="Mark all items in this list as read"
                    >
                        <CheckCheck size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline">Mark All Read</span>
                    </Button>
                </div>
            </header>

            <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto ${isMobile ? "p-4 space-y-4" : "p-8 space-y-6"}`}
            >
                {isEmpty && !loading ? (
                    <EmptyState className="py-20">
                        No articles found.
                    </EmptyState>
                ) : (
                    <>
                        {USE_CLUSTERS &&
                            clusters.map((cluster) => (
                                <ClusterItem
                                    key={cluster.id}
                                    cluster={cluster}
                                    feedMap={feedMap}
                                    onUpdateClusterStatus={
                                        handleUpdateClusterStatus
                                    }
                                    onUpdateItemStatus={handleUpdateItemStatus}
                                />
                            ))}

                        {!USE_CLUSTERS &&
                            items.map((item) => {
                                const primaryFeedId =
                                    item.feed_ids.find((id) =>
                                        feedMap.has(id),
                                    ) || item.feed_ids[0];
                                const feedName =
                                    feedMap.get(primaryFeedId) ||
                                    "Subscription";

                                return (
                                    <ArticleItem
                                        key={item.id}
                                        item={item}
                                        feedName={feedName}
                                        onUpdateStatus={handleUpdateItemStatus}
                                        onLikeToggle={handleLikeToggleItem}
                                    />
                                );
                            })}
                    </>
                )}
                <div
                    ref={observerTarget}
                    className="h-20 flex justify-center items-center text-brand-600"
                >
                    {loadingMore && <Loader2 className="animate-spin" />}
                </div>
            </div>
        </div>
    );
}
