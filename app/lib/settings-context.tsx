import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";
import type { FeedFilter } from "./types";
import {
  DEFAULT_ALL_ARTICLES_FILTER,
  DEFAULT_LIST_ORDER,
  DEFAULT_READER_LAYOUT,
  DEFAULT_SCORE_THRESHOLD,
  DEFAULT_TOP_PER_DAY,
  DEFAULT_USE_CLUSTERS,
  SETTINGS_STORAGE_KEY,
  type AllArticlesFilter,
  type ListOrder,
  type ReaderLayout,
} from "./constants";

interface Settings {
  allArticlesFilter: AllArticlesFilter;
  scoreThreshold: number;
  topPerDay: number;
  useClusters: boolean;
  listOrder: ListOrder;
  readerLayout: ReaderLayout;
  llmSummaries: boolean;
  llmAllowed: boolean;
  llmDailyLimit: number;
  llmUsedToday: number;
  /** Each feed's own filter by feed id. A feed absent here is off. */
  feedFilters: Record<string, FeedFilter>;
}

interface SettingsContextType extends Settings {
  setAllArticlesFilter: (value: AllArticlesFilter) => void;
  setScoreThreshold: (value: number) => void;
  setTopPerDay: (value: number) => void;
  setUseClusters: (value: boolean) => void;
  setListOrder: (value: ListOrder) => void;
  setReaderLayout: (value: ReaderLayout) => void;
  setLlmSummaries: (value: boolean) => void;
  setFeedFilter: (feedId: string, filter: FeedFilter) => void;
  /** Fetches the server's settings again, such as today's LLM call count. */
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Typing a number sends one update after the user pauses, not one per key.
const SAVE_DELAY_MS = 500;

const DEFAULTS: Settings = {
  allArticlesFilter: DEFAULT_ALL_ARTICLES_FILTER,
  scoreThreshold: DEFAULT_SCORE_THRESHOLD,
  topPerDay: DEFAULT_TOP_PER_DAY,
  useClusters: DEFAULT_USE_CLUSTERS,
  listOrder: DEFAULT_LIST_ORDER,
  readerLayout: DEFAULT_READER_LAYOUT,
  llmSummaries: false,
  llmAllowed: true,
  llmDailyLimit: 70,
  llmUsedToday: 0,
  feedFilters: {},
};

type ServerSettings = {
  all_articles_filter: AllArticlesFilter;
  score_threshold: number;
  top_per_day: number;
  use_clusters: boolean;
  list_order: ListOrder;
  reader_layout: ReaderLayout;
  llm_summaries: boolean;
  llm_allowed: boolean;
  llm_daily_limit: number;
  llm_used_today: number;
  feed_filters: Record<string, FeedFilter>;
};

// A field the server does not send yet (an older backend) keeps its default.
const fromServer = (s: Partial<ServerSettings>): Settings => ({
  allArticlesFilter: s.all_articles_filter ?? DEFAULTS.allArticlesFilter,
  scoreThreshold: s.score_threshold ?? DEFAULTS.scoreThreshold,
  topPerDay: s.top_per_day ?? DEFAULTS.topPerDay,
  useClusters: s.use_clusters ?? DEFAULTS.useClusters,
  listOrder: s.list_order ?? DEFAULTS.listOrder,
  readerLayout: s.reader_layout ?? DEFAULTS.readerLayout,
  llmSummaries: s.llm_summaries ?? DEFAULTS.llmSummaries,
  llmAllowed: s.llm_allowed ?? DEFAULTS.llmAllowed,
  llmDailyLimit: s.llm_daily_limit ?? DEFAULTS.llmDailyLimit,
  llmUsedToday: s.llm_used_today ?? DEFAULTS.llmUsedToday,
  feedFilters: s.feed_filters ?? DEFAULTS.feedFilters,
});

interface Cached {
  userId: string | null;
  settings: Settings;
}

function loadCached(): Cached {
  if (typeof window === "undefined") return { userId: null, settings: DEFAULTS };
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null");
    if (stored?.settings) {
      return { userId: stored.userId ?? null, settings: { ...DEFAULTS, ...stored.settings } };
    }
  } catch (e) {
    console.error("Failed to parse settings", e);
  }
  return { userId: null, settings: DEFAULTS };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.user_id ?? null;
  const [cached] = useState(loadCached);
  const [settings, setSettings] = useState<Settings>(cached.settings);
  const owner = useRef<string | null>(cached.userId);
  // Edits not yet confirmed by the server, as sent and as shown.
  const pending = useRef<Partial<ServerSettings>>({});
  const pendingLocal = useRef<Partial<Settings>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Server state wins, except for edits the server has not answered yet.
  const reload = () => {
    const forUser = userId;
    return api
      .getSettings()
      .then((s: ServerSettings) => {
        if (owner.current !== forUser) return;
        setSettings({ ...fromServer(s), ...pendingLocal.current });
      })
      .catch((e) => console.error("Failed to load settings", e));
  };

  // The user is null until the session check answers, so null only means a
  // logout once a user has been seen.
  const seenUser = useRef(false);
  useEffect(() => {
    const loggedOut = !userId && seenUser.current;
    const otherAccount = !!userId && !!owner.current && owner.current !== userId;
    if (loggedOut || otherAccount) {
      // Another account's settings must not carry over.
      if (timer.current) clearTimeout(timer.current);
      pending.current = {};
      pendingLocal.current = {};
      setSettings(DEFAULTS);
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
    if (userId || loggedOut) owner.current = userId;
    if (userId) {
      seenUser.current = true;
      reload();
    }
  }, [userId]);

  useEffect(() => {
    if (owner.current) {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ userId: owner.current, settings }),
      );
    }
  }, [settings, userId]);

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const body = pending.current;
    pending.current = {};
    pendingLocal.current = {};
    if (Object.keys(body).length === 0 || !owner.current) return;
    api.updateSettings(body).catch((e) => {
      console.error("Failed to save settings", e);
      // Show what the server kept instead of a value it refused.
      reload();
    });
  };

  // A pending edit is sent, not dropped, when the page goes away.
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const save = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
    patch: Partial<ServerSettings>,
  ) => {
    setSettings((s) => ({ ...s, [key]: value }));
    if (!owner.current) return;
    pending.current = { ...pending.current, ...patch };
    pendingLocal.current = { ...pendingLocal.current, [key]: value };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  };

  const setFeedFilter = (feedId: string, filter: FeedFilter) => {
    setSettings((s) => {
      const feedFilters = { ...s.feedFilters };
      if (filter.mode === "off") delete feedFilters[feedId];
      else feedFilters[feedId] = filter;
      return { ...s, feedFilters };
    });
    api.setFeedFilter(feedId, filter).catch((e) => {
      console.error("Failed to save feed filter", e);
      reload();
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setAllArticlesFilter: (v) =>
          save("allArticlesFilter", v, { all_articles_filter: v }),
        setScoreThreshold: (v) => save("scoreThreshold", v, { score_threshold: v }),
        setTopPerDay: (v) => save("topPerDay", v, { top_per_day: v }),
        setUseClusters: (v) => save("useClusters", v, { use_clusters: v }),
        setListOrder: (v) => save("listOrder", v, { list_order: v }),
        setReaderLayout: (v) => save("readerLayout", v, { reader_layout: v }),
        setLlmSummaries: (v) => save("llmSummaries", v, { llm_summaries: v }),
        setFeedFilter,
        reloadSettings: reload,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
