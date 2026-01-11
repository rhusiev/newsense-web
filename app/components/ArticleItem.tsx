import { Check, Circle, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Item } from "~/lib/types";
import { stripHtml } from "~/lib/utils";
import { ActionButton } from "./ui/ActionButton";

interface ArticleItemProps {
    item: Item;
    feedName: string;
    onUpdateStatus: (id: string, updates: any) => void;
    onLikeToggle: (item: Item, val: number) => void;
}

export function ArticleItem({
    item,
    feedName,
    onUpdateStatus,
    onLikeToggle,
}: ArticleItemProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <article
            className={`bg-white border border-gray-100 rounded-xl shadow-sm transition-opacity overflow-hidden ${
                item.is_read ? "opacity-50" : ""
            }`}
        >
            <div className="flex">
                <div
                    className={`w-1 shrink-0 transition-colors ${
                        item.liked === 1
                            ? "bg-green-500"
                            : item.liked === -1
                              ? "bg-red-500"
                              : "bg-gray-200"
                    }`}
                />

                <div className="flex-1 p-5">
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-fit block text-lg font-bold text-gray-900 mb-2 leading-tight hover:underline decoration-brand-accent decoration-2 underline-offset-2"
                    >
                        {item.title}
                    </a>

                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-3">
                        {stripHtml(item.content).substring(0, 200)}...
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                                {feedName}
                            </span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {formatDate(item.published_at)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <ActionButton
                                icon={ThumbsUp}
                                active={item.liked === 1}
                                activeClass="text-green-700 bg-green-50"
                                defaultClass="text-gray-400 hover:text-green-600 hover:bg-green-50"
                                onClick={() => onLikeToggle(item, 1)}
                                title="More like this"
                            />

                            <ActionButton
                                icon={ThumbsDown}
                                active={item.liked === -1}
                                activeClass="text-red-700 bg-red-50"
                                defaultClass="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => onLikeToggle(item, -1)}
                                title="Less like this"
                            />

                            <ActionButton
                                icon={item.is_read ? Check : Circle}
                                active={item.is_read}
                                activeClass="text-brand-600 bg-brand-50"
                                defaultClass="text-gray-400 hover:text-brand-600 hover:bg-brand-50"
                                shouldFill={false}
                                onClick={() =>
                                    onUpdateStatus(item.id, {
                                        is_read: !item.is_read,
                                    })
                                }
                                title={
                                    item.is_read
                                        ? "Mark as Unread"
                                        : "Mark as Read"
                                }
                                size={16}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
