import {
    useEffect,
    useState,
    useRef,
    useCallback,
    useLayoutEffect,
} from "react";
import { Loader2 } from "lucide-react";
import { api } from "~/lib/api";
import type { Item, Cluster } from "~/lib/types";
import { useSettings } from "~/lib/settings-context";
import { ArticleItem } from "./ArticleItem";
import { ClusterItem } from "./ClusterItem";
import { EmptyState } from "./ui/EmptyState";
import { ArticleListHeader } from "./ArticleListHeader";

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
    const {
        filterPrediction,
        filterPredictionThreshold,
        useClusters,
    } = useSettings();

    const filterItems = useCallback((items: Item[]) => {
        if (!filterPrediction) return items;
        return items.filter(
            (item) =>
                (item.prediction_score ?? 1) >= filterPredictionThreshold
        );
    }, [filterPrediction, filterPredictionThreshold]);

    const filterClusters = useCallback((clusters: Cluster[]) => {
        if (!filterPrediction) return clusters;
        return clusters
            .map((cluster) => ({
                ...cluster,
                items: filterItems(cluster.items),
            }))
            .filter((cluster) => cluster.items.length > 0);
    }, [filterPrediction, filterItems]);

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

            if (useClusters) {
                const data =
                    feed.id === "all"
                        ? await api.getGlobalClusters(params)
                        : await api.getFeedClusters(feed.id, params);
                const filtered = filterClusters(data);
                // Deduplicate by ID just in case
                const unique = filtered.filter(
                    (c, index, self) =>
                        index === self.findIndex((t) => t.id === c.id),
                );
                setClusters(unique);
                setHasMore(data.length === 20);
                setItems([]);
            } else {
                const data =
                    feed.id === "all"
                        ? await api.getAllItems(params)
                        : await api.getFeedItems(feed.id, params);
                const filtered = filterItems(data);
                // Deduplicate by ID just in case
                const unique = filtered.filter(
                    (i, index, self) =>
                        index === self.findIndex((t) => t.id === i.id),
                );
                setItems(unique);
                setHasMore(data.length === 20);
                setClusters([]);
            }
        } catch (err: any) {
            onError("Failed to load content.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [feed, unreadOnly, onError, useClusters, filterClusters, filterItems]);

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
            if (useClusters && clusters.length > 0) {
                cursor = clusters[clusters.length - 1].sort_date;
            } else if (!useClusters && items.length > 0) {
                const lastItem = items[items.length - 1];
                cursor = lastItem.published_at;
            }

            const params = {
                limit: 20,
                before: cursor || undefined,
                unread_only: unreadOnly,
            };

            if (useClusters) {
                const data =
                    feed.id === "all"
                        ? await api.getGlobalClusters(params)
                        : await api.getFeedClusters(feed.id, params);

                if (data.length === 0) {
                    setHasMore(false);
                } else {
                    const filteredData = filterClusters(data);
                    setClusters((prev) => {
                        const existingIds = new Set(prev.map((c) => c.id));
                        const unique = filteredData.filter(
                            (c) => !existingIds.has(c.id),
                        );
                        return [...prev, ...unique];
                    });
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
                    const filteredData = filterItems(data);
                    setItems((prev) => {
                        const existingIds = new Set(prev.map((i) => i.id));
                        const unique = filteredData.filter(
                            (i) => !existingIds.has(i.id),
                        );
                        return [...prev, ...unique];
                    });
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

            if (useClusters) {
                const data: Cluster[] =
                    feed.id === "all"
                        ? await api.getGlobalClusters(params)
                        : await api.getFeedClusters(feed.id, params);
                const newData = filterClusters(data);

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
                const data: Item[] =
                    feed.id === "all"
                        ? await api.getAllItems(params)
                        : await api.getFeedItems(feed.id, params);
                const newData = filterItems(data);

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

            if (useClusters) {
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

    const isEmpty = useClusters ? clusters.length === 0 : items.length === 0;

    return (
        <div className="flex-1 h-full flex flex-col bg-brand-surface">
            <ArticleListHeader
                feed={feed}
                isMobile={isMobile}
                showSidebarToggle={showSidebarToggle}
                onSidebarToggle={onSidebarToggle}
                isSyncing={isSyncing}
                onSync={handleSync}
                unreadOnly={unreadOnly}
                setUnreadOnly={setUnreadOnly}
                triggerConfirm={triggerConfirm}
                onError={onError}
                loadItems={loadItems}
                onItemRead={onItemRead}
                useClusters={useClusters}
            />

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
                        {useClusters &&
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

                        {!useClusters &&
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

