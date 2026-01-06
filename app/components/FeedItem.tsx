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

    const isVirtual = feed.id === "all" || feed.id === "unread";

    let faviconUrl: string | null = null;
    try {
        if (feed.url && feed.id !== "all") {
            const hostname = new URL(feed.url).hostname;
            faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        }
    } catch (e) {
        // remains null
    }

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!menuOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuCoords({
                top: rect.bottom + window.scrollY + 5,
                left: rect.right - 192, // 192px = w-48
            });
        }
        setMenuOpen(!menuOpen);
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
                onClick={onClick}
                className={`group flex items-center px-3 py-2.5 mx-6 rounded-lg justify-between cursor-pointer transition-all duration-200 border border-l-2 border-transparent
          ${
              isSelected
                  ? "bg-[#587e5b]/20 text-[#0e3415] border-[#587e5b]/10"
                  : "text-gray-900 hover:bg-gray-200/60 hover:border-gray-200"
          }
        `}
            >
                <div className="flex gap-3 items-center min-w-0">
                    {faviconUrl && !imgError && !isVirtual ? (
                        <img
                            src={faviconUrl}
                            onError={() => setImgError(true)}
                            className="w-4 h-4 rounded-sm opacity-90 object-contain"
                            alt=""
                        />
                    ) : (
                        <div
                            className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 ${isSelected ? "bg-[#587e5b]/20 text-[#0e3415]" : "bg-gray-200 text-gray-500"}`}
                        >
                            {feed.id === "all" ? (
                                <Layers size={10} />
                            ) : feed.id === "unread" ? (
                                <Inbox size={10} />
                            ) : (
                                <Rss size={10} />
                            )}
                        </div>
                    )}

                    <p
                        className={`text-sm font-medium truncate ${isSelected ? "font-bold" : ""}`}
                    >
                        {feed.title || feed.url || "Untitled"}
                    </p>
                </div>

                <div className="ml-2 flex-shrink-0 w-8 h-6 flex items-center justify-end">
                    <div
                        className={`bg-[#587e5b] rounded-full px-1.5 py-0.5 text-white text-[10px] font-bold min-w-[20px] text-center shadow-sm ${isSelected ? "hidden" : "block group-hover:hidden"} ${!feed.unread_count ? "opacity-0" : ""}`}
                    >
                        {feed.unread_count || 0}
                    </div>

                    <button
                        ref={buttonRef}
                        onClick={handleMenuToggle}
                        className={`text-gray-600 hover:text-[#0e3415] p-0.5 rounded-md hover:bg-black/5 ${isSelected ? "flex" : "hidden group-hover:flex"} items-center justify-center`}
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
                            onClick={() => setMenuOpen(false)}
                        />
                        <div
                            style={{
                                top: menuCoords.top,
                                left: menuCoords.left,
                            }}
                            className="fixed z-[101] w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        >
                            <button
                                onClick={(e) =>
                                    handleMenuAction(
                                        e,
                                        alreadySubscribed
                                            ? "unsubscribe"
                                            : "subscribe",
                                    )
                                }
                                className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left text-gray-800 font-medium"
                            >
                                {alreadySubscribed ? (
                                    <Minus size={14} />
                                ) : (
                                    <Plus size={14} />
                                )}
                                {alreadySubscribed
                                    ? "Unsubscribe"
                                    : "Subscribe"}
                            </button>

                            <button
                                onClick={(e) =>
                                    handleMenuAction(e, "mark_read")
                                }
                                className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left text-gray-800 font-medium"
                            >
                                <CheckCircle size={14} /> Mark all read
                            </button>

                            <button
                                onClick={(e) => handleMenuAction(e, "info")}
                                className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left text-gray-800 font-medium"
                            >
                                <Info size={14} /> Feed Info
                            </button>

                            {type === "owned" && (
                                <>
                                    <div className="h-px bg-gray-100 my-1" />
                                    <button
                                        onClick={(e) =>
                                            handleMenuAction(e, "edit")
                                        }
                                        className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left text-gray-800 font-medium"
                                    >
                                        <Edit size={14} /> Edit Feed
                                    </button>
                                    <button
                                        onClick={(e) =>
                                            handleMenuAction(e, "delete")
                                        }
                                        className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-red-600 text-left font-medium"
                                    >
                                        <Trash2 size={14} /> Delete Feed
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
