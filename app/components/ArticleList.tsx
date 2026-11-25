import {
    useEffect,
    useState,
    useRef,
    useCallback,
    useLayoutEffect,
    useMemo,
} from "react";
import { Loader2 } from "lucide-react";
import { api } from "~/lib/api";
import type { Item, Cluster, Feed } from "~/lib/types";
import { useSettings } from "~/lib/settings-context";
import {
    NEW_FEED_FILTER_GRACE_DAYS,
    NEW_FEED_FILTER_GRACE_READS,
} from "~/lib/constants";
import { isWithinDays, browserTimeZone } from "~/lib/utils";
import { ArticleItem } from "./ArticleItem";
import { ClusterItem } from "./ClusterItem";
import { EmptyState } from "./ui/EmptyState";
import { ArticleListHeader } from "./ArticleListHeader";

const PAGE_SIZE = 20;

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
    const seen = new Set<string>();
    return rows.filter((row) => !seen.has(row.id) && seen.add(row.id));
}

interface ArticleListProps {
    feed: any;
    refreshKey: number;
    reloadKey: number;
    feedMap: Map<string, string>;
    onItemRead: () => void;
    onMarkRead: (feed: Feed) => void;
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
    reloadKey,
    feedMap,
    onItemRead,
    onMarkRead,
    triggerConfirm,
    onError,
    externalUnreadOnly,
    setExternalUnreadOnly,
    isMobile = false,
    showSidebarToggle = false,
    onSidebarToggle,
}: ArticleListProps) {
    const {
        allArticlesFilter,
        scoreThreshold,
        useClusters,
        topPerDay,
        feedFilters,
        listOrder,
    } = useSettings();

    // A feed applies its own filter; All Articles applies the Settings choice.
    // A feed the model has barely seen scores its articles badly, so filtering
    // would leave it looking empty. Stay exempt until the feed is both old
    // enough and read enough for the scores to be worth anything.
    const filterParams = useMemo(() => {
        if (!feed) return {};
        if (feed.id !== "all") {
            const filter = feedFilters[feed.id];
            if (!filter || filter.mode === "off") return {};
            const stillNew =
                isWithinDays(feed.created_at, NEW_FEED_FILTER_GRACE_DAYS) ||
                (feed.read_count ?? 0) < NEW_FEED_FILTER_GRACE_READS;
            if (stillNew) return {};
            if (filter.mode === "score") {
                return { score_min: filter.score_threshold ?? scoreThreshold };
            }
            return { top_n: filter.top_n ?? topPerDay, tz: browserTimeZone() };
        }
        switch (allArticlesFilter) {
            case "off":
                return {};
            case "score":
                return { score_min: scoreThreshold };
            case "top":
                return { top_n: topPerDay, tz: browserTimeZone() };
            case "each":
                return {
                    top_n: topPerDay,
                    tz: browserTimeZone(),
                    per_feed: true,
                };
        }
    }, [
        feed?.id,
        feed?.created_at,
        feed?.read_count,
        allArticlesFilter,
        scoreThreshold,
        topPerDay,
        feedFilters,
    ]);

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

    // Each reload starts a new generation; a response from an older one (an
    // earlier feed, filter or order) is dropped instead of mixed in.
    const generation = useRef(0);

    const fetchPage = useCallback(
        async (cursor?: { at: string; id: string }) => {
            const params = {
                limit: PAGE_SIZE,
                unread_only: unreadOnly,
                order: listOrder,
                ...(cursor && {
                    [listOrder === "oldest" ? "after" : "before"]: cursor.at,
                    cursor_id: cursor.id,
                }),
                ...filterParams,
            };
            if (useClusters) {
                return feed.id === "all"
                    ? api.getGlobalClusters(params)
                    : api.getFeedClusters(feed.id, params);
            }
            return feed.id === "all"
                ? api.getAllItems(params)
                : api.getFeedItems(feed.id, params);
        },
        [feed, unreadOnly, listOrder, filterParams, useClusters],
    );

    const loadItems = useCallback(async () => {
        if (!feed) return;
        const current = ++generation.current;
        setLoading(true);
        setHasMore(true);
        setItems([]);
        setClusters([]);
        try {
            const data = await fetchPage();
            if (current !== generation.current) return;
            if (useClusters) setClusters(uniqueById(data as Cluster[]));
            else setItems(uniqueById(data as Item[]));
            setHasMore(data.length === PAGE_SIZE);
        } catch (err: any) {
            if (current !== generation.current) return;
            onError("Failed to load content.");
            console.error(err);
        } finally {
            if (current === generation.current) setLoading(false);
        }
    }, [feed, fetchPage, onError, useClusters]);

    // Appends the page after the last row shown. The server pages by that
    // row's date and id, the same key it sorts by, so nothing is skipped.
    const loadMore = async (force = false) => {
        const last = useClusters
            ? clusters[clusters.length - 1]
            : items[items.length - 1];
        if (!feed || loadingMore || (!hasMore && !force) || !last) return;
        const current = generation.current;
        setLoadingMore(true);
        try {
            const at =
                "sort_date" in last ? last.sort_date : last.published_at;
            const data = await fetchPage({ at, id: last.id });
            if (current !== generation.current) return;
            if (useClusters) {
                setClusters((prev) => uniqueById([...prev, ...(data as Cluster[])]));
            } else {
                setItems((prev) => uniqueById([...prev, ...(data as Item[])]));
            }
            setHasMore(data.length === PAGE_SIZE);
        } catch (err: any) {
            if (current === generation.current) {
                onError(`Could not load more items: ${err.message}`);
            }
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

    // Newest-first: arrivals go on top and the reader keeps their place.
    // Oldest-first: arrivals are the end of the list, so only a reader who
    // has reached the end gets them; the others reach them by scrolling.
    const handleSync = async () => {
        if (!feed || isSyncing) return;
        if (listOrder === "oldest") {
            if (items.length === 0 && clusters.length === 0) {
                await loadItems();
            } else if (!hasMore) {
                setIsSyncing(true);
                await loadMore(true);
                setIsSyncing(false);
            }
            return;
        }
        const current = generation.current;
        setIsSyncing(true);
        try {
            const data = await fetchPage();
            if (current !== generation.current) return;
            const keepPlace = () => {
                if (scrollRef.current) {
                    lastScrollHeight.current = scrollRef.current.scrollHeight;
                }
            };
            if (useClusters) {
                setClusters((prev) => {
                    const seen = new Set(prev.map((c) => c.id));
                    const fresh = (data as Cluster[]).filter((c) => !seen.has(c.id));
                    if (fresh.length === 0) return prev;
                    keepPlace();
                    return [...fresh, ...prev];
                });
            } else {
                setItems((prev) => {
                    const seen = new Set(prev.map((i) => i.id));
                    const fresh = (data as Item[]).filter((i) => !seen.has(i.id));
                    if (fresh.length === 0) return prev;
                    keepPlace();
                    return [...fresh, ...prev];
                });
            }
        } catch (e) {
            if (current === generation.current) onError("Sync failed.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUpdateItemStatus = async (
        itemId: string,
        updates: { is_read?: boolean; liked?: number | null },
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
        updates: { is_read?: boolean; liked?: number | null },
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
            onError("Failed to update story status");
        }
    };

    const handleLikeToggleItem = async (item: Item, value: number) => {
        const newValue = item.liked === value ? null : value;
        await handleUpdateItemStatus(item.id, {
            liked: newValue,
            is_read: true,
        });
    };

    // A change of feed, filter or order reloads from the start of the list.
    useEffect(() => {
        loadItems();
    }, [loadItems]);

    // A refresh asks for arrivals; a reload (after Mark Read or a feed change)
    // shows the list again from its start, so read state is current.
    const lastRefreshKey = useRef(refreshKey);
    useEffect(() => {
        if (refreshKey === lastRefreshKey.current) return;
        lastRefreshKey.current = refreshKey;
        handleSync();
    }, [refreshKey]);

    const lastReloadKey = useRef(reloadKey);
    useEffect(() => {
        if (reloadKey === lastReloadKey.current) return;
        lastReloadKey.current = reloadKey;
        loadItems();
    }, [reloadKey]);

    // The order buttons change their label; this tells a screen reader the
    // list itself changed too. Nothing is announced on the first render.
    const [orderNotice, setOrderNotice] = useState("");
    const firstOrder = useRef(listOrder);
    useEffect(() => {
        if (listOrder === firstOrder.current && !orderNotice) return;
        setOrderNotice(`Showing ${listOrder} articles first`);
    }, [listOrder]);

    const isEmpty = useClusters ? clusters.length === 0 : items.length === 0;

    return (
        <div className="flex-1 h-full flex flex-col bg-brand-surface">
            <span className="sr-only" aria-live="polite">
                {orderNotice}
            </span>
            <ArticleListHeader
                feed={feed}
                isMobile={isMobile}
                showSidebarToggle={showSidebarToggle}
                onSidebarToggle={onSidebarToggle}
                isSyncing={isSyncing}
                onSync={handleSync}
                unreadOnly={unreadOnly}
                setUnreadOnly={setUnreadOnly}
                onMarkRead={() => feed && onMarkRead(feed)}
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
