import { CheckCheck, RotateCw, Eye, EyeOff, PanelLeft } from "lucide-react";
import { Button } from "./ui/Button";

interface ArticleListHeaderProps {
    feed: any;
    isMobile: boolean;
    showSidebarToggle: boolean;
    onSidebarToggle?: () => void;
    isSyncing: boolean;
    onSync: () => void;
    unreadOnly: boolean;
    setUnreadOnly: (val: boolean) => void;
    onMarkRead: () => void;
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
    onMarkRead,
}: ArticleListHeaderProps) {
    const handleMarkAllRead = () => onMarkRead();

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
                    title="Mark articles as read, up to a date"
                >
                    <CheckCheck size={18} className="sm:mr-2" />
                    <span className="hidden sm:inline">Mark Read</span>
                </Button>
            </div>
        </header>
    );
}
