import { useState, useEffect } from "react";
import {
    X,
    Globe,
    Link as LinkIcon,
    Lock,
    Calendar,
    Users,
} from "lucide-react";
import { api } from "~/lib/api";
import type { Feed } from "~/lib/types";
import { formatNumber } from "~/lib/utils";
import { Button } from "~/components/ui/Button";
import { Modal } from "~/components/ui/Modal";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import { useSettings } from "~/lib/settings-context";
import { MAX_TOP_PER_DAY } from "~/lib/constants";
import { Segmented } from "~/components/ui/Segmented";

interface FeedInfoModalProps {
    feed: Feed | null;
    onClose: () => void;
}

export function FeedInfoModal({ feed, onClose }: FeedInfoModalProps) {
    if (!feed) return null;

    return (
        <Modal
            isOpen={!!feed}
            onClose={onClose}
            title="Feed Information"
            maxWidth="max-w-md"
        >
            <div className="p-6 space-y-6 overflow-y-auto">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {feed.title || "Untitled Feed"}
                    </h3>
                    {feed.description && (
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {feed.description}
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                        <LinkIcon
                            size={16}
                            className="mt-0.5 text-gray-400 shrink-0"
                        />
                        <a
                            href={feed.url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all hover:text-[#587e5b] hover:underline"
                        >
                            {feed.url}
                        </a>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        {feed.is_public ? (
                            <Globe size={16} className="text-blue-400" />
                        ) : (
                            <Lock size={16} className="text-orange-400" />
                        )}
                        <span>
                            {feed.is_public
                                ? "Public Feed (Searchable)"
                                : "Private Feed (Only you)"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Users size={16} className="text-gray-400" />
                        <span>
                            {formatNumber(feed.subscriber_count || 0)}{" "}
                            {feed.subscriber_count === 1
                                ? "subscriber"
                                : "subscribers"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>
                            Added on{" "}
                            {new Date(feed.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Modal>
    );
}

interface FeedManageModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    feed?: Feed | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function FeedManageModal({
    isOpen,
    mode,
    feed,
    onClose,
    onSuccess,
}: FeedManageModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [fullText, setFullText] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setError("");
            if (mode === "edit" && feed) {
                setTitle(feed.title || "");
                setDescription(feed.description || "");
                setIsPublic(feed.is_public);
                setFullText(feed.full_text ?? false);
                setUrl(feed.url);
            } else {
                setTitle("");
                setDescription("");
                setIsPublic(true);
                setFullText(false);
                setUrl("");
            }
        }
    }, [isOpen, mode, feed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (mode === "create") {
                await api.createFeed({
                    url,
                    title,
                    description,
                    is_public: isPublic,
                });
            } else if (mode === "edit" && feed) {
                await api.updateFeed(feed.id, {
                    title,
                    description,
                    is_public: isPublic,
                    full_text: !isPublic && fullText,
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Add New Feed" : "Edit Feed Details"}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <Input
                    label="RSS URL"
                    type="url"
                    required
                    disabled={mode === "edit"}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://site.com/rss"
                />

                <Input
                    label="Title (Optional)"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Awesome Feed"
                />

                <Textarea
                    label="Description (Optional)"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="flex items-center gap-3 pt-2 p-1">
                    <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 text-[#587e5b] rounded border-gray-300 focus:ring-[#587e5b] cursor-pointer"
                    />
                    <label
                        htmlFor="isPublic"
                        className="text-sm text-gray-700 select-none cursor-pointer"
                    >
                        Make this feed public (visible in Discover)
                    </label>
                </div>

                {mode === "edit" && (
                    <div className="flex items-start gap-3 p-1">
                        <input
                            type="checkbox"
                            id="fullText"
                            checked={!isPublic && fullText}
                            disabled={isPublic}
                            onChange={(e) => setFullText(e.target.checked)}
                            className="mt-0.5 w-4 h-4 text-[#587e5b] rounded border-gray-300 focus:ring-[#587e5b] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label
                            htmlFor="fullText"
                            className={`text-sm select-none ${isPublic ? "text-gray-400" : "text-gray-700 cursor-pointer"}`}
                        >
                            Fetch full articles to read here
                            <span className="block text-xs text-gray-500">
                                {isPublic
                                    ? "Only for private feeds."
                                    : "New articles from the last 48 hours. Images load when you tap them."}
                            </span>
                        </label>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading}>
                        {mode === "create" ? "Add Feed" : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// Sets how many stories a day this feed shows in top-per-day mode.
export function FeedTopNModal({
    feed,
    onClose,
}: {
    feed: Feed | null;
    onClose: () => void;
}) {
    const { feedTopN, topPerDay, setFeedTopN } = useSettings();
    const own = feed ? feedTopN[feed.id] : undefined;
    const [useOwn, setUseOwn] = useState(own !== undefined);
    const [value, setValue] = useState(String(own ?? topPerDay));

    useEffect(() => {
        if (!feed) return;
        setUseOwn(own !== undefined);
        setValue(String(own ?? topPerDay));
    }, [feed?.id]);

    if (!feed) return null;
    const n = parseInt(value, 10);
    const valid = n >= 1 && n <= MAX_TOP_PER_DAY;

    const save = () => {
        if (!useOwn) setFeedTopN(feed.id, null);
        else if (valid) setFeedTopN(feed.id, n);
        else return;
        onClose();
    };

    return (
        <Modal isOpen onClose={onClose} title="Stories per day" maxWidth="max-w-sm">
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                    {feed.title || "Untitled Feed"}
                </p>
                <Segmented
                    options={[
                        { mode: "settings", label: `Same as Settings (${topPerDay})` },
                        { mode: "own", label: "Own number" },
                    ]}
                    value={useOwn ? "own" : "settings"}
                    onChange={(m) => setUseOwn(m === "own")}
                />
                {useOwn && (
                    <Input
                        label="Stories per day"
                        type="number"
                        step="1"
                        min="1"
                        max={MAX_TOP_PER_DAY}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        error={valid ? undefined : `Use 1 to ${MAX_TOP_PER_DAY}`}
                    />
                )}
                <p className="text-xs text-gray-500">
                    Applies when Settings use "Top per day".
                </p>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={save}
                        disabled={useOwn && !valid}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
