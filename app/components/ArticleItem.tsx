import { Check, Circle, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Item } from "~/lib/types";
import { Button } from "./ui/Button";

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
            className={`bg-white border border-gray-100 rounded-xl p-5 shadow-sm transition-opacity ${item.is_read ? "opacity-50" : ""}`}
        >
            <div className="flex gap-4">
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                            {feedName}
                        </span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            {formatDate(item.published_at)}
                        </span>
                    </div>

                    <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-lg font-bold text-gray-900 mb-2 leading-tight hover:underline decoration-brand-300 decoration-2 underline-offset-2"
                    >
                        {item.title}
                    </a>

                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                        {item.content
                            ?.replace(/<[^>]*>?/gm, "")
                            .substring(0, 200)}
                        ...
                    </p>
                </div>

                <div className="flex flex-col items-center shrink-0 pt-1 border-l border-gray-50 pl-2 ml-1">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={
                                item.liked === 1
                                    ? "text-green-700 bg-green-50"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }
                            onClick={() => onLikeToggle(item, 1)}
                        >
                            <ThumbsUp
                                size={18}
                                fill={
                                    item.liked === 1 ? "currentColor" : "none"
                                }
                            />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className={
                                item.liked === -1
                                    ? "text-red-700 bg-red-50"
                                    : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                            }
                            onClick={() => onLikeToggle(item, -1)}
                        >
                            <ThumbsDown
                                size={18}
                                fill={
                                    item.liked === -1 ? "currentColor" : "none"
                                }
                            />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={
                            item.is_read
                                ? "text-brand-600 bg-brand-50"
                                : "text-gray-400 hover:text-brand-600 hover:bg-brand-50"
                        }
                        onClick={() =>
                            onUpdateStatus(item.id, { is_read: !item.is_read })
                        }
                    >
                        {item.is_read ? (
                            <Check size={18} strokeWidth={3} />
                        ) : (
                            <Circle size={18} />
                        )}
                    </Button>
                </div>
            </div>
        </article>
    );
}
