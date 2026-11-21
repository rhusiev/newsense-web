import { useState, useEffect, useCallback } from "react";
import { Modal } from "./ui/Modal";
import { useSettings } from "~/lib/settings-context";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { api } from "~/lib/api";
import type { AccessCode } from "~/lib/types";
import {
    Settings,
    Shield,
    Trash2,
    Plus,
    Hash,
    X,
    AlertCircle,
    Pencil,
    Check,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Segmented } from "~/components/ui/Segmented";
import { LlmSettings } from "./LlmSettings";
import { AdminLlmUsers } from "./AdminLlmUsers";
import {
    MAX_TOP_PER_DAY,
    type AllArticlesFilter,
    type ReaderLayout,
} from "~/lib/constants";

// A small picture of each layout: the sheet leaves the list visible on the
// left, the page replaces it. Only the chosen one is tinted.
function ReaderLayoutPicture({ layout }: { layout: ReaderLayout }) {
    const lines = (count: number) =>
        Array.from({ length: count }, (_, i) => (
            <div
                key={i}
                className={`h-1 rounded-full ${i % 3 === 0 ? "w-4/5 bg-brand-200" : "w-full bg-gray-200"}`}
            />
        ));
    return (
        <div className="flex justify-center gap-6 py-1" aria-hidden="true">
            {(["sheet", "page"] as const).map((mode) => (
                <div key={mode} className="flex flex-col items-center gap-1.5">
                    <div
                        className={`w-24 h-16 rounded-lg border p-1.5 flex gap-1 ${
                            layout === mode
                                ? "border-brand-500 bg-brand-50"
                                : "border-gray-200 bg-gray-50"
                        }`}
                    >
                        {mode === "sheet" ? (
                            <>
                                <div className="w-1/2 space-y-1.5 pt-1">
                                    {lines(5)}
                                </div>
                                <div className="w-1/2 rounded border border-gray-200 bg-white p-1.5 space-y-1.5">
                                    {lines(4)}
                                </div>
                            </>
                        ) : (
                            <div className="w-full rounded border border-gray-200 bg-white p-1.5 space-y-1.5">
                                {lines(5)}
                            </div>
                        )}
                    </div>
                    <span
                        className={`text-[10px] ${
                            layout === mode
                                ? "text-brand-700 font-medium"
                                : "text-gray-400"
                        }`}
                    >
                        {mode === "sheet" ? "Over list" : "Full page"}
                    </span>
                </div>
            ))}
        </div>
    );
}

const ALL_ARTICLES_FILTERS: { mode: AllArticlesFilter; label: string }[] = [
    { mode: "off", label: "Off" },
    { mode: "score", label: "Score" },
    { mode: "top", label: "Top per day" },
    { mode: "each", label: "Each feed's" },
];

const ALL_ARTICLES_HINTS: Record<AllArticlesFilter, string> = {
    off: "Shows every story.",
    score: "Hides stories scored below the threshold, in every feed.",
    top: "Shows the day's best stories of all feeds together.",
    each: "Uses each feed's own filter, then shows them together. Feeds with filtering off show every story.",
};

const READER_LAYOUTS: { mode: ReaderLayout; label: string }[] = [
    { mode: "sheet", label: "Over the list" },
    { mode: "page", label: "Instead of the list" },
];

