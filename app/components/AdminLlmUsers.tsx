import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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
const PAGE_SIZE = 8;

/** Admin list of who may use summaries and each user's daily limit. */
export function AdminLlmUsers() {
    const [users, setUsers] = useState<LlmUser[]>([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const pending = useRef<Record<string, Partial<LlmUser>>>({});
    const saved = useRef<Record<string, LlmUser>>({});

    useEffect(() => {
        api.getLlmUsers()
            .then((r: LlmUser[]) => {
                setUsers(r);
                r.forEach((u) => { saved.current[u.id] = u; });
            })
            .catch(() => setError("Could not load users."));
        return () => {
            Object.values(timers.current).forEach(clearTimeout);
        };
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q
            ? users.filter((u) => u.username.toLowerCase().includes(q))
            : users;
    }, [users, query]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages - 1);
    const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

    const changeQuery = (value: string) => {
        setQuery(value);
        setPage(0);
    };

    const save = async (id: string) => {
        const patch = pending.current[id] || {};
        const base = saved.current[id];
        delete pending.current[id];
        if (!base || !Object.keys(patch).length) return;
        const next = { ...base, ...patch } as LlmUser;
        try {
            await api.setUserLlm(id, {
                allowed: next.llm_allowed,
                daily_limit: next.llm_daily_limit,
            });
            saved.current[id] = next;
        } catch {
            setUsers((list) => list.map((u) => (u.id === id ? base : u)));
            setError("Could not save that change.");
        }
    };

    const flush = (id: string) => {
        const timer = timers.current[id];
        if (timer) {
            clearTimeout(timer);
            delete timers.current[id];
        }
        return save(id);
    };

    const update = (user: LlmUser, patch: Partial<LlmUser>, debounce = false) => {
        setUsers((list) =>
            list.map((u) => (u.id === user.id ? { ...u, ...patch } : u)),
        );
        pending.current[user.id] = { ...(pending.current[user.id] || {}), ...patch };
        if (debounce) {
            const timer = timers.current[user.id];
            if (timer) clearTimeout(timer);
            timers.current[user.id] = setTimeout(() => {
                delete timers.current[user.id];
                save(user.id);
            }, SAVE_DELAY_MS);
        } else {
            flush(user.id);
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-base font-semibold text-brand-950 tracking-tight">
                    Summary access
                </h3>
                <p className="text-xs text-gray-500">
                    Per-user control. This overrides the limit users see in General.
                </p>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 text-[10px] uppercase tracking-wide text-gray-400">
                <span>User</span>
                <span>Allowed</span>
                <span>Daily limit</span>
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => changeQuery(e.target.value)}
                    placeholder="Search users"
                    aria-label="Search users"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
            </div>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                {visible.map((user) => (
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
                        <LimitInput
                            value={user.llm_daily_limit}
                            onChange={(value) =>
                                update(user, { llm_daily_limit: value }, true)
                            }
                            label={`Daily limit for ${user.username}`}
                        />
                    </div>
                ))}
                {!visible.length && !error && (
                    <p className="px-3 py-4 text-xs text-gray-400">
                        {query ? "No users match that search." : "No users."}
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                    {filtered.length
                        ? `${current * PAGE_SIZE + 1}-${Math.min((current + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`
                        : "0 users"}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={current === 0}
                        aria-label="Previous users"
                        className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="px-2">
                        Page {current + 1} of {pages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                        disabled={current >= pages - 1}
                        aria-label="Next users"
                        className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Keeps the typed text while it is not a valid limit, and saves only whole
 *  numbers in range, so clearing the field to retype does not save 1. */
function LimitInput({
    value,
    onChange,
    label,
}: {
    value: number;
    onChange: (value: number) => void;
    label: string;
}) {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => setDraft(String(value)), [value]);
    return (
        <input
            type="number"
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            step={1}
            value={draft}
            onChange={(e) => {
                setDraft(e.target.value);
                const next = Number(e.target.value);
                if (
                    e.target.value !== "" &&
                    Number.isInteger(next) &&
                    next >= MIN_LIMIT &&
                    next <= MAX_LIMIT
                ) {
                    onChange(next);
                }
            }}
            onBlur={() => setDraft(String(value))}
            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs"
            aria-label={label}
        />
    );
}
