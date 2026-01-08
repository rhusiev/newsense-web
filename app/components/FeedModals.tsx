import { useState, useEffect } from "react";
import { X, Globe, Link as LinkIcon, Lock, Calendar } from "lucide-react";
import { api } from "~/lib/api";
import type { Feed } from "~/lib/types";
import { Button } from "~/components/ui/Button";

interface FeedInfoModalProps {
    feed: Feed | null;
    onClose: () => void;
}

export function FeedInfoModal({ feed, onClose }: FeedInfoModalProps) {
    if (!feed) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-serif text-lg text-[#0e3415]">
                        Feed Information
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </Button>
                </div>

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
            </div>
        </div>
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

    useEffect(() => {
        if (isOpen) {
            setError("");
            if (mode === "edit" && feed) {
                setTitle(feed.title || "");
                setDescription(feed.description || "");
                setIsPublic(feed.is_public);
                setUrl(feed.url);
            } else {
                setTitle("");
                setDescription("");
                setIsPublic(true);
                setUrl("");
            }
        }
    }, [isOpen, mode, feed]);

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-serif text-lg text-[#0e3415]">
                        {mode === "create"
                            ? "Add New Feed"
                            : "Edit Feed Details"}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            RSS URL
                        </label>
                        <input
                            type="url"
                            required
                            disabled={mode === "edit"}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://site.com/rss"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#587e5b] disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Title{" "}
                            <span className="text-gray-300 font-normal">
                                (Optional)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="My Awesome Feed"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#587e5b]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Description{" "}
                            <span className="text-gray-300 font-normal">
                                (Optional)
                            </span>
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#587e5b] resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-4 h-4 text-[#587e5b] rounded border-gray-300 focus:ring-[#587e5b]"
                        />
                        <label
                            htmlFor="isPublic"
                            className="text-sm text-gray-700 select-none"
                        >
                            Make this feed public (visible in Discover)
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                        >
                            {mode === "create" ? "Add Feed" : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
