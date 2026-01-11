import { createPortal } from "react-dom";
import { Plus, Minus, CheckCircle, Info, Edit, Trash2 } from "lucide-react";
import type { Feed } from "~/lib/types";

interface FeedItemMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { top: number; left: number };
    feed: Feed;
    type: "subscribed" | "owned" | "public";
    isSubscribed?: boolean;
    onAction: (action: string, feed: Feed) => void;
}

export function FeedItemMenu({
    isOpen,
    onClose,
    position,
    feed,
    type,
    isSubscribed,
    onAction,
}: FeedItemMenuProps) {
    if (!isOpen) return null;

    const isVirtual = feed.id === "all" || feed.id === "unread";
    const alreadySubscribed = type === "subscribed" || isSubscribed;

    const handleMenuAction = (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        onClose();
        onAction(action, feed);
    };

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[100]"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                onTouchStart={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            <div
                style={{
                    top: position.top,
                    left: position.left,
                }}
                className="fixed z-[101] w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            >
                {!isVirtual && (
                    <button
                        onClick={(e) =>
                            handleMenuAction(
                                e,
                                alreadySubscribed ? "unsubscribe" : "subscribe",
                            )
                        }
                        className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left text-gray-800 font-medium transition-colors"
                    >
                        {alreadySubscribed ? (
                            <Minus size={16} />
                        ) : (
                            <Plus size={16} />
                        )}
                        {alreadySubscribed ? "Unsubscribe" : "Subscribe"}
                    </button>
                )}

                <button
                    onClick={(e) => handleMenuAction(e, "mark_read")}
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
                            onClick={(e) => handleMenuAction(e, "edit")}
                            className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left text-gray-800 font-medium transition-colors"
                        >
                            <Edit size={16} /> Edit Feed
                        </button>
                        <button
                            onClick={(e) => handleMenuAction(e, "delete")}
                            className="flex w-full items-center gap-2 px-4 py-3 md:py-2.5 hover:bg-red-50 active:bg-red-100 text-red-600 text-left font-medium transition-colors"
                        >
                            <Trash2 size={16} /> Delete Feed
                        </button>
                    </>
                )}
            </div>
        </>,
        document.body,
    );
}
