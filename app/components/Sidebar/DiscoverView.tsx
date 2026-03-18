import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { api } from "~/lib/api";
import type { Feed } from "~/lib/types";
import { FeedItem } from "~/components/FeedItem";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";

interface DiscoverViewProps {
    selectedFeedId: string | null;
    checkIsSubscribed: (feedId: string) => boolean;
    onSelectFeed: (feed: Feed) => void;
    onFeedAction: (action: string, feed: Feed) => void;
}

const PAGE_SIZE = 20;

export function DiscoverView({
    selectedFeedId,
    checkIsSubscribed,
    onSelectFeed,
    onFeedAction,
}: DiscoverViewProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Feed[]>([]);
    const [popularFeeds, setPopularFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const observerTarget = useRef<HTMLDivElement>(null);

    const loadPopularFeeds = useCallback(async (currentOffset: number) => {
        if (currentOffset === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            const data = await api.getPopularFeeds({
                limit: PAGE_SIZE,
                offset: currentOffset,
            });
            if (currentOffset === 0) {
                setPopularFeeds(data);
            } else {
                setPopularFeeds((prev) => [...prev, ...data]);
            }
            setHasMore(data.length === PAGE_SIZE);
        } catch (error) {
            console.error("Failed to fetch popular feeds", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        if (query.length === 0) {
            setOffset(0);
            loadPopularFeeds(0);
        } else if (query.length > 2) {
            setLoading(true);
            const timer = setTimeout(() => {
                api.searchFeeds(query)
                    .then(setResults)
                    .catch(() => setResults([]))
                    .finally(() => setLoading(false));
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setResults([]);
        }
    }, [query, loadPopularFeeds]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasMore &&
                    !loading &&
                    !loadingMore &&
                    query.length === 0
                ) {
                    const nextOffset = offset + PAGE_SIZE;
                    setOffset(nextOffset);
                    loadPopularFeeds(nextOffset);
                }
            },
            { threshold: 0.1 },
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, offset, query.length, loadPopularFeeds]);

    const displayedFeeds = query.length > 0 ? results : popularFeeds;

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="px-6 pt-2 pb-4 shrink-0">
                <SearchInput
                    placeholder="Search for new feeds..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClear={() => setQuery("")}
                />
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {query.length > 0
                        ? loading
                            ? "Searching..."
                            : "Results"
                        : "Popular Feeds"}
                </p>

                {displayedFeeds.map((feed) => (
                    <FeedItem
                        key={feed.id}
                        feed={feed}
                        type="public"
                        isSelected={selectedFeedId === feed.id}
                        isSubscribed={checkIsSubscribed(feed.id)}
                        onClick={() => onSelectFeed(feed)}
                        onAction={onFeedAction}
                    />
                ))}

                {query.length === 0 && (
                    <div
                        ref={observerTarget}
                        className="h-10 flex justify-center items-center text-brand-600"
                    >
                        {loadingMore && (
                            <Loader2 className="animate-spin w-5 h-5" />
                        )}
                    </div>
                )}

                {!loading && displayedFeeds.length === 0 && query.length > 2 && (
                    <EmptyState>No feeds found matching "{query}".</EmptyState>
                )}

                {!loading &&
                    displayedFeeds.length === 0 &&
                    query.length > 0 &&
                    query.length <= 2 && (
                        <EmptyState>Type more to search...</EmptyState>
                    )}
            </div>
        </div>
    );
}
