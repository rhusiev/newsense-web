import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
import type { Feed } from "~/lib/types";
import { FeedItem } from "~/components/FeedItem";

interface FeedSectionProps {
    title: string;
    feeds: Feed[];
    feedType: "subscribed" | "owned";
    selectedFeedId: string | null;
    checkIsSubscribed?: (feedId: string) => boolean;
    onSelectFeed: (feed: Feed) => void;
    onFeedAction: (action: string, feed: Feed) => void;
    onSearch: (query: string) => void;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    onCreateFeed?: () => void;
}

export function FeedSection({
    title,
    feeds,
    feedType,
    selectedFeedId,
    checkIsSubscribed,
    onSelectFeed,
    onFeedAction,
    onSearch,
    collapsible = false,
    defaultExpanded = false,
    onCreateFeed,
}: FeedSectionProps) {
    const [isExpanded, setIsExpanded] = useState(
        collapsible ? defaultExpanded : true
    );
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!isExpanded && collapsible) {
            setIsSearchVisible(false);
        }
    }, [isExpanded, collapsible]);

    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        onSearch(val);
    };

    const toggleSearch = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSearchVisible) {
            handleSearchChange("");
        }
        setIsSearchVisible(!isSearchVisible);
    };

    const handleCreateClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCreateFeed?.();
    };

    return (
        <div>
            <div
                className={`flex items-center justify-between px-6 py-3 group select-none ${
                    collapsible ? "cursor-pointer" : ""
                }`}
                onClick={() => collapsible && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    {collapsible && (
                        <span className="mr-2 text-gray-500 group-hover:text-[#587e5b] transition-colors p-1 rounded hover:bg-[#587e5b]/10">
                            {isExpanded ? (
                                <ChevronDown size={14} strokeWidth={3} />
                            ) : (
                                <ChevronRight size={14} strokeWidth={3} />
                            )}
                        </span>
                    )}
                    <span className="text-[#587e5b] uppercase tracking-wider text-xs font-bold group-hover:text-[#0e3415] transition-colors">
                        {title}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {(!collapsible || isExpanded) && (
                        <button
                            onClick={toggleSearch}
                            className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                                isSearchVisible
                                    ? "text-[#587e5b] bg-[#587e5b]/10"
                                    : "text-gray-400 hover:text-[#587e5b] hover:bg-gray-100"
                            }`}
                            title="Search"
                        >
                            <Search size={16} />
                        </button>
                    )}
                    
                    {onCreateFeed && (
                        <button
                            onClick={handleCreateClick}
                            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-[#587e5b] hover:bg-gray-100 transition-colors"
                            title="Create New Feed"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out px-2 ${
                    isSearchVisible ? "max-h-12 opacity-100 mb-3" : "max-h-0 opacity-0"
                }`}
            >
                <div className="relative mx-2">
                    <Search
                        className="absolute left-3 top-2.5 text-gray-500"
                        size={14}
                    />
                    <input
                        type="text"
                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#587e5b] focus:ring-1 focus:ring-[#587e5b]/20 text-xs text-gray-900 font-medium placeholder-gray-400"
                        placeholder={`Filter ${title}...`}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus={isSearchVisible}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => handleSearchChange("")}
                            className="absolute right-2 top-2 text-gray-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isExpanded 
                        ? "grid-rows-[1fr] opacity-100" 
                        : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="mt-1 pb-1"> 
                        {feeds.map((feed) => (
                            <FeedItem
                                key={feed.id}
                                feed={feed}
                                type={feedType}
                                isSelected={selectedFeedId === feed.id}
                                isSubscribed={
                                    checkIsSubscribed
                                        ? checkIsSubscribed(feed.id)
                                        : false
                                }
                                onClick={() => onSelectFeed(feed)}
                                onAction={onFeedAction}
                            />
                        ))}
                        
                        {feeds.length === 0 && searchQuery && (
                            <p className="px-6 py-2 text-xs text-gray-500 font-medium italic text-center">
                                No feeds match "{searchQuery}"
                            </p>
                        )}
                        {feeds.length === 0 && !searchQuery && (
                            <p className="px-6 py-2 text-xs text-gray-400 italic">
                                Empty list
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
