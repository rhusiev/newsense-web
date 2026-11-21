import { useEffect, useRef, useState } from "react";
import { api } from "~/lib/api";

interface LlmUser {
    id: string;
    username: string;
    llm_allowed: boolean;
    llm_daily_limit: number;
}

const MIN_LIMIT = 1;
const MAX_LIMIT = 10000;
const SAVE_DELAY_MS = 400;

/** Admin list of who may use summaries and each user's daily limit. */
export function AdminLlmUsers() {
    const [users, setUsers] = useState<LlmUser[]>([]);
    const [error, setError] = useState("");
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        api.getLlmUsers()
            .then((r: LlmUser[]) => setUsers(r))
            .catch(() => setError("Could not load users."));
        return () => {
            Object.values(timers.current).forEach(clearTimeout);
        };
    }, []);

    const save = async (user: LlmUser, patch: Partial<LlmUser>) => {
        try {
            await api.setUserLlm(user.id, {
                allowed: patch.llm_allowed ?? user.llm_allowed,
                daily_limit: patch.llm_daily_limit ?? user.llm_daily_limit,
            });
        } catch {
            setUsers((list) => list.map((u) => (u.id === user.id ? user : u)));
            setError("Could not save that change.");
        }
    };

    const update = (user: LlmUser, patch: Partial<LlmUser>, debounce = false) => {
        setUsers((list) =>
            list.map((u) => (u.id === user.id ? { ...u, ...patch } : u)),
        );
        const timer = timers.current[user.id];
        if (timer) clearTimeout(timer);
        const apply = () => save(user, patch);
        if (debounce) {
            timers.current[user.id] = setTimeout(apply, SAVE_DELAY_MS);
        } else {
            apply();
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-medium text-brand-950">
                    Summary access
                </h3>
                <p className="text-xs text-gray-500">
                    Turn summaries on for a user or change their daily limit.
                </p>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                        <span className="flex-1 truncate text-brand-900">
                            {user.username}
                        </span>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500">
                            <input
                                type="checkbox"
                                checked={user.llm_allowed}
                                onChange={(e) =>
                                    update(user, { llm_allowed: e.target.checked })
                                }
                            />
                            Allowed
                        </label>
                        <input
                            type="number"
                            min={MIN_LIMIT}
                            max={MAX_LIMIT}
                            value={user.llm_daily_limit}
                            onChange={(e) => {
                                const value = Math.min(
                                    MAX_LIMIT,
                                    Math.max(MIN_LIMIT, Number(e.target.value)),
                                );
                                update(user, { llm_daily_limit: value }, true);
                            }}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs"
                            aria-label={`Daily limit for ${user.username}`}
                        />
                    </div>
                ))}
                {!users.length && !error && (
                    <p className="px-3 py-4 text-xs text-gray-400">No users.</p>
                )}
            </div>
        </div>
    );
}
