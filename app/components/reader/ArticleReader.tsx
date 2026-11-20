import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowLeft,
    ExternalLink,
    Minus,
    ThumbsDown,
    ThumbsUp,
    X,
} from "lucide-react";
import { api } from "~/lib/api";
import type { Item } from "~/lib/types";
import type { ReaderLayout } from "~/lib/constants";
import { stripHtml } from "~/lib/utils";
import { useHasFullText } from "~/lib/full-text";
import { ActionButton } from "../ui/ActionButton";
import { StorySummary } from "./StorySummary";

const BODY =
    "text-[17px] leading-relaxed text-slate-800 font-serif [&_p]:mb-4 [&_a]:text-brand-700 [&_a]:underline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_img]:my-4 [&_img]:rounded-lg [&_img]:max-w-full";

// The server keeps image addresses in data-src, so the publisher sees no request until a tap.
const IMAGE_BUTTON =
    "my-4 w-full py-6 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50 font-sans";

const VISIT_BUTTON =
    "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-brand-900 text-sm font-medium text-white shadow-sm hover:bg-brand-accent transition-colors";

type ArticleText =
    | { state: "loading" }
    | { state: "ready"; html: string }
    | { state: "summary" };

/** Full text when the feed has it on; the feed's summary otherwise. */
function useArticleText(itemId: string, hasFullText: boolean): ArticleText {
    const [text, setText] = useState<ArticleText>({ state: "loading" });
    useEffect(() => {
        if (!hasFullText) {
            setText({ state: "summary" });
            return;
        }
        setText({ state: "loading" });
        api.getFullText(itemId)
            .then((r: { html: string | null }) =>
                setText(
                    r?.html
                        ? { state: "ready", html: r.html }
                        : { state: "summary" },
                ),
            )
            .catch(() => setText({ state: "summary" }));
    }, [itemId, hasFullText]);
    return text;
}

function Body({ html }: { html: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root) return;
        root.innerHTML = html;
        root.querySelectorAll("img[data-src]").forEach((img) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = IMAGE_BUTTON;
            button.textContent = img.getAttribute("alt")
                ? `Show image: ${img.getAttribute("alt")}`
                : "Show image";
            button.onclick = () => {
                img.setAttribute("src", img.getAttribute("data-src") ?? "");
                img.removeAttribute("data-src");
                button.replaceWith(img);
            };
            img.replaceWith(button);
        });
    }, [html]);

    return <div ref={ref} className={BODY} />;
}

function Article({ item, feedName, text }: { item: Item; feedName: string; text: ArticleText }) {
    const summary = stripHtml(item.content).trim();

    return (
        <article className="max-w-[680px] mx-auto">
            <StorySummary storyId={item.cluster_id} />
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-2">
                {feedName}
            </div>
            <h1 className="font-serif text-3xl leading-tight text-slate-900 mb-6">
                {item.title}
            </h1>
            {text.state === "loading" && <p className="text-slate-400">Loading...</p>}
            {text.state === "ready" && <Body html={text.html} />}
            {text.state === "summary" && (
                <div className="space-y-6">
                    {summary && (
                        <p className="text-[17px] leading-relaxed text-slate-800 font-serif whitespace-pre-line">
                            {summary}
                        </p>
                    )}
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className={VISIT_BUTTON}
                    >
                        <ExternalLink size={16} />
                        Visit the website
                    </a>
                </div>
            )}
        </article>
    );
}

function BottomBar({
    item,
    onRate,
    onClose,
}: {
    item: Item;
    onRate: (v: number) => void;
    onClose: () => void;
}) {
    return (
        <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between bg-white">
            <div className="flex items-center gap-1">
                <ActionButton icon={ThumbsUp} active={item.liked === 1} onClick={() => onRate(1)} title="More like this" />
                <ActionButton icon={Minus} active={item.liked === 0} shouldFill={false} onClick={() => onRate(0)} title="Neutral" />
                <ActionButton icon={ThumbsDown} active={item.liked === -1} onClick={() => onRate(-1)} title="Less like this" />
                <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    title="Open original"
                    className="p-1.5 text-slate-400 hover:text-slate-700"
                >
                    <ExternalLink size={16} />
                </a>
            </div>
            <button onClick={onClose} title="Close" className="p-2 text-slate-500 hover:text-slate-800">
                <X size={20} />
            </button>
        </div>
    );
}

interface ReaderProps {
    item: Item;
    feedName: string;
    layout: ReaderLayout;
    onClose: () => void;
    onRate: (v: number) => void;
}

/** "sheet" slides over the list; "page" takes the list pane. Both keep actions at the bottom. */
export function ArticleReader({ item, feedName, layout, onClose, onRate }: ReaderProps) {
    const hasFullText = useHasFullText(item);
    const text = useArticleText(item.id, hasFullText);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const content = (
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
            <Article item={item} feedName={feedName} text={text} />
        </div>
    );
    const bar = <BottomBar item={item} onRate={onRate} onClose={onClose} />;

    if (layout === "page") {
        const pane = document.getElementById("list-pane");
        const page = (
            <div className="absolute inset-0 z-30 bg-white flex flex-col">
                <div className="hidden md:block px-8 py-3 border-b border-slate-100">
                    <button onClick={onClose} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back to the list</span>
                    </button>
                </div>
                {content}
                {bar}
            </div>
        );
        return pane ? createPortal(page, pane) : page;
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative w-full md:w-[720px] h-full bg-white shadow-2xl flex flex-col">
                {content}
                {bar}
            </div>
        </div>,
        document.body,
    );
}
