import { useState, useEffect } from "react";
import { X, Globe, Link as LinkIcon, Lock, Calendar } from "lucide-react";
import { api } from "~/lib/api";
import type { Feed } from "~/lib/types";
import { Button } from "~/components/ui/Button";
import { Modal } from "~/components/ui/Modal";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";

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
        </Modal>
    );
}
