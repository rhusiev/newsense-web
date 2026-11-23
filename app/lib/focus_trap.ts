import { useEffect, type RefObject } from "react";

const SELECTOR = [
    "a[href]", "button:not([disabled])", "input:not([disabled])",
    "select:not([disabled])", "textarea:not([disabled])", "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Keep Tab inside an open overlay and restore focus when it closes. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
    useEffect(() => {
        if (!enabled) return;
        const previous = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Tab" || !ref.current) return;
            const items = [...ref.current.querySelectorAll<HTMLElement>(SELECTOR)]
                .filter((item) => item.offsetParent !== null);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            previous?.focus();
        };
    }, [ref, enabled]);
}
