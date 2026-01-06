import { useEffect, useState } from "react";
import {
    Calendar,
    Check,
    Circle,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
} from "lucide-react";
import { api } from "~/lib/api";
import type { Feed, Item } from "~/lib/types";

export function ArticleList({
    feed,
    refreshKey,
}: {
    feed: Feed | null;
    refreshKey?: number;
}) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!feed) {
            setItems([]);
            return;
        }

        setLoading(true);

        let fetchPromise;
        if (feed.id === "all") {
            fetchPromise = api.getAllItems();
        } else if (feed.id === "unread") {
            fetchPromise = api.getAllItems();
        } else {
            fetchPromise = api.getFeedItems(feed.id);
        }

        fetchPromise
            .then((data) => {
                if (feed.id === "unread") {
                    setItems(data.filter((item: Item) => !item.is_read));
                } else {
                    setItems(data);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [feed, refreshKey]);

    const toggleRead = (e: React.MouseEvent, item: Item) => {
        e.preventDefault();
        e.stopPropagation();

        const newStatus = !item.is_read;

        setItems((prev) =>
            prev.map((i) =>
                i.id === item.id ? { ...i, is_read: newStatus } : i,
            ),
        );
        api.updateItemStatus(item.id, { is_read: newStatus });
    };

    const handleReaction = (
        e: React.MouseEvent,
        item: Item,
        type: "like" | "dislike",
    ) => {
        e.preventDefault();
        e.stopPropagation();

        const value = type === "like" ? 1.0 : -1.0;
        const newValue = item.liked === value ? 0.0 : value;

        const shouldMarkRead = newValue !== 0.0 ? true : item.is_read;

        setItems((prev) =>
            prev.map((i) =>
                i.id === item.id
                    ? { ...i, liked: newValue, is_read: shouldMarkRead }
                    : i,
            ),
        );

        api.updateItemStatus(item.id, {
            liked: newValue,
            is_read: shouldMarkRead,
        });
    };

    if (!feed) {
        return (
            <div className="flex-1 h-full flex items-center justify-center text-gray-300 bg-[#f8f9fa]">
                <div className="text-center">
                    <p className="text-lg font-serif italic text-gray-400">
                        Select a feed to start reading
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-[#fcfdfc] relative">
            <div className="px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-serif text-[#0e3415] mb-2">
                        {feed.title || "Untitled Feed"}
                    </h1>
                    <p className="text-sm text-gray-500 line-clamp-1 max-w-2xl">
                        {feed.description ||
                            (feed.id === "all" || feed.id === "unread"
                                ? "Aggregated view of your subscriptions"
                                : feed.url)}
                    </p>
                </div>
                {loading && (
                    <RefreshCw
                        className="animate-spin text-[#587e5b]"
                        size={20}
                    />
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {loading && items.length === 0 ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-40 bg-gray-100 rounded-xl"
                            ></div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        No articles found.
                    </div>
                ) : (
                    items.map((item) => (
                        <article
                            key={item.id}
                            className={`group relative bg-white border border-gray-100 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:border-[#9ac39d]/50 ${item.is_read ? "opacity-60 bg-gray-50/50" : ""}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                                    <span className="text-[#587e5b]">
                                        {feed.id === "all"
                                            ? "Subscription"
                                            : feed.title}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {item.published_at
                                            ? new Date(
                                                  item.published_at,
                                              ).toLocaleString([], {
                                                  year: "numeric",
                                                  month: "numeric",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "Unknown"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) =>
                                            handleReaction(e, item, "like")
                                        }
                                        className={`p-1.5 rounded-full transition-colors ${
                                            item.liked === 1.0
                                                ? "text-green-600 bg-green-50"
                                                : "text-gray-300 hover:text-green-600 hover:bg-gray-50"
                                        }`}
                                        title="Like"
                                    >
                                        <ThumbsUp
                                            size={16}
                                            fill={
                                                item.liked === 1.0
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>

                                    <button
                                        onClick={(e) =>
                                            handleReaction(e, item, "dislike")
                                        }
                                        className={`p-1.5 rounded-full transition-colors ${
                                            item.liked === -1.0
                                                ? "text-red-500 bg-red-50"
                                                : "text-gray-300 hover:text-red-500 hover:bg-gray-50"
                                        }`}
                                        title="Dislike"
                                    >
                                        <ThumbsDown
                                            size={16}
                                            fill={
                                                item.liked === -1.0
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>

                                    <button
                                        onClick={(e) => toggleRead(e, item)}
                                        className={`p-1.5 rounded-full transition-colors ml-1 ${
                                            item.is_read
                                                ? "text-[#587e5b] bg-[#eef5ef]"
                                                : "text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                                        }`}
                                        title={
                                            item.is_read
                                                ? "Mark as unread"
                                                : "Mark as read"
                                        }
                                    >
                                        {item.is_read ? (
                                            <Check size={16} />
                                        ) : (
                                            <Circle size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group-hover:text-[#0e3415]"
                                onClick={() => {
                                    if (!item.is_read) {
                                        api.updateItemStatus(item.id, {
                                            is_read: true,
                                        });
                                        setItems((prev) =>
                                            prev.map((i) =>
                                                i.id === item.id
                                                    ? { ...i, is_read: true }
                                                    : i,
                                            ),
                                        );
                                    }
                                }}
                            >
                                <h2 className="text-xl font-semibold text-gray-800 mb-3 leading-tight group-hover:underline decoration-[#9ac39d] decoration-2 underline-offset-4">
                                    {item.title}
                                </h2>
                            </a>

                            <div className="text-gray-600 leading-relaxed text-sm mb-4 line-clamp-3">
                                {item.content
                                    ? item.content
                                          .replace(/<[^>]*>?/gm, "")
                                          .substring(0, 300) + "..."
                                    : ""}
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                                <span className="text-xs text-gray-400 italic">
                                    {item.author ? `By ${item.author}` : ""}
                                </span>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}
