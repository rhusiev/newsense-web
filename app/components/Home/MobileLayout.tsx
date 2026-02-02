import type { Feed, User } from "~/lib/types";
import { MobileTopBar, MobileBottomNav } from "~/components/MobileUI";
import { ArticleList } from "~/components/ArticleList";
import { FeedSection } from "~/components/Sidebar/FeedSection";
import { DiscoverView } from "~/components/Sidebar/DiscoverView";
import { SharedModals } from "./SharedModals";

interface MobileLayoutProps {
    user: User | null;
    mobileTab: "subscriptions" | "owned" | "discover";
    setMobileTab: (tab: "subscriptions" | "owned" | "discover") => void;
    selectedFeed: Feed | null;
    setSelectedFeed: (feed: Feed | null) => void;
    mobileSearchQuery: string;
    setMobileSearchQuery: (val: string) => void;
    unreadOnly: boolean;
    setUnreadOnly: (val: boolean) => void;
    refreshKey: number;
    setRefreshKey: (cb: (p: number) => number) => void;
    logout: () => void;
    setAuthModal: (val: any) => void;
    setSettingsOpen: (val: boolean) => void;
    setManageModal: (val: any) => void;
    handleFeedAction: (action: string, feed: Feed) => void;
    feedMap: Map<string, string>;
    triggerConfirm: (config: any) => void;
    setError: (msg: string | null) => void;
    onItemRead: () => void;
    subscribed: Feed[];
    getFilteredSubscribed: () => Feed[];
    getFilteredOwned: () => Feed[];
    modalProps: any;
}

export function MobileLayout({
    user,
    mobileTab,
    setMobileTab,
    selectedFeed,
    setSelectedFeed,
    mobileSearchQuery,
    setMobileSearchQuery,
    unreadOnly,
    setUnreadOnly,
    refreshKey,
    setRefreshKey,
    logout,
    setAuthModal,
    setSettingsOpen,
    setManageModal,
    handleFeedAction,
    feedMap,
    triggerConfirm,
    setError,
    onItemRead,
    subscribed,
    getFilteredSubscribed,
    getFilteredOwned,
    modalProps,
}: MobileLayoutProps) {
    return (
        <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-brand-900">
            <MobileTopBar
                user={user}
                activeTab={mobileTab}
                selectedFeed={selectedFeed}
                searchQuery={mobileSearchQuery}
                onSearchChange={setMobileSearchQuery}
                onClearSearch={() => setMobileSearchQuery("")}
                onBack={() => setSelectedFeed(null)}
                onCreateFeed={() =>
                    setManageModal({ open: true, mode: "create" })
                }
                unreadOnly={unreadOnly}
                isSyncing={false}
                onToggleUnread={() => setUnreadOnly(!unreadOnly)}
                onMarkAllRead={() => {
                    if (selectedFeed)
                        handleFeedAction("mark_read", selectedFeed);
                }}
                onRefresh={() => setRefreshKey((p) => p + 1)}
                onProfileClick={() => {}}
                onSettingsClick={() => setSettingsOpen(true)}
                onLogoutClick={logout}
                onLoginClick={() => setAuthModal({ open: true, view: "login" })}
            />

            <main className="flex-1 overflow-hidden relative flex flex-col">
                {selectedFeed ? (
                    <ArticleList
                        feed={selectedFeed}
                        refreshKey={refreshKey}
                        onItemRead={onItemRead}
                        feedMap={feedMap}
                        triggerConfirm={triggerConfirm}
                        onError={setError}
                        externalUnreadOnly={unreadOnly}
                        setExternalUnreadOnly={setUnreadOnly}
                        isMobile={true}
                    />
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {mobileTab === "subscriptions" && (
                            <FeedSection
                                feeds={getFilteredSubscribed()}
                                feedType="subscribed"
                                selectedFeedId={null}
                                onSelectFeed={setSelectedFeed}
                                onFeedAction={handleFeedAction}
                            />
                        )}
                        {mobileTab === "owned" && (
                            <FeedSection
                                feeds={getFilteredOwned()}
                                feedType="owned"
                                selectedFeedId={null}
                                onSelectFeed={setSelectedFeed}
                                onFeedAction={handleFeedAction}
                            />
                        )}
                        {mobileTab === "discover" && (
                            <DiscoverView
                                selectedFeedId={null}
                                checkIsSubscribed={(id) =>
                                    subscribed.some((s) => s.id === id)
                                }
                                onSelectFeed={setSelectedFeed}
                                onFeedAction={handleFeedAction}
                            />
                        )}

                        {!user && mobileTab !== "discover" && (
                            <div className="text-center mt-20 px-6">
                                <p className="text-gray-500 mb-4">
                                    Please log in to view your feeds.
                                </p>
                                <button
                                    onClick={() =>
                                        setAuthModal({
                                            open: true,
                                            view: "login",
                                        })
                                    }
                                    className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold"
                                >
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <MobileBottomNav
                activeTab={mobileTab}
                onTabChange={(tab) => {
                    setMobileTab(tab);
                    setSelectedFeed(null);
                }}
            />

            <SharedModals {...modalProps} />
        </div>
    );
}
