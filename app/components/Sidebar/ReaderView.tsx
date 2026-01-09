import { useMemo, useState } from "react";
import type { Feed } from "~/lib/types";
import { FeedSection } from "./FeedSection";

interface ReaderViewProps {
    subscribed: Feed[];
    owned: Feed[];
    totalUnread: number;
    selectedFeedId: string | null;
    checkIsSubscribed: (feedId: string) => boolean;
    onSelectFeed: (feed: Feed) => void;
    onFeedAction: (action: string, feed: Feed) => void;
    onCreateFeed: () => void;
}

export function ReaderView({
    subscribed,
    owned,
    totalUnread,
    selectedFeedId,
    checkIsSubscribed,
    onSelectFeed,
    onFeedAction,
    onCreateFeed,
}: ReaderViewProps) {
    const [subSearch, setSubSearch] = useState("");
    const [ownedSearch, setOwnedSearch] = useState("");

    const virtualFeeds: Feed[] = useMemo(
        () => [
            {
                id: "all",
                owner_id: null,
                url: "",
                title: "All Articles",
                description: "Aggregated items from all subscriptions",
                is_public: false,
                created_at: new Date().toISOString(),
                unread_count: totalUnread,
            },
        ],
        [totalUnread],
    );

    const displaySubscribed = useMemo(() => {
        let list = [...subscribed];

        if (!subSearch || "all articles".includes(subSearch.toLowerCase())) {
            list = [virtualFeeds[0], ...list];
        }

        if (subSearch) {
            const lowerQ = subSearch.toLowerCase();
            list = list.filter((f) =>
                (f.title || f.url || "").toLowerCase().includes(lowerQ),
            );
        }
        return list;
    }, [subscribed, subSearch, virtualFeeds]);

    const displayOwned = useMemo(() => {
        let list = [...owned];
        if (ownedSearch) {
            const lowerQ = ownedSearch.toLowerCase();
            list = list.filter((f) =>
                (f.title || f.url || "").toLowerCase().includes(lowerQ),
            );
        }
        return list;
    }, [owned, ownedSearch]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <FeedSection
                title="Subscriptions"
                feeds={displaySubscribed}
                feedType="subscribed"
                selectedFeedId={selectedFeedId}
                onSelectFeed={onSelectFeed}
                onFeedAction={onFeedAction}
                collapsible={true}
                defaultExpanded={true}
                onSearchChange={setSubSearch}
                searchValue={subSearch}
            />

            <FeedSection
                title="Owned Feeds"
                feeds={displayOwned}
                feedType="owned"
                selectedFeedId={selectedFeedId}
                checkIsSubscribed={checkIsSubscribed}
                onSelectFeed={onSelectFeed}
                onFeedAction={onFeedAction}
                collapsible={true}
                defaultExpanded={false}
                onSearchChange={setOwnedSearch}
                searchValue={ownedSearch}
                onAdd={onCreateFeed}
            />
        </div>
    );
}
