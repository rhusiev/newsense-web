import { useEffect, useState } from "react";
import { api } from "~/lib/api";

interface LlmUser {
    id: string;
    username: string;
    llm_allowed: boolean;
    llm_daily_limit: number;
}

/** Admin list of who may use summaries and each user's daily limit. */
export function AdminLlmUsers() {
    const [users, setUsers] = useState<LlmUser[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        api.getLlmUsers()
            .then((r: LlmUser[]) => setUsers(r))
            .catch(() => setError("Could not load users."));
    }, []);

    const update = async (user: LlmUser, patch: Partial<LlmUser>) => {
        setUsers((list) =>
            list.map((u) => (u.id === user.id ? { ...u, ...patch } : u)),
        );
        try {
            await api.setUserLlm(user.id, {
                allowed: (patch.llm_allowed ?? user.llm_allowed) as boolean,
                daily_limit: patch.llm_daily_limit ?? user.llm_daily_limit,
            });
        } catch {
            setUsers((list) =>
                list.map((u) => (u.id === user.id ? user : u)),
            );
            setError("Could not save that change.");
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
                            min={1}
                            max={10000}
                            value={user.llm_daily_limit}
                            onChange={(e) =>
                                update(user, {
                                    llm_daily_limit: Number(e.target.value),
                                })
                            }
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
