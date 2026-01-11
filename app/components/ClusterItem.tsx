import { useState, useEffect, useRef } from "react";
import {
    Check,
    CheckCheck,
    Circle,
    ThumbsUp,
    ThumbsDown,
    MoreHorizontal,
    ExternalLink,
    Calendar,
} from "lucide-react";
import type { Cluster } from "~/lib/types";
import { stripHtml } from "~/lib/utils";

interface ClusterItemProps {
    cluster: Cluster;
    feedMap: Map<string, string>;
    onUpdateClusterStatus: (id: string, updates: any) => void;
    onUpdateItemStatus: (id: string, updates: any) => void;
}

export function ClusterItem({
    cluster,
    feedMap,
    onUpdateClusterStatus,
    onUpdateItemStatus,
}: ClusterItemProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showLeftFade, setShowLeftFade] = useState(false);

    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    if (!cluster.items || cluster.items.length === 0) return null;

    const activeItem = cluster.items[activeIndex];

    const isSingle = cluster.items.length === 1;
    const clusterLiked = cluster.items.every((i) => i.liked === 1);
    const clusterDisliked = cluster.items.every((i) => i.liked === -1);
    const clusterRead = cluster.items.every((i) => i.is_read);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getFeedName = (item: any) => {
        if (!item.feed_ids) return "Unknown";
        const primaryFeedId =
            item.feed_ids.find((id: string) => feedMap.has(id)) ||
            item.feed_ids[0];
        return feedMap.get(primaryFeedId) || "Subscription";
    };

    const handleScroll = () => {
        if (tabsContainerRef.current) {
            const { scrollLeft } = tabsContainerRef.current;
            setShowLeftFade(scrollLeft > 10);
        }
    };

    useEffect(() => {
        const container = tabsContainerRef.current;
        const activeTab = tabRefs.current[activeIndex];

        if (container && activeTab) {
            const fadeBuffer = 50;
            const tabLeftRelative = activeTab.offsetLeft;
            const tabRightRelative =
                activeTab.offsetLeft + activeTab.offsetWidth;
            const currentScroll = container.scrollLeft;
            const containerWidth = container.offsetWidth;

            if (tabLeftRelative < currentScroll + fadeBuffer) {
                container.scrollTo({
                    left: Math.max(0, tabLeftRelative - fadeBuffer),
                    behavior: "smooth",
                });
            } else if (
                tabRightRelative >
                currentScroll + containerWidth - fadeBuffer
            ) {
                container.scrollTo({
                    left: tabRightRelative - containerWidth + fadeBuffer,
                    behavior: "smooth",
                });
            }
        }
    }, [activeIndex]);

    const handleClusterLike = (val: number) => {
        const newVal =
            (val === 1 && clusterLiked) || (val === -1 && clusterDisliked)
                ? 0
                : val;
        onUpdateClusterStatus(cluster.id, { liked: newVal, is_read: true });
    };

    const handleClusterRead = () => {
        onUpdateClusterStatus(cluster.id, { is_read: !clusterRead });
    };

    return (
        <article className="relative bg-white border border-slate-200 rounded-xl p-5 mb-6 transition-all hover:border-slate-300 hover:shadow-sm">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="flex justify-between items-center mb-3 gap-4">
                <div className="relative flex-1 min-w-0">
                    <div
                        className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showLeftFade ? "opacity-100" : "opacity-0"}`}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

                    <div
                        ref={tabsContainerRef}
                        onScroll={handleScroll}
                        className="flex overflow-x-auto no-scrollbar gap-4 pr-12 pl-1 py-1 items-center"
                    >
                        {cluster.items.map((item, idx) => {
                            const label = getFeedName(item);
                            return (
                                <button
                                    key={item.id}
                                    ref={(el) => {
                                        tabRefs.current[idx] = el;
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveIndex(idx);
                                    }}
                                    className={`
                                        flex items-center gap-0.5 shrink-0 transition-colors
                                        text-xs font-bold uppercase tracking-wider
                                        ${idx === activeIndex ? "text-slate-800" : "text-slate-400 hover:text-slate-600"}
                                    `}
                                >
                                    {!item.is_read && (
                                        <span className="w-1.5 h-1.5 self-start rounded-full bg-blue-500 shrink-0" />
                                    )}

                                    <span
                                        className={`
                                        flex items-center gap-0.5 pb-0.5 border-b-2 transition-colors
                                        ${idx === activeIndex ? "border-slate-800" : "border-transparent"}
                                    `}
                                    >
                                        <span>{label}</span>

                                        {item.liked === 1 && !clusterLiked && (
                                            <ThumbsUp
                                                size={12}
                                                className="text-emerald-500 fill-emerald-500 mb-0.5 ml-0.5"
                                                strokeWidth={1.5}
                                            />
                                        )}
                                        {item.liked === -1 &&
                                            !clusterDisliked && (
                                                <ThumbsDown
                                                    size={12}
                                                    className="text-rose-500 fill-rose-500 mt-0.5 ml-0.5"
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 px-2 py-1 rounded">
                    <Calendar size={12} />
                    {formatDate(activeItem.published_at)}
                </div>
            </div>

            <div className="mb-4">
                <a
                    href={activeItem.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`block text-lg font-bold text-slate-900 mb-2 leading-snug hover:text-indigo-600 transition-colors ${activeItem.is_read ? "opacity-50" : ""}`}
                >
                    {activeItem.title}
                </a>

                <p
                    className={`text-slate-600 text-sm leading-relaxed line-clamp-3 ${activeItem.is_read ? "opacity-50" : ""}`}
                >
                    {stripHtml(activeItem.content).substring(0, 300)}...
                </p>
            </div>

            <div className="flex items-center justify-start pt-1">
                <div className="flex items-center gap-1">
                    <div className="flex items-center rounded-lg p-0.5 pl-0 mr-2">
                        <ActionButton
                            icon={ThumbsUp}
                            active={clusterLiked}
                            activeClass="bg-white text-emerald-600 shadow-sm"
                            defaultClass="text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                            onClick={() => handleClusterLike(1)}
                            title={isSingle ? "Like" : "Like All"}
                        />
                        <ActionButton
                            icon={ThumbsDown}
                            active={clusterDisliked}
                            activeClass="bg-white text-rose-600 shadow-sm"
                            defaultClass="text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                            onClick={() => handleClusterLike(-1)}
                            title={isSingle ? "Dislike" : "Dislike All"}
                        />
                        <div className="w-px h-4 bg-slate-200 mx-0.5" />
                        <ActionButton
                            icon={CheckCheck}
                            active={clusterRead}
                            activeClass="bg-white text-blue-500 shadow-sm"
                            defaultClass="text-slate-400 hover:text-blue-500 hover:bg-slate-100"
                            shouldFill={false}
                            onClick={handleClusterRead}
                            title={isSingle ? "Mark Read" : "Mark All Read"}
                        />
                    </div>

                    <ItemMenuDropdown
                        activeItem={activeItem}
                        feedName={getFeedName(activeItem)}
                        onUpdateItemStatus={onUpdateItemStatus}
                    />
                </div>
            </div>
        </article>
    );
}

interface ActionButtonProps {
    icon: any;
    active: boolean;
    activeClass: string;
    defaultClass: string;
    onClick: () => void;
    title: string;
    shouldFill?: boolean;
}

function ActionButton({
    icon: Icon,
    active,
    activeClass,
    defaultClass,
    onClick,
    title,
    shouldFill = true,
}: ActionButtonProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            title={title}
            className={`
                p-1.5 rounded-md transition-all duration-200
                ${active ? activeClass : defaultClass}
            `}
        >
            <Icon
                size={16}
                strokeWidth={active ? 2.5 : 2}
                fill={active && shouldFill ? "currentColor" : "none"}
            />
        </button>
    );
}

interface ItemMenuProps {
    activeItem: any;
    feedName: string;
    onUpdateItemStatus: (id: string, updates: any) => void;
}

function ItemMenuDropdown({
    activeItem,
    feedName,
    onUpdateItemStatus,
}: ItemMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleItemAction = (updates: any) => {
        onUpdateItemStatus(activeItem.id, updates);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`p-1.5 rounded-md transition-colors ${isOpen ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                title="Article Options"
            >
                <MoreHorizontal size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                            Current: {feedName}
                        </span>
                    </div>

                    <div className="p-1">
                        <MenuItem
                            icon={ThumbsUp}
                            label={
                                activeItem.liked === 1
                                    ? "Unlike Current"
                                    : "Like Current"
                            }
                            active={activeItem.liked === 1}
                            colorClass="text-emerald-600 hover:bg-emerald-50"
                            onClick={() =>
                                handleItemAction({
                                    liked: activeItem.liked === 1 ? 0 : 1,
                                    is_read: true,
                                })
                            }
                        />
                        <MenuItem
                            icon={ThumbsDown}
                            label={
                                activeItem.liked === -1
                                    ? "Undislike Current"
                                    : "Dislike Current"
                            }
                            active={activeItem.liked === -1}
                            colorClass="text-rose-600 hover:bg-rose-50"
                            onClick={() =>
                                handleItemAction({
                                    liked: activeItem.liked === -1 ? 0 : -1,
                                    is_read: true,
                                })
                            }
                        />
                        <MenuItem
                            icon={activeItem.is_read ? Circle : Check}
                            label={
                                activeItem.is_read
                                    ? "Mark Current Unread"
                                    : "Mark Current Read"
                            }
                            active={activeItem.is_read}
                            colorClass="text-blue-500 hover:bg-blue-50"
                            shouldFill={false}
                            onClick={() =>
                                handleItemAction({
                                    is_read: !activeItem.is_read,
                                })
                            }
                        />
                        <div className="h-px bg-slate-100 my-1" />
                        <a
                            href={activeItem.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 w-full px-2 py-2 text-slate-600 hover:bg-slate-50 rounded"
                            onClick={() => setIsOpen(false)}
                        >
                            <ExternalLink size={14} />
                            Open Original
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

interface MenuItemProps {
    icon: any;
    label: string;
    onClick: () => void;
    active: boolean;
    colorClass: string;
    shouldFill?: boolean;
}

function MenuItem({
    icon: Icon,
    label,
    onClick,
    active,
    colorClass,
    shouldFill = true,
}: MenuItemProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`
                flex items-center gap-2 w-full px-2 py-2 rounded text-left transition-colors
                ${active ? colorClass : "text-slate-600 hover:bg-slate-50"}
            `}
        >
            <Icon
                size={14}
                className={active && shouldFill ? "fill-current" : ""}
            />
            {label}
        </button>
    );
}
