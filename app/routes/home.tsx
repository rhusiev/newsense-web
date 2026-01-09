import { useState, useCallback, useMemo, useEffect } from "react";
import { data } from "react-router";
import { Sidebar } from "~/components/Sidebar/index";
import { ArticleList } from "~/components/ArticleList";
import { AuthProvider, useAuth } from "~/lib/auth-context";
import { AUTH_API_URL, api } from "~/lib/api";
import type { Feed } from "~/lib/types";
import type { Route } from "./+types/home";
import { CustomConfirmModal, ErrorToast } from "~/components/UIOverlay";
import { MobileTopBar, MobileBottomNav } from "~/components/MobileUI";
import { FeedSection } from "~/components/Sidebar/FeedSection";
import { DiscoverView } from "~/components/Sidebar/DiscoverView";
import { AuthModal } from "~/components/AuthModal";
import { FeedManageModal, FeedInfoModal } from "~/components/FeedModals";
import { SettingsModal } from "~/components/SettingsModal";
import { Settings, LogOut } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
    const cookie = request.headers.get("Cookie");
    try {
        const response = await fetch(`${AUTH_API_URL}/me`, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) return { user: null };
        const user = await response.json();
        const newCookie = response.headers.get("Set-Cookie");
        const headers = new Headers();
        if (newCookie) headers.append("Set-Cookie", newCookie);
        return data({ user }, { headers });
    } catch (error) {
        return { user: null };
    }
}

export default function Home({ loaderData }: Route.ComponentProps) {
    const user = loaderData?.user ?? null;

    return (
        <AuthProvider initialUser={user}>
            <HomeContent />
        </AuthProvider>
    );
}

