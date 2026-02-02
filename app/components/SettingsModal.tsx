import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { useSettings } from "~/lib/settings-context";
import { Input } from "./ui/Input";

export function SettingsModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const {
        filterPrediction,
        setFilterPrediction,
        filterPredictionThreshold,
        setFilterPredictionThreshold,
        useClusters,
        setUseClusters,
    } = useSettings();

    const [localThreshold, setLocalThreshold] = useState(
        filterPredictionThreshold.toString(),
    );

    useEffect(() => {
        const currentLocalVal = parseFloat(localThreshold);
        if (currentLocalVal !== filterPredictionThreshold) {
            setLocalThreshold(filterPredictionThreshold.toString());
        }
    }, [filterPredictionThreshold]);

    const handleCommit = () => {
        let val = parseFloat(localThreshold);
        if (isNaN(val)) {
            setLocalThreshold(filterPredictionThreshold.toString());
            return;
        }

        val = Math.max(-1, Math.min(1, val));
        setFilterPredictionThreshold(val);
        setLocalThreshold(val.toString());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-brand-950">
                                AI Filtering
                            </h3>
                            <p className="text-xs text-gray-500">
                                Hide articles that are predicted to be
                                irrelevant.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filterPrediction}
                                onChange={(e) =>
                                    setFilterPrediction(e.target.checked)
                                }
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                    </div>

                    {filterPrediction && (
                        <div className="pl-4 border-l-2 border-brand-100">
                            <Input
                                label="Filtering Threshold"
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
                                        setFilterPredictionThreshold(val);
                                    }
                                    setLocalThreshold(valStr);
                                }}
                                onBlur={handleCommit}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleCommit();
                                        (e.target as HTMLInputElement).blur();
                                    }
                                }}
                                helpText="Range: -1 to 1 (-1: definitely dislike, 1: definitely like). Values outside this range will be clamped."
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-brand-950">
                                Article Clustering
                            </h3>
                            <p className="text-xs text-gray-500">
                                Group similar articles together into clusters.
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
                </div>
            </div>
        </Modal>
    );
}
