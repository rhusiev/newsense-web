import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function stripHtml(html: string | null | undefined): string {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "");
}

export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
}

export function isWithinDays(
    isoDate: string | null | undefined,
    days: number,
): boolean {
    if (!isoDate) return false;
    const parsed = new Date(isoDate).getTime();
    if (Number.isNaN(parsed)) return false;
    return Date.now() - parsed < days * 24 * 60 * 60 * 1000;
}

/** The server groups top stories by the reader's day, so it needs the browser's zone. */
export function browserTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** The link when it is a web address, else undefined, so a feed cannot plant a
 *  `javascript:` link. The server stores only http links; older rows may not be. */
export function safeHref(link: string | undefined | null): string | undefined {
    if (!link) return undefined;
    try {
        const { protocol } = new URL(link);
        return protocol === "http:" || protocol === "https:" ? link : undefined;
    } catch {
        return undefined;
    }
}
