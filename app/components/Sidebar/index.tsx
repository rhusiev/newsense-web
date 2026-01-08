import { useState, useEffect, useCallback } from "react";
import { LayoutList, Compass, LogOut, Settings } from "lucide-react";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth-context";
import type { Feed } from "~/lib/types";
import { AuthModal } from "~/components/AuthModal";
import { FeedManageModal, FeedInfoModal } from "~/components/FeedModals";
import { ReaderView } from "./ReaderView";
import { DiscoverView } from "./DiscoverView";
import { SettingsModal } from "~/components/SettingsModal";

interface SidebarProps {
    onSelectFeed: (feed: Feed) => void;
    onRefreshRequest: (feedId: string) => void;
    selectedFeedId: string | null;
    refreshTrigger?: number;
    onFeedsLoaded: (feeds: Feed[]) => void;
    triggerConfirm: (config: any) => void;
    onError: (msg: string) => void;
}

export function Sidebar({
    onSelectFeed,
    onRefreshRequest,
    selectedFeedId,
    refreshTrigger,
    onFeedsLoaded,
    triggerConfirm,
    onError,
}: SidebarProps) {
    const { user, logout } = useAuth();
    const [mode, setMode] = useState<"reader" | "discover">("reader");

    const [authModal, setAuthModal] = useState<{
        open: boolean;
        view: "login" | "register";
    }>({ open: false, view: "login" });
    const [manageModal, setManageModal] = useState<{
        open: boolean;
        mode: "create" | "edit";
        feed?: Feed | null;
    }>({ open: false, mode: "create" });
    const [infoModalFeed, setInfoModalFeed] = useState<Feed | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [subscribed, setSubscribed] = useState<Feed[]>([]);
    const [owned, setOwned] = useState<Feed[]>([]);
    const [totalUnread, setTotalUnread] = useState(0);

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            const [subs, owns, counts] = await Promise.all([
                api.getSubscribed(),
                api.getOwned(),
                api.getUnreadCounts(),
            ]);

            const subsWithCounts = subs.map((feed: Feed) => ({
                ...feed,
                unread_count:
                    counts.feeds.find((c: any) => c.feed_id === feed.id)
                        ?.unread_count || 0,
            }));

            const ownedWithCounts = owns.map((feed: Feed) => ({
                ...feed,
                unread_count:
                    counts.feeds.find((c: any) => c.feed_id === feed.id)
                        ?.unread_count || 0,
            }));

            setSubscribed(subsWithCounts);
            setOwned(ownedWithCounts);
            setTotalUnread(counts.total_unread);

            onFeedsLoaded([...subsWithCounts, ...ownedWithCounts]);
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setMode("discover");
        } else if (mode === "reader") {
            loadData();
        }
    }, [user, mode, loadData, refreshTrigger]);

    const checkIsSubscribed = (feedId: string) => {
        return subscribed.some((sub) => sub.id === feedId);
    };

    const handleFeedAction = async (action: string, feed: Feed) => {
        switch (action) {
            case "unsubscribe":
                triggerConfirm({
                    title: "Unsubscribe",
                    message: `Stop receiving updates from "${feed.title}"?`,
                    type: "danger",
                    onConfirm: async () => {
                        try {
                            await api.unsubscribe(feed.id);
                            loadData();
                        } catch (e: any) {
                            onError(e.message);
                        }
                    },
                });
                break;
            case "mark_read":
                triggerConfirm({
                    title: "Mark as Read",
                    message: `Mark all articles in "${feed.title}" as read?`,
                    onConfirm: async () => {
                        try {
                            await api.markFeedRead(
                                feed.id,
                                "1970-01-01T00:00:00Z",
                            );
                            loadData();
                            onRefreshRequest(feed.id);
                        } catch (e: any) {
                            onError(e.message);
                        }
                    },
                });
                break;
            case "delete":
                triggerConfirm({
                    title: "Delete Feed",
                    message: `Permanently delete "${feed.title}"? This cannot be undone.`,
                    type: "danger",
                    onConfirm: async () => {
                        try {
                            await api.deleteFeed(feed.id);
                            loadData();
                        } catch (e: any) {
                            onError(e.message);
                        }
                    },
                });
                break;
            case "subscribe":
                await api.subscribe(feed.id);
                loadData();
                break;
            case "info":
                setInfoModalFeed(feed);
                break;
            case "edit":
                setManageModal({ open: true, mode: "edit", feed });
                break;
            case "refresh":
                onRefreshRequest(feed.id);
                loadData();
                break;
        }
    };

    return (
        <>
            <div className="h-full flex flex-col bg-white">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#9ac39d]/30 shrink-0">
                    <div className="flex gap-4">
                        <button
                            disabled={!user}
                            className={`p-2 rounded-lg transition-colors relative
                                ${mode === "reader" ? "bg-[#eef5ef] text-[#0e3415]" : "text-gray-400"} 
                                ${!user ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"}
                            `}
                            onClick={() => setMode("reader")}
                            title={
                                user ? "My Feeds" : "Login to see your feeds"
                            }
                        >
                            <LayoutList size={20} />
                            {user && totalUnread > 0 && mode !== "reader" && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#587e5b] rounded-full border-2 border-white"></span>
                            )}
                        </button>
                        <button
                            className={`p-2 rounded-lg transition-colors ${mode === "discover" ? "bg-[#eef5ef] text-[#0e3415]" : "text-gray-400 hover:text-[#0e3415] hover:bg-gray-100"}`}
                            onClick={() => setMode("discover")}
                            title="Discover"
                        >
                            <Compass size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <div className="pb-20">
                        {mode === "discover" ? (
                            <DiscoverView
                                selectedFeedId={selectedFeedId}
                                checkIsSubscribed={checkIsSubscribed}
                                onSelectFeed={onSelectFeed}
                                onFeedAction={handleFeedAction}
                            />
                        ) : (
                            <ReaderView
                                subscribed={subscribed}
                                owned={owned}
                                totalUnread={totalUnread}
                                selectedFeedId={selectedFeedId}
                                checkIsSubscribed={checkIsSubscribed}
                                onSelectFeed={onSelectFeed}
                                onFeedAction={handleFeedAction}
                                onCreateFeed={() =>
                                    setManageModal({
                                        open: true,
                                        mode: "create",
                                    })
                                }
                            />
                        )}
                    </div>
                </div>

                <div className="mt-auto border-t border-[#9ac39d]/30 bg-[#fbfcfb] p-4 shrink-0">
                    {user ? (
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#0e3415] text-white flex items-center justify-center text-sm font-medium">
                                    {user.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {user.username}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-[#0e3415] hover:bg-gray-100 transition-colors"
                                >
                                    <Settings size={16} />
                                </button>
                                <button
                                    onClick={() => logout()}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() =>
                                    setAuthModal({ open: true, view: "login" })
                                }
                                className="py-1.5 px-3 border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:border-[#587e5b] transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() =>
                                    setAuthModal({
                                        open: true,
                                        view: "register",
                                    })
                                }
                                className="py-1.5 px-3 bg-[#0e3415] text-white text-xs font-medium rounded-md hover:bg-[#587e5b] transition-colors"
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={authModal.open}
                onClose={() => setAuthModal({ ...authModal, open: false })}
                initialView={authModal.view}
            />
            {user && (
                <FeedManageModal
                    isOpen={manageModal.open}
                    mode={manageModal.mode}
                    feed={manageModal.feed}
                    onClose={() =>
                        setManageModal({ ...manageModal, open: false })
                    }
                    onSuccess={loadData}
                />
            )}
            {user && (
                <FeedInfoModal
                    feed={infoModalFeed}
                    onClose={() => setInfoModalFeed(null)}
                />
            )}
            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    );
}
