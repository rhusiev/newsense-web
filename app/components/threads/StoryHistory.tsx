import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { History, X } from "lucide-react";
import { api } from "~/lib/api";
import { useFocusTrap } from "~/lib/focus_trap";
import type { Item, ThreadStory, ThreadTimeline } from "~/lib/types";
import { ArticleReader } from "../reader/ArticleReader";
import { useSettings } from "~/lib/settings-context";

const day = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });

const feedNameFor = (item: Item, feedMap: Map<string, string>) => {
    const id = item.feed_ids.find((fid) => feedMap.has(fid));
    return (id && feedMap.get(id)) || "Subscription";
};

/** A small entry point on a story card; the thread is only shown on demand. */
export function StoryHistory({
    storyId,
    feedMap,
}: {
    storyId: string;
    feedMap: Map<string, string>;
}) {
    const [available, setAvailable] = useState<ThreadTimeline | null>(null);
    const [thread, setThread] = useState<ThreadTimeline | null>(null);
    const [reading, setReading] = useState<Item | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const { readerLayout } = useSettings();
    useFocusTrap(panelRef, Boolean(thread) && !reading);

    useEffect(() => {
        let alive = true;
        setAvailable(null);
        if (storyId) {
            api.getStoryThread(storyId)
                .then((result) => {
                    if (alive && result.stories.length > 1) setAvailable(result);
                })
                .catch(() => {});
        }
        return () => {
            alive = false;
        };
    }, [storyId]);

    useEffect(() => {
        if (!thread || reading) return;
        panelRef.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setThread(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [thread, reading]);

    if (!available) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setThread(available)}
                title={`Show ${available.stories.length} stories in this thread`}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-700"
            >
                <History size={13} />
                {available.stories.length} stories
            </button>
            {thread && createPortal(
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20" onClick={() => setThread(null)} />
                    <div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Story history"
                        tabIndex={-1}
                        className="relative w-full md:w-[720px] h-full bg-white shadow-2xl flex flex-col outline-none"
                    >
                        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-1">
                                Thread · {thread.stories.length} stories
                            </div>
                            <h2 className="font-serif text-2xl text-slate-900 mb-6">{thread.title}</h2>
                            {thread.stories.map((story: ThreadStory, index: number) => (
                                <section key={story.id} className="relative pl-6 pb-6 border-l-2 border-slate-200">
                                    <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-brand-600" />
                                    <h3 className="text-xs font-bold text-slate-500 mb-2">
                                        {day(story.sort_date)} · story {index + 1}
                                    </h3>
                                    <button
                                        type="button"
                                        className="text-left font-bold text-slate-900 hover:text-brand-700"
                                        onClick={() => {
                                            api.getItem(story.item_id)
                                                .then(setReading)
                                                .catch(() => {});
                                        }}
                                    >
                                        {story.title}
                                    </button>
                                </section>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between bg-white">
                            <span className="text-xs text-slate-500">
                                {thread.stories.length} stories
                            </span>
                            <button
                                type="button"
                                onClick={() => setThread(null)}
                                aria-label="Close story history"
                                title="Close story history"
                                className="p-2 text-slate-500 hover:text-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>,
                document.body,
            )}
            {reading && (
                <ArticleReader
                    item={reading}
                    feedName={feedNameFor(reading, feedMap)}
                    context={
                        thread
                            ? `Story ${
                                thread.stories.findIndex((story) => story.item_id === reading.id) + 1
                            } of ${thread.stories.length}`
                            : undefined
                    }
                    layout={readerLayout}
                    onClose={() => setReading(null)}
                    onRate={(value) => {
                        const liked = reading.liked === value ? null : value;
                        api.updateItemStatus(reading.id, { liked, is_read: true })
                            .then(() =>
                                setReading((current) =>
                                    current?.id === reading.id
                                        ? { ...current, liked, is_read: true }
                                        : current,
                                ),
                            )
                            .catch(() => {});
                    }}
                />
            )}
        </>
    );
}
