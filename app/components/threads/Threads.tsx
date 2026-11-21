import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "~/lib/api";
import type { Item, ThreadBrief, ThreadStory, ThreadTimeline } from "~/lib/types";
import { ArticleReader } from "../reader/ArticleReader";
import { useSettings } from "~/lib/settings-context";

const day = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function Timeline({
    thread,
    onOpen,
}: {
    thread: ThreadTimeline;
    onOpen: (item: Item) => void;
}) {
    const byDay = new Map<string, ThreadStory[]>();
    [...thread.stories].reverse().forEach((story) => {
        const key = day(story.sort_date);
        byDay.set(key, [...(byDay.get(key) ?? []), story]);
    });
    return (
        <div className="max-w-[720px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-1">
                Story · {thread.stories.length} updates
            </div>
            <h2 className="font-serif text-2xl text-slate-900 mb-6">{thread.title}</h2>
            {[...byDay].map(([label, stories]) => (
                <section key={label} className="relative pl-6 pb-6 border-l-2 border-slate-200">
                    <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-brand-600" />
                    <h3 className="text-xs font-bold text-slate-500 mb-2">{label}</h3>
                    {stories.map((story) => (
                        <button
                            key={story.id}
                            type="button"
                            className={`block text-left font-bold leading-snug ${
                                story.is_read ? "text-slate-400" : "text-slate-900"
                            }`}
                            onClick={() => {
                                api.getItem(story.item_id).then(onOpen).catch(() => {});
                            }}
                        >
                            {story.title}
                            <span className="ml-2 text-[10px] font-normal text-slate-400">
                                {story.item_count} article{story.item_count === 1 ? "" : "s"}
                            </span>
                        </button>
                    ))}
                </section>
            ))}
        </div>
    );
}

export function Threads({ refreshKey }: { refreshKey: number }) {
    const [threads, setThreads] = useState<ThreadBrief[]>([]);
    const [open, setOpen] = useState<ThreadTimeline | null>(null);
    const [reading, setReading] = useState<Item | null>(null);
    const { readerLayout } = useSettings();

    useEffect(() => {
        api.getThreads().then(setThreads).catch(() => setThreads([]));
    }, [refreshKey]);

    if (!threads.length) return null;

    return (
        <section className="space-y-4" aria-label="Storylines">
            {threads.map((thread) => (
                <article key={thread.id} className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {day(thread.first_date)} – {day(thread.last_date)} · {thread.unread_count} unread of {thread.story_count}
                    </div>
                    <button
                        type="button"
                        className="text-left text-lg font-bold text-slate-900 leading-snug hover:text-brand-700"
                        onClick={() => {
                            api.getStoryThread(thread.id)
                                .then(setOpen)
                                .catch(() => {});
                        }}
                    >
                        {thread.title}
                    </button>
                </article>
            ))}

            {open && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(null)} />
                    <div className="relative w-full md:w-[720px] h-full bg-white shadow-2xl flex flex-col">
                        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                            <Timeline thread={open} onOpen={setReading} />
                        </div>
                        <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between bg-white">
                            <span className="text-xs text-slate-500">
                                {open.stories.filter((story) => story.is_read).length} of {open.stories.length} read
                            </span>
                            <button
                                type="button"
                                onClick={() => setOpen(null)}
                                title="Close"
                                className="p-2 text-slate-500 hover:text-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reading && (
                <ArticleReader
                    item={reading}
                    feedName="Story"
                    layout={readerLayout}
                    onClose={() => setReading(null)}
                    onRate={(value) => {
                        api.updateItemStatus(reading.id, { liked: value })
                            .catch(() => {});
                    }}
                />
            )}
        </section>
    );
}
