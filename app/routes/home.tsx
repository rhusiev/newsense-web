import { useState, useCallback, useMemo } from "react";
import { data } from "react-router";
import { Sidebar } from "~/components/Sidebar/index";
import { ArticleList } from "~/components/ArticleList";
import { AuthProvider } from "~/lib/auth-context";
import { AUTH_API_URL } from "~/lib/api";
import type { Feed } from "~/lib/types";
import type { Route } from "./+types/home";
import { CustomConfirmModal, ErrorToast } from "~/components/UIOverlay";

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
    const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [allFeeds, setAllFeeds] = useState<Feed[]>([]);

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

    const feedMap = useMemo(() => {
        const map = new Map<string, string>();
        allFeeds.forEach((f) => map.set(f.id, f.title || "Untitled Feed"));
        return map;
    }, [allFeeds]);

    const handleRefreshRequest = (feedId: string) => {
        if (selectedFeed?.id === feedId) setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden text-[#0e3415]">
            <aside className="w-80 h-full border-r border-[#9ac39d]/20 flex-shrink-0 z-20 relative flex flex-col">
                <Sidebar
                    selectedFeedId={selectedFeed?.id || null}
                    onSelectFeed={setSelectedFeed}
                    onRefreshRequest={handleRefreshRequest}
                    refreshTrigger={sidebarRefreshTrigger}
                    onFeedsLoaded={setAllFeeds}
                    triggerConfirm={triggerConfirm}
                    onError={setError}
                />
            </aside>

            <main className="flex-1 h-full min-w-0 relative">
                <ArticleList
                    feed={selectedFeed}
                    refreshKey={refreshKey}
                    onItemRead={() => setSidebarRefreshTrigger((p) => p + 1)}
                    feedMap={feedMap}
                    triggerConfirm={triggerConfirm}
                    onError={setError}
                />
            </main>

            <CustomConfirmModal
                {...confirmConfig}
                onClose={() =>
                    setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
                }
            />
            {error && (
                <ErrorToast message={error} onClose={() => setError(null)} />
            )}
        </div>
    );
}
