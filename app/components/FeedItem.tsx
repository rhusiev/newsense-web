import { useState, useRef } from "react";
import { MoreHorizontal, Layers, Rss } from "lucide-react";
import type { Feed } from "~/lib/types";
import { FeedItemMenu } from "./FeedItemMenu";

interface FeedItemProps {
    feed: Feed;
    type: "subscribed" | "owned" | "public";
    isSelected: boolean;
    isSubscribed?: boolean;
    onClick: () => void;
    onAction: (action: string, feed: Feed) => void;
}

export function FeedItem({
    feed,
    type,
    isSelected,
    isSubscribed,
    onClick,
    onAction,
}: FeedItemProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
    const [imgError, setImgError] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const itemRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const isVirtual = feed.id === "all" || feed.id === "unread";

    let faviconUrl: string | null = null;
    try {
        if (feed.url && feed.id !== "all") {
            const hostname = new URL(feed.url).hostname;
            faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        }
    } catch (e) {}

    const openMenu = (x: number, y: number) => {
        const top = y + 10;
        const left = Math.min(x, window.innerWidth - 200);
        setMenuCoords({ top, left });
        setMenuOpen(true);
    };

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!menuOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuCoords({
                top: rect.bottom + window.scrollY + 5,
                left: rect.right - 192,
            });
        }
        setMenuOpen(!menuOpen);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        longPressTimer.current = setTimeout(() => {
            if (window.innerWidth < 768) {
                openMenu(x, y);
            }
        }, 600);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return (
        <div className="relative">
            <div
                ref={itemRef}
                onClick={onClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
                className={`group flex items-center px-4 py-3 md:px-3 md:py-2.5 mx-0 md:mx-6 md:rounded-lg justify-between cursor-pointer transition-all duration-200 select-none
                border-l-[4px] md:border-l-2 md:border-y md:border-r active:scale-[0.98]
                ${
                    isSelected
                        ? "bg-brand-accent/10 md:bg-brand-accent/20 text-brand-900 border-l-brand-accent md:border-y-brand-accent/10 md:border-r-brand-accent/10"
                        : "text-gray-900 border-l-transparent border-t-transparent border-r-transparent border-b-gray-100 md:border-b-transparent md:hover:bg-gray-200/60 md:hover:border-gray-200 active:bg-gray-100"
                }
                `}
            >
                <div className="flex gap-3 items-center min-w-0">
                    {faviconUrl && !imgError && !isVirtual ? (
                        <img
                            src={faviconUrl}
                            onError={() => setImgError(true)}
                            className="w-5 h-5 md:w-4 md:h-4 rounded-sm opacity-90 object-contain"
                            alt=""
                        />
                    ) : (
                        <div
                            className={`w-5 h-5 md:w-4 md:h-4 rounded-sm flex items-center justify-center shrink-0 ${isSelected ? "bg-brand-accent/20 text-brand-900" : "text-gray-500"}`}
                        >
                            {feed.id === "all" ? (
                                <Layers className="w-full h-full p-0.5" />
                            ) : (
                                <Rss className="w-full h-full p-0.5" />
                            )}
                        </div>
                    )}

                    <p
                        className={`text-base md:text-sm font-medium truncate ${isSelected ? "font-bold" : ""}`}
                    >
                        {feed.title || feed.url || "Untitled"}
                    </p>
                </div>

                <div className="ml-2 flex-shrink-0 flex items-center justify-end h-6">
                    <div
                        className={`bg-brand-accent rounded-full px-2 py-0.5 md:px-1.5 text-white text-xs md:text-[10px] font-bold min-w-[20px] text-center shadow-sm ${isSelected ? "hidden" : "block md:group-hover:hidden"} ${!feed.unread_count ? "opacity-0" : ""}`}
                    >
                        {feed.unread_count || 0}
                    </div>

                    <button
                        ref={buttonRef}
                        onClick={handleMenuToggle}
                        className={`hidden md:flex text-gray-600 hover:text-brand-900 p-0.5 rounded-md hover:bg-black/5 ${isSelected ? "md:flex" : "md:hidden group-hover:flex"} items-center justify-center transition-colors`}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <FeedItemMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                position={menuCoords}
                feed={feed}
                type={type}
                isSubscribed={isSubscribed}
                onAction={onAction}
            />
        </div>
    );
}
