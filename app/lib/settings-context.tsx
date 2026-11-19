import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import {
  DEFAULT_FILTER_PREDICTION,
  DEFAULT_FILTER_PREDICTION_THRESHOLD,
  DEFAULT_USE_CLUSTERS,
  DEFAULT_FILTER_MODE,
  DEFAULT_TOP_PER_DAY,
  DEFAULT_ALL_ARTICLES_TOP,
  DEFAULT_READER_LAYOUT,
  type AllArticlesTop,
  type FilterMode,
  type ReaderLayout,
} from "./constants";

interface Settings {
  filterPrediction: boolean;
  filterPredictionThreshold: number;
  useClusters: boolean;
  filterMode: FilterMode;
  topPerDay: number;
  allArticlesTop: AllArticlesTop;
  readerLayout: ReaderLayout;
  /** Feeds with their own stories-per-day count; others use topPerDay. */
  feedTopN: Record<string, number>;
}

interface SettingsContextType extends Settings {
  setFilterPrediction: (value: boolean) => void;
  setFilterPredictionThreshold: (value: number) => void;
  setUseClusters: (value: boolean) => void;
  setFilterMode: (value: FilterMode) => void;
  setTopPerDay: (value: number) => void;
  setAllArticlesTop: (value: AllArticlesTop) => void;
  setReaderLayout: (value: ReaderLayout) => void;
  setFeedTopN: (feedId: string, value: number | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// A copy of the server's settings, so the page shows them before the server answers.
const STORAGE_KEY = "newsense-settings";
// Typing a number sends one update after the user pauses, not one per key.
const SAVE_DELAY_MS = 500;

const DEFAULTS: Settings = {
  filterPrediction: DEFAULT_FILTER_PREDICTION,
  filterPredictionThreshold: DEFAULT_FILTER_PREDICTION_THRESHOLD,
  useClusters: DEFAULT_USE_CLUSTERS,
  filterMode: DEFAULT_FILTER_MODE,
  topPerDay: DEFAULT_TOP_PER_DAY,
  allArticlesTop: DEFAULT_ALL_ARTICLES_TOP,
  readerLayout: DEFAULT_READER_LAYOUT,
  feedTopN: {},
};

type ServerSettings = {
  filter_prediction: boolean;
  score_threshold: number;
  use_clusters: boolean;
  filter_mode: FilterMode;
  top_per_day: number;
  all_articles_top: AllArticlesTop;
  reader_layout: ReaderLayout;
  feed_top_n: Record<string, number>;
};

const fromServer = (s: ServerSettings): Settings => ({
  filterPrediction: s.filter_prediction,
  filterPredictionThreshold: s.score_threshold,
  useClusters: s.use_clusters,
  filterMode: s.filter_mode,
  topPerDay: s.top_per_day,
  allArticlesTop: s.all_articles_top,
  readerLayout: s.reader_layout,
  feedTopN: s.feed_top_n,
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
  const [settings, setSettings] = useState<Settings>(loadCached);
  const pending = useRef<Partial<ServerSettings>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((s: ServerSettings) => setSettings(fromServer(s)))
      .catch(() => {}); // signed out: keep the cached copy
  }, []);

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

  const setFeedTopN = (feedId: string, value: number | null) => {
    setSettings((s) => {
      const feedTopN = { ...s.feedTopN };
      if (value === null) delete feedTopN[feedId];
      else feedTopN[feedId] = value;
      return { ...s, feedTopN };
    });
    api.setFeedTopN(feedId, value).catch((e) => console.error("Failed to save feed setting", e));
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setFilterPrediction: (v) => save("filterPrediction", v, { filter_prediction: v }),
        setFilterPredictionThreshold: (v) =>
          save("filterPredictionThreshold", v, { score_threshold: v }),
        setUseClusters: (v) => save("useClusters", v, { use_clusters: v }),
        setFilterMode: (v) => save("filterMode", v, { filter_mode: v }),
        setTopPerDay: (v) => save("topPerDay", v, { top_per_day: v }),
        setAllArticlesTop: (v) => save("allArticlesTop", v, { all_articles_top: v }),
        setReaderLayout: (v) => save("readerLayout", v, { reader_layout: v }),
        setFeedTopN,
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
