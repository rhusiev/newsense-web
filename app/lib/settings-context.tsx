import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_FILTER_PREDICTION,
  DEFAULT_FILTER_PREDICTION_THRESHOLD,
  DEFAULT_USE_CLUSTERS,
  DEFAULT_FILTER_MODE,
  DEFAULT_TOP_PER_DAY,
  type FilterMode,
} from "./constants";

interface Settings {
  filterPrediction: boolean;
  filterPredictionThreshold: number;
  useClusters: boolean;
  filterMode: FilterMode;
  topPerDay: number;
}

interface SettingsContextType extends Settings {
  setFilterPrediction: (value: boolean) => void;
  setFilterPredictionThreshold: (value: number) => void;
  setUseClusters: (value: boolean) => void;
  setFilterMode: (value: FilterMode) => void;
  setTopPerDay: (value: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = "newsense-settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return {
            filterPrediction: DEFAULT_FILTER_PREDICTION,
            filterPredictionThreshold: DEFAULT_FILTER_PREDICTION_THRESHOLD,
            useClusters: DEFAULT_USE_CLUSTERS,
            filterMode: DEFAULT_FILTER_MODE,
            topPerDay: DEFAULT_TOP_PER_DAY,
            ...JSON.parse(stored),
          };
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
    return {
      filterPrediction: DEFAULT_FILTER_PREDICTION,
      filterPredictionThreshold: DEFAULT_FILTER_PREDICTION_THRESHOLD,
      useClusters: DEFAULT_USE_CLUSTERS,
      filterMode: DEFAULT_FILTER_MODE,
      topPerDay: DEFAULT_TOP_PER_DAY,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setFilterPrediction = (filterPrediction: boolean) =>
    setSettings((s) => ({ ...s, filterPrediction }));
  const setFilterPredictionThreshold = (filterPredictionThreshold: number) =>
    setSettings((s) => ({ ...s, filterPredictionThreshold }));
  const setUseClusters = (useClusters: boolean) =>
    setSettings((s) => ({ ...s, useClusters }));
  const setFilterMode = (filterMode: FilterMode) =>
    setSettings((s) => ({ ...s, filterMode }));
  const setTopPerDay = (topPerDay: number) =>
    setSettings((s) => ({ ...s, topPerDay }));

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setFilterPrediction,
        setFilterPredictionThreshold,
        setUseClusters,
        setFilterMode,
        setTopPerDay,
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
