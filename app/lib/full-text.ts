import { createContext, useContext } from "react";
import type { Item } from "./types";

/** IDs of the user's feeds with full text on. */
export const FullTextFeedsContext = createContext<Set<string>>(new Set());

export function useHasFullText(item: Item) {
    const feeds = useContext(FullTextFeedsContext);
    return item.feed_ids?.some((id) => feeds.has(id)) ?? false;
}
