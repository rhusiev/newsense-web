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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// A copy of the server's settings, so the page shows them before the server answers.
const STORAGE_KEY = "newsense-settings";
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

const fromServer = (s: ServerSettings): Settings => ({
  allArticlesFilter: s.all_articles_filter,
  scoreThreshold: s.score_threshold,
  topPerDay: s.top_per_day,
  useClusters: s.use_clusters,
  listOrder: s.list_order,
  readerLayout: s.reader_layout,
  llmSummaries: s.llm_summaries,
  llmAllowed: s.llm_allowed,
  llmDailyLimit: s.llm_daily_limit,
  llmUsedToday: s.llm_used_today,
  feedFilters: s.feed_filters,
});

function loadCached(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  } catch (e) {
    console.error("Failed to parse settings", e);
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(loadCached);
  const pending = useRef<Partial<ServerSettings>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .getSettings()
      .then((s: ServerSettings) => setSettings(fromServer(s)))
      .catch(() => {});
  }, [user?.user_id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const save = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
    patch: Partial<ServerSettings>,
  ) => {
    setSettings((s) => ({ ...s, [key]: value }));
    pending.current = { ...pending.current, ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const body = pending.current;
      pending.current = {};
      api.updateSettings(body).catch((e) => console.error("Failed to save settings", e));
    }, SAVE_DELAY_MS);
  };

  const setFeedFilter = (feedId: string, filter: FeedFilter) => {
    setSettings((s) => {
      const feedFilters = { ...s.feedFilters };
      if (filter.mode === "off") delete feedFilters[feedId];
      else feedFilters[feedId] = filter;
      return { ...s, feedFilters };
    });
    api
      .setFeedFilter(feedId, filter)
      .catch((e) => console.error("Failed to save feed filter", e));
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