export function SettingsModal({
    isOpen,
    onClose,
    triggerConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    triggerConfirm: (config: any) => void;
}) {
    const {
        allArticlesFilter,
        setAllArticlesFilter,
        scoreThreshold,
        setScoreThreshold,
        useClusters,
        setUseClusters,
        topPerDay,
        setTopPerDay,
        readerLayout,
        setReaderLayout,
    } = useSettings();

    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "admin">("general");
    const [localThreshold, setLocalThreshold] = useState(
        scoreThreshold.toString(),
    );

    useEffect(() => {
        if (isOpen) {
            api.checkAdmin()
                .then(() => setIsAdmin(true))
                .catch((err) => {
                    console.error("Admin check failed:", err);
                    setIsAdmin(false);
                });
        }
    }, [isOpen]);

    useEffect(() => {
        const currentLocalVal = parseFloat(localThreshold);
        if (currentLocalVal !== scoreThreshold) {
            setLocalThreshold(scoreThreshold.toString());
        }
    }, [scoreThreshold]);

    const handleCommit = () => {
        let val = parseFloat(localThreshold);
        if (isNaN(val)) {
            setLocalThreshold(scoreThreshold.toString());
            return;
        }

        val = Math.max(-1, Math.min(1, val));
        setScoreThreshold(val);
        setLocalThreshold(val.toString());
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={activeTab === "admin" ? "Admin Settings" : "Settings"}
            maxWidth={activeTab === "admin" ? "max-w-4xl" : "max-w-2xl"}
        >
            {isAdmin && (
                <div className="px-6 pt-4">
                    <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                        <button
                            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm
                                ${activeTab === "general" ? "bg-white text-brand-900 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"}
                            `}
                            onClick={() => setActiveTab("general")}
                        >
                            <Settings size={16} />
                            <span>General</span>
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm
                                ${activeTab === "admin" ? "bg-white text-brand-900 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"}
                            `}
                            onClick={() => setActiveTab("admin")}
                        >
                            <Shield size={16} />
                            <span>Admin</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="p-6">
                {activeTab === "general" ? (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-sm font-medium text-brand-950">
                                        All Articles filter
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {ALL_ARTICLES_HINTS[allArticlesFilter]}
                                    </p>
                                </div>
                                <Segmented
                                    options={ALL_ARTICLES_FILTERS}
                                    value={allArticlesFilter}
                                    onChange={setAllArticlesFilter}
                                />
                                {allArticlesFilter === "score" && (
                                    <Input
                                        label="Minimum score"
                                        type="number"
                                        step="0.1"
                                        min="-1"
                                        max="1"
                                        value={localThreshold}
                                        onChange={(e) => {
                                            let valStr = e.target.value;
                                            let val = parseFloat(valStr);
                                            if (!isNaN(val)) {
                                                if (val > 1) {
                                                    val = 1;
                                                    valStr = "1";
                                                } else if (val < -1) {
                                                    val = -1;
                                                    valStr = "-1";
                                                }
                                                setScoreThreshold(val);
                                            }
                                            setLocalThreshold(valStr);
                                        }}
                                        onBlur={handleCommit}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleCommit();
                                                (
                                                    e.target as HTMLInputElement
                                                ).blur();
                                            }
                                        }}
                                        helpText="Hides stories scored below this. Range: -1 to 1, where higher keeps more."
                                    />
                                )}
                                {allArticlesFilter === "top" && (
                                    <Input
                                        label="Stories per day"
                                        type="number"
                                        step="1"
                                        min="1"
                                        max={MAX_TOP_PER_DAY}
                                        value={topPerDay}
                                        onChange={(e) => {
                                            const val = parseInt(
                                                e.target.value,
                                                10,
                                            );
                                            if (
                                                val >= 1 &&
                                                val <= MAX_TOP_PER_DAY
                                            )
                                                setTopPerDay(val);
                                        }}
                                        helpText="The day's best-scored stories, plus a few from lower down so the model learns what it would hide."
                                    />
                                )}
                                <p className="text-xs text-gray-500">
                                    Each feed sets its own filter from its
                                    menu.
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-brand-950">
                                        Stories
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Group similar articles into one story.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useClusters}
                                        onChange={(e) =>
                                            setUseClusters(e.target.checked)
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <h3 className="text-sm font-medium text-brand-950">
                                        Reader
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Where articles open. Every title opens
                                        the reader.
                                    </p>
                                </div>
                                <Segmented
                                    options={READER_LAYOUTS}
                                    value={readerLayout}
                                    onChange={setReaderLayout}
                                />
                                <ReaderLayoutPicture layout={readerLayout} />
                            </div>

                            <LlmSettings />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <AdminLlmUsers />
                        <AdminCodesView triggerConfirm={triggerConfirm} />
                    </div>
                )}
            </div>
        </Modal>
    );
}

