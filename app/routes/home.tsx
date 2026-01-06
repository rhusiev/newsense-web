import { useState } from "react";
import { data } from "react-router";
import { Sidebar } from "~/components/Sidebar/index";
import { ArticleList } from "~/components/ArticleList";
import { AuthProvider } from "~/lib/auth-context";
import { api, AUTH_API_URL } from "~/lib/api";
import type { Feed } from "~/lib/types";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "RSS Reader" },
        { name: "description", content: "Your personal feed aggregator" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const cookie = request.headers.get("Cookie");

    try {
        const response = await fetch(`${AUTH_API_URL}/me`, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return { user: null };
        }

        const user = await response.json();

        const newCookie = response.headers.get("Set-Cookie");

        const headers = new Headers();
        if (newCookie) {
            headers.append("Set-Cookie", newCookie);
        }

        return data({ user }, { headers });
    } catch (error) {
        return { user: null };
    }
}

export default function Home({ loaderData }: Route.ComponentProps) {
    return (
        <AuthProvider initialUser={loaderData.user}>
            <HomeContent />
        </AuthProvider>
    );
}

function HomeContent() {
    const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefreshRequest = (feedId: string) => {
        if (selectedFeed?.id === feedId) {
            setRefreshKey((prev) => prev + 1);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden text-[#0e3415]">
            <aside className="w-80 h-full border-r border-[#9ac39d] flex-shrink-0 z-20 shadow-sm relative flex flex-col">
                <Sidebar
                    selectedFeedId={selectedFeed?.id || null}
                    onSelectFeed={setSelectedFeed}
                    onRefreshRequest={handleRefreshRequest}
                />
            </aside>

            <main className="flex-1 h-full min-w-0 bg-[#f8f9fa] relative">
                <ArticleList feed={selectedFeed} refreshKey={refreshKey} />
            </main>
        </div>
    );
}
