import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
    MoreHorizontal,
    Trash2,
    Edit,
    CheckCircle,
    Info,
    Plus,
    Minus,
    Layers,
    Inbox,
    Rss,
} from "lucide-react";
import type { Feed } from "~/lib/types";

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

    const handleMenuAction = (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        setMenuOpen(false);
        onAction(action, feed);
    };

    const alreadySubscribed = type === "subscribed" || isSubscribed;

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
                        ? "bg-[#587e5b]/10 md:bg-[#587e5b]/20 text-[#0e3415] border-l-[#587e5b] md:border-y-[#587e5b]/10 md:border-r-[#587e5b]/10"
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
                            className={`w-5 h-5 md:w-4 md:h-4 rounded-sm flex items-center justify-center shrink-0 ${isSelected ? "bg-[#587e5b]/20 text-[#0e3415]" : "text-gray-500"}`}
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
                        className={`bg-[#587e5b] rounded-full px-2 py-0.5 md:px-1.5 text-white text-xs md:text-[10px] font-bold min-w-[20px] text-center shadow-sm ${isSelected ? "hidden" : "block md:group-hover:hidden"} ${!feed.unread_count ? "opacity-0" : ""}`}
                    >
                        {feed.unread_count || 0}
                    </div>

                    <button
                        ref={buttonRef}
                        onClick={handleMenuToggle}
                        className={`hidden md:flex text-gray-600 hover:text-[#0e3415] p-0.5 rounded-md hover:bg-black/5 ${isSelected ? "md:flex" : "md:hidden group-hover:flex"} items-center justify-center transition-colors`}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {menuOpen &&
                createPortal(
                    <>
                        <div
                            className="fixed inset-0 z-[100]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(false);
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                setMenuOpen(false);
                            }}
                        />
                        <div
                            style={{
                                top: menuCoords.top,
                                left: menuCoords.left,
                            }}
                            className="fixed z-[101] w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        >
                            {!isVirtual && (
                                <button
                                    onClick={(e) =>
                                        handleMenuAction(
                                            e,
                                            alreadySubscribed
                                                ? "unsubscribe"
                                                : "subscribe",
                                        )
                                    }
                                    className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left text-gray-800 font-medium transition-colors"
                                >
                                    {alreadySubscribed ? (
                                        <Minus size={16} />
                                    ) : (
                                        <Plus size={16} />
                                    )}
                                    {alreadySubscribed
                                        ? "Unsubscribe"
                                        : "Subscribe"}
                                </button>
                            )}

                            <button
                                onClick={(e) =>
                                    handleMenuAction(e, "mark_read")
                                }
                                className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left text-gray-800 font-medium transition-colors"
                            >
                                <CheckCircle size={16} /> Mark all read
                            </button>

                            {!isVirtual && (
                                <button
                                    onClick={(e) => handleMenuAction(e, "info")}
                                    className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left text-gray-800 font-medium transition-colors"
                                >
                                    <Info size={16} /> Feed Info
                                </button>
                            )}

                            {type === "owned" && (
                                <>
                                    <div className="h-px bg-gray-100 my-1" />
                                    <button
                                        onClick={(e) =>
                                            handleMenuAction(e, "edit")
                                        }
                                        className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left text-gray-800 font-medium transition-colors"
                                    >
                                        <Edit size={16} /> Edit Feed
                                    </button>
                                    <button
                                        onClick={(e) =>
                                            handleMenuAction(e, "delete")
                                        }
                                        className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-red-50 active:bg-red-100 text-red-600 text-left font-medium transition-colors"
                                    >
                                        <Trash2 size={16} /> Delete Feed
                                    </button>
                                </>
                            )}
                        </div>
                    </>,
                    document.body,
                )}
        </div>
    );
}