function HomeContent() {
    const { user, logout } = useAuth();

    const [layoutMode, setLayoutMode] = useState<
        "loading" | "mobile" | "desktop"
    >("loading");
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
    const [isDesktopNarrow, setIsDesktopNarrow] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const isTouch = window.matchMedia("(pointer: coarse)").matches;

            // heuristic for mobile:
            // a touch device and width < 1000px or width < 640px
            const isMobileUI = (isTouch && width < 1000) || width < 640;

            const isNarrow = !isMobileUI && width < 900;

            setLayoutMode(isMobileUI ? "mobile" : "desktop");
            setIsDesktopNarrow(isNarrow);

            if (!isNarrow) {
                setDesktopSidebarOpen(true);
            } else if (layoutMode !== "desktop") {
                setDesktopSidebarOpen(false);
            }
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [layoutMode]);

    const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
    const [allFeeds, setAllFeeds] = useState<Feed[]>([]);
    const [subscribed, setSubscribed] = useState<Feed[]>([]);
    const [owned, setOwned] = useState<Feed[]>([]);
    const [totalUnread, setTotalUnread] = useState(0);

    const [refreshKey, setRefreshKey] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [mobileTab, setMobileTab] = useState<
        "subscriptions" | "owned" | "discover"
    >("subscriptions");
    const [mobileSearchQuery, setMobileSearchQuery] = useState("");

    const [unreadOnly, setUnreadOnly] = useState(false);

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
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: "danger" | "info";
        onConfirm: () => void;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

    const triggerConfirm = useCallback(
        (config: Omit<typeof confirmConfig, "isOpen">) => {
            setConfirmConfig({ ...config, isOpen: true });
        },
        [],
    );

    const loadData = useCallback(async () => {
        if (!user) {
            setSubscribed([]);
            setOwned([]);
            return;
        }
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
            setAllFeeds([...subsWithCounts, ...ownedWithCounts]);
        } catch (e) {
            console.error(e);
        }
    }, [user, refreshKey]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setMobileSearchQuery("");
    }, [mobileTab, selectedFeed]);

    useEffect(() => {
        if (isDesktopNarrow && selectedFeed) {
            setDesktopSidebarOpen(false);
        }
    }, [selectedFeed, isDesktopNarrow]);

    const feedMap = useMemo(() => {
        const map = new Map<string, string>();
        allFeeds.forEach((f) => map.set(f.id, f.title || "Untitled Feed"));
        return map;
    }, [allFeeds]);

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
                            setError(e.message);
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
                            setRefreshKey((p) => p + 1);
                        } catch (e: any) {
                            setError(e.message);
                        }
                    },
                });
                break;
            case "delete":
                triggerConfirm({
                    title: "Delete Feed",
                    message: `Permanently delete "${feed.title}"?`,
                    type: "danger",
                    onConfirm: async () => {
                        try {
                            await api.deleteFeed(feed.id);
                            loadData();
                        } catch (e: any) {
                            setError(e.message);
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
                setRefreshKey((p) => p + 1);
                loadData();
                break;
        }
    };

    const getFilteredSubscribed = () => {
        const all = {
            id: "all",
            owner_id: null,
            url: "",
            title: "All Articles",
            description: "Aggregated items",
            is_public: false,
            created_at: new Date().toISOString(),
            unread_count: totalUnread,
        };
        let list = [all, ...subscribed];
        if (mobileSearchQuery) {
            list = list.filter((f) =>
                (f.title || f.url)
                    .toLowerCase()
                    .includes(mobileSearchQuery.toLowerCase()),
            );
        }
        return list;
    };

    const getFilteredOwned = () => {
        let list = [...owned];
        if (mobileSearchQuery) {
            list = list.filter((f) =>
                (f.title || f.url)
                    .toLowerCase()
                    .includes(mobileSearchQuery.toLowerCase()),
            );
        }
        return list;
    };

    if (layoutMode === "loading") return null;

    if (layoutMode === "mobile") {
        return (
            <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-[#0e3415]">
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
                    onLoginClick={() =>
                        setAuthModal({ open: true, view: "login" })
                    }
                />

                <main className="flex-1 overflow-hidden relative flex flex-col">
                    {selectedFeed ? (
                        <ArticleList
                            feed={selectedFeed}
                            refreshKey={refreshKey}
                            onItemRead={loadData}
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

                <SharedModals
                    authModal={authModal}
                    setAuthModal={setAuthModal}
                    manageModal={manageModal}
                    setManageModal={setManageModal}
                    infoModalFeed={infoModalFeed}
                    setInfoModalFeed={setInfoModalFeed}
                    settingsOpen={settingsOpen}
                    setSettingsOpen={setSettingsOpen}
                    confirmConfig={confirmConfig}
                    setConfirmConfig={setConfirmConfig}
                    error={error}
                    setError={setError}
                    onSuccess={() => {
                        loadData();
                        setRefreshKey((p) => p + 1);
                    }}
                    user={user}
                />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden text-[#0e3415] relative">
            <>
                {isDesktopNarrow && desktopSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-in fade-in duration-200"
                        onClick={() => setDesktopSidebarOpen(false)}
                    />
                )}
                <aside
                    className={`
                        flex flex-col h-full bg-white border-r border-[#9ac39d]/20 transition-all duration-300
                        ${
                            isDesktopNarrow
                                ? `fixed top-0 left-0 bottom-0 z-40 w-80 shadow-2xl transform ${desktopSidebarOpen ? "translate-x-0" : "-translate-x-full"}`
                                : "w-80 relative flex-shrink-0"
                        }
                    `}
                >
                    <Sidebar
                        user={user}
                        subscribed={subscribed}
                        owned={owned}
                        totalUnread={totalUnread}
                        selectedFeedId={selectedFeed?.id || null}
                        onSelectFeed={setSelectedFeed}
                        onFeedAction={handleFeedAction}
                        triggerConfirm={triggerConfirm}
                        onLoginRequest={() =>
                            setAuthModal({ open: true, view: "login" })
                        }
                        onRegisterRequest={() =>
                            setAuthModal({ open: true, view: "register" })
                        }
                        onLogoutRequest={logout}
                        onSettingsRequest={() => setSettingsOpen(true)}
                        onCreateFeed={() =>
                            setManageModal({ open: true, mode: "create" })
                        }
                    />

                    <div className="mt-auto border-t border-[#9ac39d]/30 bg-[#fbfcfb] p-4 shrink-0">
                        {user ? (
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#0e3415] text-white flex items-center justify-center text-sm font-medium">
                                        {user.username
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {user.username}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setSettingsOpen(true)}
                                        className="p-1.5 text-gray-400 hover:text-[#0e3415] rounded-md hover:bg-gray-100"
                                        title="Settings"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        onClick={() => logout()}
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                        title="Logout"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() =>
                                        setAuthModal({
                                            open: true,
                                            view: "login",
                                        })
                                    }
                                    className="px-3 py-1.5 text-sm border rounded hover:border-gray-400"
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
                                    className="px-3 py-1.5 text-sm bg-[#0e3415] text-white rounded hover:bg-[#587e5b]"
                                >
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            </>

            <main className="flex-1 h-full min-w-0 relative flex flex-col">
                <ArticleList
                    feed={selectedFeed}
                    refreshKey={refreshKey}
                    onItemRead={loadData}
                    feedMap={feedMap}
                    triggerConfirm={triggerConfirm}
                    onError={setError}
                    isMobile={false}
                    showSidebarToggle={isDesktopNarrow}
                    onSidebarToggle={() =>
                        setDesktopSidebarOpen(!desktopSidebarOpen)
                    }
                />
            </main>

            <SharedModals
                authModal={authModal}
                setAuthModal={setAuthModal}
                manageModal={manageModal}
                setManageModal={setManageModal}
                infoModalFeed={infoModalFeed}
                setInfoModalFeed={setInfoModalFeed}
                settingsOpen={settingsOpen}
                setSettingsOpen={setSettingsOpen}
                confirmConfig={confirmConfig}
                setConfirmConfig={setConfirmConfig}
                error={error}
                setError={setError}
                onSuccess={() => {
                    loadData();
                    setRefreshKey((p) => p + 1);
                }}
                user={user}
            />
        </div>
    );
}

function SharedModals({
    authModal,
    setAuthModal,
    manageModal,
    setManageModal,
    infoModalFeed,
    setInfoModalFeed,
    settingsOpen,
    setSettingsOpen,
    confirmConfig,
    setConfirmConfig,
    error,
    setError,
    onSuccess,
    user,
}: any) {
    return (
        <>
            <CustomConfirmModal
                {...confirmConfig}
                onClose={() =>
                    setConfirmConfig((prev: any) => ({
                        ...prev,
                        isOpen: false,
                    }))
                }
            />
            {error && (
                <ErrorToast message={error} onClose={() => setError(null)} />
            )}

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
                    onSuccess={onSuccess}
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
