import { useState, useMemo } from "react";
import { Layers, Inbox } from "lucide-react";
import type { Feed } from "~/lib/types";
import { FeedSection } from "./FeedSection";

const ALL_ARTICLES_FEED: Feed = {
    id: "all",
    owner_id: null,
    url: "",
    title: "All Articles",
    description: "Aggregated items from all subscriptions",
    is_public: false,
    created_at: new Date().toISOString(),
    unread_count: 0,
};

const UNREAD_ARTICLES_FEED: Feed = {
    id: "unread",
    owner_id: null,
    url: "",
    title: "Unread Articles",
    description: "Only items you haven't read yet",
    is_public: false,
    created_at: new Date().toISOString(),
    unread_count: 0,
};

interface ReaderViewProps {
    subscribed: Feed[];
    owned: Feed[];
    selectedFeedId: string | null;
    checkIsSubscribed: (feedId: string) => boolean;
    onSelectFeed: (feed: Feed) => void;
    onFeedAction: (action: string, feed: Feed) => void;
    onCreateFeed: () => void;
}

export function ReaderView({
    subscribed,
    owned,
    selectedFeedId,
    checkIsSubscribed,
    onSelectFeed,
    onFeedAction,
    onCreateFeed,
}: ReaderViewProps) {
    const [subscribedFilter, setSubscribedFilter] = useState("");
    const [ownedFilter, setOwnedFilter] = useState("");

    const filteredSubscribed = useMemo(
        () =>
            subscribed.filter((f) =>
                (f.title || f.url)
                    .toLowerCase()
                    .includes(subscribedFilter.toLowerCase()),
            ),
        [subscribed, subscribedFilter],
    );

    const displaySubscribed = useMemo(() => {
        const list = [...filteredSubscribed];
        const search = subscribedFilter.toLowerCase();

        if ("unread articles".includes(search)) {
            list.unshift(UNREAD_ARTICLES_FEED);
        }
        if ("all articles".includes(search)) {
            list.unshift(ALL_ARTICLES_FEED);
        }
        return list;
    }, [filteredSubscribed, subscribedFilter]);

    const filteredOwned = useMemo(
        () =>
            owned.filter((f) =>
                (f.title || f.url)
                    .toLowerCase()
                    .includes(ownedFilter.toLowerCase()),
            ),
        [owned, ownedFilter],
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <FeedSection
                title="Subscriptions"
                feeds={displaySubscribed}
                feedType="subscribed"
                selectedFeedId={selectedFeedId}
                onSelectFeed={onSelectFeed}
                onFeedAction={onFeedAction}
                onSearch={setSubscribedFilter}
                collapsible={true}
                defaultExpanded={true}
            />

            <FeedSection
                title="Owned Feeds"
                feeds={filteredOwned}
                feedType="owned"
                selectedFeedId={selectedFeedId}
                checkIsSubscribed={checkIsSubscribed}
                onSelectFeed={onSelectFeed}
                onFeedAction={onFeedAction}
                onSearch={setOwnedFilter}
                collapsible={true}
                defaultExpanded={false}
                onCreateFeed={onCreateFeed}
            />
        </div>
    );
}
