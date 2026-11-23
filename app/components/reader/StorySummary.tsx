import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "~/lib/api";
import { useSettings } from "~/lib/settings-context";
import type { StorySummaryStatus } from "~/lib/types";

/** A quiet, tinted card below the reader title. Nothing shows when summaries are off. */
export function StorySummary({ storyId }: { storyId: string | null }) {
    const [status, setStatus] = useState<StorySummaryStatus | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const { llmSummaries } = useSettings();

    useEffect(() => {
        let alive = true;
        setStatus(null);
        if (storyId && llmSummaries) {
            api.getStorySummaryStatus(storyId)
                .then((result) => alive && setStatus(result))
                .catch(() => {});
        }
        return () => {
            alive = false;
        };
    }, [storyId, llmSummaries]);

    const recreate = useCallback(async () => {
        if (!storyId) return;
        setRefreshing(true);
        try {
            await api.refreshStorySummary(storyId);
            setStatus({ ...(await api.getStorySummaryStatus(storyId)), status: "pending" });
        } catch {
            // The existing summary stays on screen if the request fails.
        } finally {
            setRefreshing(false);
        }
    }, [storyId]);

    if (!llmSummaries || !status || status.status === "not-applicable") return null;

    if (status.status === "pending" || refreshing) {
        return (
            <div className="mb-8 rounded-xl border border-brand-100 bg-brand-50/60 px-5 py-4">
                <p className="text-sm text-brand-700 font-medium">
                    Summary is being prepared
                </p>
            </div>
        );
    }

    return (
        <div className="mb-8 rounded-xl border border-brand-100 bg-brand-50/60 px-5 py-4">
            <div className="flex items-baseline justify-between gap-3 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                    Story summary · AI
                </p>
                {status.can_recreate && (
                    <button
                        type="button"
                        onClick={recreate}
                        className="flex items-center gap-1 text-xs text-brand-700 hover:underline"
                    >
                        <RefreshCw size={12} />
                        Recreate
                    </button>
                )}
            </div>
            <p className="text-[15px] leading-relaxed text-slate-700 font-serif whitespace-pre-line">
                {status.summary}
            </p>

        </div>
    );
}
