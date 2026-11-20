import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useSettings } from "~/lib/settings-context";

interface LlmKeyState {
    configured: boolean;
    base_url: string;
    model: string;
}

/** Summary opt-in, daily usage and the user's own model endpoint. */
export function LlmSettings() {
    const {
        llmSummaries,
        setLlmSummaries,
        llmAllowed,
        llmDailyLimit,
        llmUsedToday,
    } = useSettings();
    const [key, setKey] = useState<LlmKeyState | null>(null);
    const [editing, setEditing] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");
    const [model, setModel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.getLlmKey()
            .then((r: any) =>
                setKey({
                    configured: r.configured,
                    base_url: r.base_url || "",
                    model: r.model || "",
                }),
            )
            .catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        setError("");
        try {
            await api.setLlmKey({ base_url: baseUrl, model, api_key: apiKey });
            setKey({ configured: true, base_url: baseUrl, model });
            setApiKey("");
            setEditing(false);
        } catch (e: any) {
            setError(e.message || "Could not save the key.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setSaving(true);
        setError("");
        try {
            await api.deleteLlmKey();
            setKey({ configured: false, base_url: "", model: "" });
        } catch (e: any) {
            setError(e.message || "Could not remove the key.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-medium text-brand-950">
                    Story summaries
                </h3>
                <p className="text-xs text-gray-500">
                    A short summary of each story in your list, in the article language.
                </p>
            </div>
            {llmAllowed ? (
                <>
                    <label className="flex items-center justify-between gap-3">
                        <span className="text-sm text-brand-900">Turn on summaries</span>
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={llmSummaries}
                            onChange={(e) => setLlmSummaries(e.target.checked)}
                        />
                        <span className="relative w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                    </label>
                    <p className="text-[10px] text-gray-400">
                        {llmUsedToday} of {llmDailyLimit} used today
                    </p>
                </>
            ) : (
                <p className="text-xs text-red-500">
                    Your administrator has turned summaries off.
                </p>
            )}

            <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm text-brand-900">Your own model</p>
                        <p className="text-[10px] text-gray-400 truncate">
                            {key?.configured
                                ? `${key.base_url} · ${key.model}`
                                : "Use the instance model"}
                        </p>
                    </div>
                    {!editing && key && (
                        <button
                            type="button"
                            onClick={() => {
                                setBaseUrl(key.base_url);
                                setModel(key.model);
                                setApiKey("");
                                setEditing(true);
                            }}
                            className="text-xs text-brand-700 hover:underline"
                        >
                            {key.configured ? "Change" : "Add"}
                        </button>
                    )}
                </div>
                {editing && (
                    <div className="mt-3 space-y-2">
                        <input
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            placeholder="https://api.example.com/v1"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                        />
                        <input
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            placeholder="Model name"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        />
                        <input
                            type="password"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            placeholder="API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={save}
                                disabled={saving || !baseUrl || !model || !apiKey}
                                className="px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs disabled:opacity-50"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="px-3 py-1.5 rounded-lg text-xs text-gray-500"
                            >
                                Cancel
                            </button>
                            {key?.configured && (
                                <button
                                    type="button"
                                    onClick={remove}
                                    disabled={saving}
                                    className="px-3 py-1.5 rounded-lg text-xs text-red-600"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </div>
        </div>
    );
}
