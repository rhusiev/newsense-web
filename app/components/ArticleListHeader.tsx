import { CheckCheck, RotateCw, Eye, EyeOff, PanelLeft } from "lucide-react";
import { Button } from "./ui/Button";
import { api } from "~/lib/api";

interface ArticleListHeaderProps {
    feed: any;
    isMobile: boolean;
    showSidebarToggle: boolean;
    onSidebarToggle?: () => void;
    isSyncing: boolean;
    onSync: () => void;
    unreadOnly: boolean;
    setUnreadOnly: (val: boolean) => void;
    triggerConfirm: (config: any) => void;
    onError: (msg: string) => void;
    loadItems: () => void;
    onItemRead: () => void;
    USE_CLUSTERS: boolean;
}

export function ArticleListHeader({
    feed,
    isMobile,
    showSidebarToggle,
    onSidebarToggle,
    isSyncing,
    onSync,
    unreadOnly,
    setUnreadOnly,
    triggerConfirm,
    onError,
    loadItems,
    onItemRead,
    USE_CLUSTERS,
}: ArticleListHeaderProps) {
    const handleMarkAllRead = () => {
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
                            await api.markFeedClustersRead(feed.id, since);
                        }
                    } else {
                        feed.id === "all"
                            ? await api.markAllRead(since)
                            : await api.markFeedRead(feed.id, since);
                    }
                    loadItems();
                    onItemRead();
                } catch (e) {
                    onError("Action failed.");
                }
            },
        });
    };

    return (
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
                        {feed?.id === "all" ? "All subscriptions" : feed?.url}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSync}
                    isLoading={isSyncing}
                    title="Refresh Articles"
                >
                    {!isSyncing && <RotateCw size={18} />}
                </Button>

                <Button
                    variant={unreadOnly ? "secondary" : "ghost"}
                    onClick={() => setUnreadOnly(!unreadOnly)}
                    title={
                        unreadOnly ? "Show all articles" : "Show unread only"
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
                    onClick={handleMarkAllRead}
                    title="Mark all items in this list as read"
                >
                    <CheckCheck size={18} className="sm:mr-2" />
                    <span className="hidden sm:inline">Mark All Read</span>
                </Button>
            </div>
        </header>
    );
}
