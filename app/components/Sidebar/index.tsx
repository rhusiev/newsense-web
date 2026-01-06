import { useState, useEffect } from "react";
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
}

export function Sidebar({
    onSelectFeed,
    onRefreshRequest,
    selectedFeedId,
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

    const [subscribed, setSubscribed] = useState<Feed[]>([]);
    const [owned, setOwned] = useState<Feed[]>([]);

    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setMode("discover");
        } else if (mode === "reader") {
            loadData();
        }
    }, [user, mode]);

    const loadData = async () => {
        if (!user) return;
        try {
            const [subs, owns] = await Promise.all([
                api.getSubscribed(),
                api.getOwned(),
            ]);
            setSubscribed(subs);
            setOwned(owns);
        } catch (e) {
            console.error(e);
        }
    };

    const checkIsSubscribed = (feedId: string) => {
        return subscribed.some((sub) => sub.id === feedId);
    };

    const handleFeedAction = async (action: string, feed: Feed) => {
        switch (action) {
            case "unsubscribe":
                await api.unsubscribe(feed.id);
                loadData();
                break;
            case "subscribe":
                await api.subscribe(feed.id);
                loadData();
                break;
            case "mark_read":
                alert("Feature: Mark all read (Backend needed)");
                break;
            case "info":
                setInfoModalFeed(feed);
                break;
            case "edit":
                setManageModal({ open: true, mode: "edit", feed });
                break;
            case "delete":
                if (confirm("Delete this feed?")) {
                    await api.deleteFeed(feed.id);
                    loadData();
                }
                break;
            case "refresh":
                onRefreshRequest(feed.id);
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
                            className={`p-2 rounded-full transition-colors 
                ${mode === "reader" ? "bg-[#eef5ef] text-[#0e3415]" : "text-gray-400"} 
                ${!user ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-50"}
              `}
                            onClick={() => setMode("reader")}
                            title={
                                user ? "My Feeds" : "Login to see your feeds"
                            }
                        >
                            <LayoutList size={20} />
                        </button>
                        <button
                            className={`p-2 rounded-full transition-colors ${mode === "discover" ? "bg-[#eef5ef] text-[#0e3415]" : "text-gray-400 hover:text-[#0e3415]"}`}
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
                                    {user!.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {user!.username}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    className="p-1.5 text-gray-400 hover:text-[#0e3415] transition-colors"
                                >
                                    <Settings size={16} />
                                </button>
                                <button
                                    onClick={() => logout()}
                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
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
                                className="py-1.5 px-3 border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:border-[#587e5b]"
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
                                className="py-1.5 px-3 bg-[#0e3415] text-white text-xs font-medium rounded-md hover:bg-[#587e5b]"
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
