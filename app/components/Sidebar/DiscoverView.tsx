import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { api } from "~/lib/api";
import type { Feed } from "~/lib/types";
import { FeedItem } from "~/components/FeedItem";

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
    const [discoverQuery, setDiscoverQuery] = useState("");
    const [publicFeeds, setPublicFeeds] = useState<Feed[]>([]);

    useEffect(() => {
        if (discoverQuery.length > 2) {
            const timer = setTimeout(
                () => api.searchFeeds(discoverQuery).then(setPublicFeeds),
                500,
            );
            return () => clearTimeout(timer);
        } else if (discoverQuery.length === 0) {
            setPublicFeeds([]);
        }
    }, [discoverQuery]);

    return (
        <div className="px-4 animate-in fade-in duration-300">
            <div className="relative mb-6">
                <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                />
                <input
                    type="text"
                    placeholder="Find public feeds..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#587e5b] text-sm"
                    value={discoverQuery}
                    onChange={(e) => setDiscoverQuery(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="space-y-1 mt-4">
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Results
                </p>
                {publicFeeds.map((feed) => (
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
                {publicFeeds.length === 0 && discoverQuery && (
                    <p className="text-center text-gray-400 text-sm mt-10">
                        No feeds found.
                    </p>
                )}
            </div>
        </div>
    );
}
