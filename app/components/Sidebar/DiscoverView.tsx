import { useState, useEffect } from "react";
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

export function DiscoverView({
    selectedFeedId,
    checkIsSubscribed,
    onSelectFeed,
    onFeedAction,
}: DiscoverViewProps) {
    const [query, setQuery] = useState("");
    const [publicFeeds, setPublicFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length > 2) {
            setLoading(true);
            const timer = setTimeout(() => {
                api.searchFeeds(query)
                    .then(setPublicFeeds)
                    .catch(() => setPublicFeeds([]))
                    .finally(() => setLoading(false));
            }, 500);
            return () => clearTimeout(timer);
        } else if (query.length === 0) {
            setPublicFeeds([]);
        }
    }, [query]);

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
                {query.length > 0 && (
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {loading ? "Searching..." : "Results"}
                    </p>
                )}

                {!loading &&
                    publicFeeds.map((feed) => (
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

                {!loading && publicFeeds.length === 0 && query.length > 2 && (
                    <EmptyState>
                        No feeds found matching "{query}".
                    </EmptyState>
                )}

                {!query && (
                    <EmptyState className="mt-10 px-6">
                        Type in the search bar above to find public feeds.
                    </EmptyState>
                )}
            </div>
        </div>
    );
}
