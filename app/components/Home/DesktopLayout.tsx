import { Settings, LogOut } from "lucide-react";
import type { Feed, User } from "~/lib/types";
import { Sidebar } from "~/components/Sidebar/index";
import { ArticleList } from "~/components/ArticleList";
import { SharedModals } from "./SharedModals";

interface DesktopLayoutProps {
    user: User | null;
    isDesktopNarrow: boolean;
    desktopSidebarOpen: boolean;
    setDesktopSidebarOpen: (val: boolean) => void;
    selectedFeed: Feed | null;
    setSelectedFeed: (feed: Feed | null) => void;
    subscribed: Feed[];
    owned: Feed[];
    totalUnread: number;
    handleFeedAction: (action: string, feed: Feed) => void;
    triggerConfirm: (config: any) => void;
    logout: () => void;
    setAuthModal: (val: any) => void;
    setSettingsOpen: (val: boolean) => void;
    setManageModal: (val: any) => void;
    refreshKey: number;
    onItemRead: () => void;
    feedMap: Map<string, string>;
    setError: (msg: string | null) => void;
    modalProps: any;
}

export function DesktopLayout({
    user,
    isDesktopNarrow,
    desktopSidebarOpen,
    setDesktopSidebarOpen,
    selectedFeed,
    setSelectedFeed,
    subscribed,
    owned,
    totalUnread,
    handleFeedAction,
    triggerConfirm,
    logout,
    setAuthModal,
    setSettingsOpen,
    setManageModal,
    refreshKey,
    onItemRead,
    feedMap,
    setError,
    modalProps,
}: DesktopLayoutProps) {
    return (
        <div className="flex h-screen w-full bg-white overflow-hidden text-brand-900 relative">
            <>
                {isDesktopNarrow && desktopSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-in fade-in duration-200"
                        onClick={() => setDesktopSidebarOpen(false)}
                    />
                )}
                <aside
                    className={`
                        flex flex-col h-full bg-white border-r border-brand-border-light/20 transition-all duration-300
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

                    <div className="mt-auto border-t border-brand-border-light/30 bg-[#fbfcfb] p-4 shrink-0">
                        {user ? (
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-medium">
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
                                        className="p-1.5 text-gray-400 hover:text-brand-900 rounded-md hover:bg-gray-100"
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
                                    className="px-3 py-1.5 text-sm bg-brand-900 text-white rounded hover:bg-brand-accent"
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
                    onItemRead={onItemRead}
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

            <SharedModals {...modalProps} />
        </div>
    );
}
