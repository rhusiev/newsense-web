import { useState, useCallback, useMemo, useEffect } from "react";
import { data } from "react-router";
import { AuthProvider, useAuth } from "~/lib/auth-context";
import { SettingsProvider } from "~/lib/settings-context";
import { BASE_URL, api } from "~/lib/api";
import type { Feed } from "~/lib/types";
import type { Route } from "./+types/home";
import { MobileLayout } from "~/components/Home/MobileLayout";
import { DesktopLayout } from "~/components/Home/DesktopLayout";

import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
    return [{ title: "Newsense" }];
};

export async function loader({ request }: Route.LoaderArgs) {
    const cookie = request.headers.get("Cookie");
    try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
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
            <SettingsProvider>
                <HomeContent />
            </SettingsProvider>
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

    const modalProps = {
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
        onSuccess: () => {
            loadData();
            setRefreshKey((p) => p + 1);
        },
        user,
    };

    if (layoutMode === "loading") return null;

    if (layoutMode === "mobile") {
        return (
            <MobileLayout
                user={user}
                mobileTab={mobileTab}
                setMobileTab={setMobileTab}
                selectedFeed={selectedFeed}
                setSelectedFeed={setSelectedFeed}
                mobileSearchQuery={mobileSearchQuery}
                setMobileSearchQuery={setMobileSearchQuery}
                unreadOnly={unreadOnly}
                setUnreadOnly={setUnreadOnly}
                refreshKey={refreshKey}
                setRefreshKey={setRefreshKey}
                logout={logout}
                setAuthModal={setAuthModal}
                setSettingsOpen={setSettingsOpen}
                setManageModal={setManageModal}
                handleFeedAction={handleFeedAction}
                feedMap={feedMap}
                triggerConfirm={triggerConfirm}
                setError={setError}
                onItemRead={loadData}
                subscribed={subscribed}
                getFilteredSubscribed={getFilteredSubscribed}
                getFilteredOwned={getFilteredOwned}
                modalProps={modalProps}
            />
        );
    }

    return (
        <DesktopLayout
            user={user}
            isDesktopNarrow={isDesktopNarrow}
            desktopSidebarOpen={desktopSidebarOpen}
            setDesktopSidebarOpen={setDesktopSidebarOpen}
            selectedFeed={selectedFeed}
            setSelectedFeed={setSelectedFeed}
            subscribed={subscribed}
            owned={owned}
            totalUnread={totalUnread}
            handleFeedAction={handleFeedAction}
            triggerConfirm={triggerConfirm}
            logout={logout}
            setAuthModal={setAuthModal}
            setSettingsOpen={setSettingsOpen}
            setManageModal={setManageModal}
            refreshKey={refreshKey}
            onItemRead={loadData}
            feedMap={feedMap}
            setError={setError}
            modalProps={modalProps}
        />
    );
}
