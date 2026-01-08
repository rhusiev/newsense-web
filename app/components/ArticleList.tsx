import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { Calendar, Check, Circle, RefreshCw, Filter, CheckCheck, Loader2, RotateCw } from "lucide-react";
import { api } from "~/lib/api";
import type { Feed, Item } from "~/lib/types";

export function ArticleList({ feed, refreshKey, feedMap, onItemRead, triggerConfirm, onError }: any) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastScrollHeight = useRef<number>(0);

    // Maintain scroll position when new items are prepended
    useLayoutEffect(() => {
        if (scrollRef.current && lastScrollHeight.current > 0) {
            const diff = scrollRef.current.scrollHeight - lastScrollHeight.current;
            scrollRef.current.scrollTop += diff;
            lastScrollHeight.current = 0;
        }
    }, [items]);

    const loadItems = useCallback(async () => {
        if (!feed) return;
        setLoading(true);
        try {
            const params = { limit: 20, unread_only: unreadOnly };
            const data = feed.id === "all" ? await api.getAllItems(params) : await api.getFeedItems(feed.id, params);
            setItems(data);
            setHasMore(data.length === 20);
        } catch (err: any) {
            onError("Failed to load articles.");
        } finally {
            setLoading(false);
        }
    }, [feed, unreadOnly, onError]);

    const handleSync = async () => {
        if (!feed || isSyncing) return;
        setIsSyncing(true);
        try {
            const params = { limit: 20, unread_only: unreadOnly };
            const newData: Item[] = feed.id === "all" ? await api.getAllItems(params) : await api.getFeedItems(feed.id, params);
            
            setItems(prev => {
                const existingIds = new Set(prev.map(i => i.id));
                const unique = newData.filter(i => !existingIds.has(i.id));
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

    useEffect(() => { loadItems(); }, [loadItems, refreshKey]);

    return (
        <div className="flex-1 h-full flex flex-col bg-[#fcfdfc]">
            <div className="px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-serif text-[#0e3415] mb-1 truncate">{feed?.title || "Feed"}</h1>
                    <p className="text-sm text-gray-400">{feed?.id === "all" ? "All subscriptions" : feed?.url}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSync} className="p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                        <RotateCw size={18} className={isSyncing ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => setUnreadOnly(!unreadOnly)} className={`p-2 border rounded-lg text-sm font-medium ${unreadOnly ? "bg-[#eef5ef] text-[#0e3415]" : "bg-white"}`}>
                        <Filter size={16} />
                    </button>
                    <button 
                        onClick={() => triggerConfirm({
                            title: "Mark All Read",
                            message: "Mark all items in this view as read?",
                            onConfirm: async () => {
                                try {
                                    const since = "1970-01-01T00:00:00Z";
                                    feed.id === "all" ? await api.markAllRead(since) : await api.markFeedRead(feed.id, since);
                                    loadItems();
                                    onItemRead();
                                } catch (e) { onError("Action failed."); }
                            }
                        })}
                        className="p-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                    >
                        <CheckCheck size={16} />
                        <span className="hidden sm:inline">Mark All Read</span>
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                {items.map((item) => (
                    <article key={item.id} className={`bg-white border border-gray-100 rounded-xl p-6 shadow-sm ${item.is_read ? "opacity-50" : ""}`}>
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#587e5b]">
                                {feedMap.get(item.feed_id) || "Subscription"}
                            </span>
                            <button 
                                onClick={async () => {
                                    try { 
                                        await api.updateItemStatus(item.id, { is_read: !item.is_read }); 
                                        setItems(prev => prev.map(i => i.id === item.id ? {...i, is_read: !i.is_read} : i));
                                        onItemRead();
                                    } catch (e) { onError("Failed to update status"); }
                                }}
                                className="text-gray-300 hover:text-[#587e5b]"
                            >
                                {item.is_read ? <Check size={18} /> : <Circle size={18} />}
                            </button>
                        </div>
                        <a href={item.link} target="_blank" rel="noreferrer" className="block text-xl font-semibold mb-2 hover:underline decoration-[#9ac39d]">
                            {item.title}
                        </a>
                        <div className="text-gray-600 text-sm line-clamp-2">
                            {item.content?.replace(/<[^>]*>?/gm, "").substring(0, 200)}...
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
