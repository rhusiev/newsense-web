import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Feed } from "~/lib/types";
import { FeedItem } from "~/components/FeedItem";
import { SearchableSectionHeader } from "./SearchableSectionHeader";
import { EmptyState } from "../ui/EmptyState";

interface FeedSectionProps {
    feeds: Feed[];
    feedType: "subscribed" | "owned";
    selectedFeedId: string | null;
    checkIsSubscribed?: (feedId: string) => boolean;
    onSelectFeed: (feed: Feed) => void;
    onFeedAction: (action: string, feed: Feed) => void;

    title?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    onSearchChange?: (q: string) => void;
    searchValue?: string;
}

export function FeedSection({
    feeds,
    feedType,
    selectedFeedId,
    checkIsSubscribed,
    onSelectFeed,
    onFeedAction,
    title,
    collapsible = false,
    defaultExpanded = true,
    onSearchChange,
    searchValue,
}: FeedSectionProps) {
    const [isExpanded, setIsExpanded] = useState(
        collapsible ? defaultExpanded : true,
    );

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div>
            {title && (
                <>
                    {onSearchChange ? (
                        <SearchableSectionHeader
                            title={title}
                            onSearch={onSearchChange}
                            searchValue={searchValue || ""}
                            isExpanded={isExpanded}
                            onToggleExpand={toggleExpand}
                            collapsible={collapsible}
                        />
                    ) : (
                        <div
                            className={`flex items-center justify-between px-6 py-3 group select-none ${
                                collapsible ? "cursor-pointer" : ""
                            }`}
                            onClick={() => collapsible && toggleExpand()}
                        >
                            <div className="flex items-center">
                                {collapsible && (
                                    <span className="mr-2 text-gray-500 group-hover:text-[#587e5b] transition-colors p-0.5 rounded">
                                        {isExpanded ? (
                                            <ChevronDown
                                                size={14}
                                                strokeWidth={3}
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={14}
                                                strokeWidth={3}
                                            />
                                        )}
                                    </span>
                                )}
                                <span className="text-[#587e5b] uppercase tracking-wider text-xs font-bold group-hover:text-[#0e3415] transition-colors">
                                    {title}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

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

                        {feeds.length === 0 && (
                            <EmptyState className="py-2 px-6 text-xs text-left">
                                No feeds found.
                            </EmptyState>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
