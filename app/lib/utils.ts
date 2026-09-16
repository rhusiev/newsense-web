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
