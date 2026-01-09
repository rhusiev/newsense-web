import { useState, useEffect, useRef } from "react";
import {
    Search,
    User as UserIcon,
    LogOut,
    Settings,
    CheckCheck,
    RefreshCw,
    Eye,
    EyeOff,
    ArrowLeft,
    Plus,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { LayoutList, Compass as CompassIcon } from "lucide-react";
import type { User, Feed } from "~/lib/types";
import { SearchInput } from "./ui/SearchInput";

interface MobileTopBarProps {
    user: User | null;
    activeTab: "subscriptions" | "owned" | "discover";
    selectedFeed: Feed | null;
    searchQuery: string;

    onSearchChange: (q: string) => void;
    onClearSearch: () => void;
    onBack: () => void;
    onCreateFeed: () => void;

    unreadOnly: boolean;
    isSyncing: boolean;
    onToggleUnread: () => void;
    onMarkAllRead: () => void;
    onRefresh: () => void;

    onProfileClick: () => void;
    onSettingsClick: () => void;
    onLogoutClick: () => void;
    onLoginClick: () => void;
}

export function MobileTopBar({
    user,
    activeTab,
    selectedFeed,
    searchQuery,
    onSearchChange,
    onClearSearch,
    onBack,
    onCreateFeed,
    unreadOnly,
    isSyncing,
    onToggleUnread,
    onMarkAllRead,
    onRefresh,
    onSettingsClick,
    onLogoutClick,
    onLoginClick,
}: MobileTopBarProps) {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchActive && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchActive]);

    const showSearchInput =
        isSearchActive && !selectedFeed && activeTab !== "discover";

    const getTitle = () => {
        if (selectedFeed) return selectedFeed.title || "Feed";
        if (activeTab === "subscriptions") return "Subscriptions";
        if (activeTab === "owned") return "Owned Feeds";
        return "Discover";
    };

    const handleSearchClick = () => {
        setIsSearchActive(true);
    };

    const handleClearCancel = () => {
        setIsSearchActive(false);
        onClearSearch();
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-3 justify-between sticky top-0 z-30 shrink-0">
            <div className="flex items-center w-12 shrink-0">
                {selectedFeed ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        title="Go Back"
                    >
                        <ArrowLeft size={22} className="text-gray-700" />
                    </Button>
                ) : (
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={
                                !user
                                    ? "text-brand-600 bg-brand-50"
                                    : "text-gray-700"
                            }
                            onClick={() =>
                                user
                                    ? setProfileOpen(!profileOpen)
                                    : onLoginClick()
                            }
                            title={user ? "Profile & Settings" : "Log In"}
                        >
                            {user ? (
                                <UserIcon size={22} />
                            ) : (
                                <UserIcon size={20} />
                            )}
                        </Button>

                        {profileOpen && user && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setProfileOpen(false)}
                                />
                                <div className="absolute top-12 left-0 w-48 bg-white shadow-xl border border-gray-100 rounded-lg p-1 z-50 flex flex-col animate-in fade-in zoom-in-95">
                                    <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-50 mb-1">
                                        {user.username}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            onSettingsClick();
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded text-left active:bg-gray-100"
                                    >
                                        <Settings size={14} /> Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            onLogoutClick();
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded text-left active:bg-red-100"
                                    >
                                        <LogOut size={14} /> Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 flex justify-center px-2 min-w-0">
                {showSearchInput ? (
                    <div className="w-full animate-in fade-in zoom-in-95 duration-200">
                        <SearchInput
                            ref={inputRef}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onClear={onClearSearch}
                            placeholder="Filter..."
                        />
                    </div>
                ) : (
                    <h1 className="font-serif font-bold text-lg text-brand-950 truncate animate-in fade-in">
                        {getTitle()}
                    </h1>
                )}
            </div>

            <div className="flex items-center justify-end w-16 gap-3 shrink-0">
                {selectedFeed ? (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            isLoading={isSyncing}
                            title="Sync Feed"
                        >
                            {!isSyncing && <RefreshCw size={20} />}
                        </Button>
                        <Button
                            variant={unreadOnly ? "secondary" : "ghost"}
                            size="icon"
                            onClick={onToggleUnread}
                            title={
                                unreadOnly
                                    ? "Show All Articles"
                                    : "Show Unread Only"
                            }
                        >
                            {unreadOnly ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onMarkAllRead}
                            title="Mark All Read"
                        >
                            <CheckCheck size={20} />
                        </Button>
                    </>
                ) : (
                    <>
                        {activeTab === "owned" && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onCreateFeed}
                                className="text-brand-600"
                                title="Add New Feed"
                            >
                                <Plus size={22} />
                            </Button>
                        )}

                        {activeTab === "discover" ? (
                            <div className="w-9" />
                        ) : showSearchInput ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClearCancel}
                                className="text-gray-500"
                                title="Close Search"
                            >
                                <Search size={22} />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSearchClick}
                                className="text-gray-600"
                                title="Search Feeds"
                            >
                                <Search size={22} />
                            </Button>
                        )}
                    </>
                )}
            </div>
        </header>
    );
}

interface MobileBottomNavProps {
    activeTab: "subscriptions" | "owned" | "discover";
    onTabChange: (tab: "subscriptions" | "owned" | "discover") => void;
}

export function MobileBottomNav({
    activeTab,
    onTabChange,
}: MobileBottomNavProps) {
    const tabs = [
        { id: "subscriptions", label: "Subscriptions", icon: LayoutList },
        { id: "owned", label: "Owned Feeds", icon: Settings },
        { id: "discover", label: "Discover", icon: CompassIcon },
    ] as const;

    return (
        <nav className="h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white border-t border-gray-100 flex items-center justify-around z-30 shrink-0">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const handleClick = () => onTabChange(tab.id);

                return (
                    <button
                        key={tab.id}
                        onClick={handleClick}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all rounded-xl active:bg-gray-50 active:scale-95 ${isActive ? "text-brand-600" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
