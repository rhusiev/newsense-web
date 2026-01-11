import { useState } from "react";
import { LayoutList, Compass } from "lucide-react";
import type { Feed, User } from "~/lib/types";
import { ReaderView } from "./ReaderView";
import { DiscoverView } from "./DiscoverView";

interface SidebarProps {
    user: User | null;
    subscribed: Feed[];
    owned: Feed[];
    totalUnread: number;
    selectedFeedId: string | null;
    onSelectFeed: (feed: Feed) => void;
    onFeedAction: (action: string, feed: Feed) => void;
    triggerConfirm: (config: any) => void;
    onLoginRequest: () => void;
    onRegisterRequest: () => void;
    onLogoutRequest: () => void;
    onSettingsRequest: () => void;
    onCreateFeed: () => void;
}

export function Sidebar({
    user,
    subscribed,
    owned,
    totalUnread,
    selectedFeedId,
    onSelectFeed,
    onFeedAction,
    onCreateFeed,
}: SidebarProps) {
    const [mode, setMode] = useState<"reader" | "discover">("reader");

    const checkIsSubscribed = (feedId: string) => {
        return subscribed.some((sub) => sub.id === feedId);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex items-center justify-between px-6 py-4 shrink-0 h-16">
                <div className="flex gap-2 w-full">
                    <button
                        disabled={!user}
                        className={`flex-1 p-3 rounded-lg transition-colors relative flex items-center justify-center gap-2 font-medium text-sm
                            ${mode === "reader" ? "bg-brand-surface-active text-brand-900" : "text-gray-400"} 
                            ${!user ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"}
                        `}
                        onClick={() => setMode("reader")}
                        title={user ? "My Feeds" : "Login to see your feeds"}
                    >
                        <LayoutList size={18} />
                        <span>Feeds</span>
                        {user && totalUnread > 0 && mode !== "reader" && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-accent rounded-full border border-white"></span>
                        )}
                    </button>
                    <button
                        className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm ${mode === "discover" ? "bg-brand-surface-active text-brand-900" : "text-gray-400 hover:text-brand-900 hover:bg-gray-100"}`}
                        onClick={() => setMode("discover")}
                        title="Discover"
                    >
                        <Compass size={18} />
                        <span>Discover</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                <div className="pb-20">
                    {mode === "discover" ? (
                        <DiscoverView
                            selectedFeedId={selectedFeedId}
                            checkIsSubscribed={checkIsSubscribed}
                            onSelectFeed={onSelectFeed}
                            onFeedAction={onFeedAction}
                        />
                    ) : (
                        <ReaderView
                            subscribed={subscribed}
                            owned={owned}
                            totalUnread={totalUnread}
                            selectedFeedId={selectedFeedId}
                            checkIsSubscribed={checkIsSubscribed}
                            onSelectFeed={onSelectFeed}
                            onFeedAction={onFeedAction}
                            onCreateFeed={onCreateFeed}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