function AdminCodesView({
    triggerConfirm,
}: {
    triggerConfirm: (config: any) => void;
}) {
    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [newCode, setNewCode] = useState("");
    const [newCodeUses, setNewCodeUses] = useState("1");
    const [generateCount, setGenerateCount] = useState("5");
    const [generateUses, setGenerateUses] = useState("1");
    const [editingUses, setEditingUses] = useState<{
        code: string;
        val: string;
    } | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [namesResponse, countResponse] = await Promise.all([
                api.getAdminCodes(),
                api.getAdminCodesCount(),
            ]);
            const codesList: AccessCode[] = (
                Array.isArray(namesResponse)
                    ? namesResponse
                    : namesResponse.codes || []
            ).map((item: any) =>
                typeof item === "string"
                    ? { code: item, uses_left: 1 }
                    : item,
            );
            setCodes(codesList);
            setCount(
                typeof countResponse === "number"
                    ? countResponse
                    : countResponse.count || 0,
            );
        } catch (err: any) {
            showError(err.message || "Failed to load codes");
        } finally {
            setLoading(false);
        }
    }, []);

    const showError = (msg: string) => {
        setError(msg);
        setTimeout(() => setError(""), 3000);
    };

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleCreateNamed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode) return;
        setLoading(true);
        try {
            const uses = parseInt(newCodeUses);
            await api.createAdminCode(newCode, isNaN(uses) ? undefined : uses);
            setNewCode("");
            setNewCodeUses("1");
            await refresh();
        } catch (err: any) {
            showError(err.message || "Failed to create code");
            setLoading(false);
        }
    };

    const handleGenerateRandom = async () => {
        const n = parseInt(generateCount);
        if (isNaN(n) || n <= 0) return;
        setLoading(true);
        try {
            const uses = parseInt(generateUses);
            await api.generateAdminCodes(n, isNaN(uses) ? undefined : uses);
            await refresh();
        } catch (err: any) {
            showError(err.message || "Failed to generate codes");
            setLoading(false);
        }
    };

    const handleUpdateUses = async (code: string, uses_left: number) => {
        setLoading(true);
        try {
            await api.updateAdminCodeUses(code, uses_left);
            setEditingUses(null);
            await refresh();
        } catch (err: any) {
            showError(err.message || "Failed to update uses");
            setLoading(false);
        }
    };

    const handleDelete = async (code: string) => {
        triggerConfirm({
            title: "Delete Code",
            message: `Are you sure you want to delete invitation code "${code}"?`,
            type: "danger",
            onConfirm: async () => {
                setLoading(true);
                try {
                    await api.deleteAdminCode(code);
                    await refresh();
                } catch (err: any) {
                    showError(err.message || "Failed to delete code");
                    setLoading(false);
                }
            },
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
            {error &&
                createPortal(
                    <div className="fixed bottom-6 right-6 z-[400] flex items-center gap-3 bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-10 max-w-sm">
                        <AlertCircle size={20} className="shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                        <button
                            onClick={() => setError("")}
                            className="ml-auto hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>,
                    document.body,
                )}

            <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                            Add Single Code
                        </h4>
                        <form
                            onSubmit={handleCreateNamed}
                            className="space-y-4"
                        >
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        label="Code Name"
                                        value={newCode}
                                        onChange={(e) =>
                                            setNewCode(e.target.value)
                                        }
                                        className="h-10"
                                    />
                                </div>
                                <div className="w-24 shrink-0">
                                    <Input
                                        label="Uses"
                                        type="number"
                                        placeholder="1"
                                        value={newCodeUses}
                                        onChange={(e) =>
                                            setNewCodeUses(e.target.value)
                                        }
                                        className="h-10"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || !newCode}
                                className="w-full h-10"
                                variant="secondary"
                            >
                                <Plus size={18} className="mr-2" />
                                <span>Add Code</span>
                            </Button>
                        </form>
                    </div>

                    <div className="space-y-4 pt-4 border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                            Bulk Generation
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        label="Number of Codes"
                                        type="number"
                                        placeholder="5"
                                        value={generateCount}
                                        onChange={(e) =>
                                            setGenerateCount(e.target.value)
                                        }
                                        className="h-10"
                                        min="1"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        label="Uses each"
                                        type="number"
                                        placeholder="1"
                                        value={generateUses}
                                        onChange={(e) =>
                                            setGenerateUses(e.target.value)
                                        }
                                        className="h-10"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleGenerateRandom}
                                disabled={loading}
                                className="w-full h-10"
                                variant="secondary"
                            >
                                <Hash size={18} className="mr-2" />
                                <span>Generate Random Codes</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex-1 mr-4">
                            Active Codes
                        </h4>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-surface-active rounded-full border border-brand-100 shrink-0">
                            <Hash size={12} className="text-brand-600" />
                            <span className="text-xs font-bold text-brand-900">
                                {count}
                            </span>
                        </div>
                    </div>
                    <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl divide-y divide-gray-50 bg-white">
                        {codes.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">
                                No codes found
                            </div>
                        ) : (
                            codes.map((item) => {
                                const { code: codeVal, uses_left: usesLeft } =
                                    item;

                                return (
                                    <div
                                        key={codeVal}
                                        className="p-3 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm text-gray-700 font-medium">
                                                {codeVal}
                                            </span>
                                            {usesLeft !== undefined && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {editingUses?.code ===
                                                    codeVal ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                className="w-16 h-6 text-xs border border-gray-200 rounded px-1 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                                                value={
                                                                    editingUses.val
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingUses(
                                                                        {
                                                                            code: codeVal,
                                                                            val: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                autoFocus
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        "Enter"
                                                                    ) {
                                                                        const val =
                                                                            parseInt(
                                                                                editingUses.val,
                                                                            );
                                                                        if (
                                                                            !isNaN(
                                                                                val,
                                                                            )
                                                                        ) {
                                                                            handleUpdateUses(
                                                                                codeVal,
                                                                                val,
                                                                            );
                                                                        }
                                                                    } else if (
                                                                        e.key ===
                                                                        "Escape"
                                                                    ) {
                                                                        setEditingUses(
                                                                            null,
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const val =
                                                                        parseInt(
                                                                            editingUses.val,
                                                                        );
                                                                    if (
                                                                        !isNaN(
                                                                            val,
                                                                        )
                                                                    ) {
                                                                        handleUpdateUses(
                                                                            codeVal,
                                                                            val,
                                                                        );
                                                                    }
                                                                }}
                                                                className="text-brand-600 p-0.5 hover:bg-brand-50 rounded"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setEditingUses(
                                                                        null,
                                                                    )
                                                                }
                                                                className="text-gray-400 p-0.5 hover:bg-gray-100 rounded"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className="text-xs text-gray-400 cursor-pointer hover:text-brand-600 flex items-center gap-1.5 group/edit"
                                                            onClick={() =>
                                                                setEditingUses({
                                                                    code: codeVal,
                                                                    val: usesLeft.toString(),
                                                                })
                                                            }
                                                            title="Click to edit"
                                                        >
                                                            {usesLeft} uses
                                                            remaining
                                                            <Pencil size={12} className="opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleDelete(codeVal)
                                            }
                                            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete code"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
