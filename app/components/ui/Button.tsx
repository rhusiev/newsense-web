import {
    forwardRef,
    type ButtonHTMLAttributes,
    useState,
    useRef,
    useEffect,
} from "react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className = "",
            variant = "primary",
            size = "md",
            isLoading,
            children,
            title,
            ...props
        },
        ref,
    ) => {
        const [showTooltip, setShowTooltip] = useState(false);
        const [tooltipPos, setTooltipPos] = useState<"top" | "bottom">("top");
        const [tooltipAlign, setTooltipAlign] = useState<
            "center" | "left" | "right"
        >("center");

        const internalRef = useRef<HTMLButtonElement>(null);
        const longPressTimer = useRef<NodeJS.Timeout | null>(null);
        const closeTimer = useRef<NodeJS.Timeout | null>(null);

        const baseStyles =
            "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] relative";

        const variants = {
            primary:
                "bg-brand-900 text-white hover:bg-brand-accent active:bg-brand-accent shadow-sm border border-transparent",
            secondary:
                "bg-brand-surface-active text-brand-900 hover:bg-brand-surface-active-hover active:bg-brand-surface-active-hover border border-transparent",
            outline:
                "border border-gray-200 bg-white text-gray-700 hover:border-brand-accent hover:text-brand-900 active:bg-gray-50",
            ghost: "text-gray-500 hover:bg-gray-100 hover:text-brand-900 active:bg-gray-200 bg-transparent",
            danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-9 px-4 py-2 text-sm",
            lg: "h-11 px-8 text-base",
            icon: "h-9 w-9 p-0",
            "icon-sm": "h-7 w-7 p-0",
        };

        const setRefs = (element: HTMLButtonElement) => {
            internalRef.current = element;
            if (typeof ref === "function") ref(element);
            else if (ref) (ref as any).current = element;
        };

        useEffect(() => {
            if (!showTooltip) return;

            const handleOutsideInteraction = () => {
                setShowTooltip(false);
                if (closeTimer.current) clearTimeout(closeTimer.current);
            };

            window.addEventListener("scroll", handleOutsideInteraction, true);
            window.addEventListener("touchstart", handleOutsideInteraction);

            return () => {
                window.removeEventListener(
                    "scroll",
                    handleOutsideInteraction,
                    true,
                );
                window.removeEventListener(
                    "touchstart",
                    handleOutsideInteraction,
                );
            };
        }, [showTooltip]);

        const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
            if (props.onTouchStart) props.onTouchStart(e);
            if (!title) return;

            if (closeTimer.current) clearTimeout(closeTimer.current);

            longPressTimer.current = setTimeout(() => {
                if (internalRef.current) {
                    const rect = internalRef.current.getBoundingClientRect();
                    const screenWidth = window.innerWidth;
                    const centerX = rect.left + rect.width / 2;

                    setTooltipPos(rect.top < 80 ? "bottom" : "top");

                    if (centerX < 80) {
                        setTooltipAlign("left");
                    } else if (screenWidth - centerX < 80) {
                        setTooltipAlign("right");
                    } else {
                        setTooltipAlign("center");
                    }
                }

                setShowTooltip(true);
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                    navigator.vibrate(20);
                }
            }, 500);
        };

        const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
            if (props.onTouchEnd) props.onTouchEnd(e);
            if (longPressTimer.current) clearTimeout(longPressTimer.current);

            if (showTooltip) {
                closeTimer.current = setTimeout(
                    () => setShowTooltip(false),
                    1500,
                );
            }
        };

        const handleTouchMove = () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setShowTooltip(false);
        };

        return (
            <button
                ref={setRefs}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className,
                )}
                disabled={isLoading || props.disabled}
                title={title}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onContextMenu={(e) => {
                    if (showTooltip) e.preventDefault();
                }}
                {...props}
            >
                {isLoading && (
                    <Loader2 size={16} className="animate-spin mr-2" />
                )}
                {children}

                {showTooltip && (
                    <div
                        className={cn(
                            "absolute px-2 py-1 bg-gray-900/95 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100",
                            tooltipPos === "top"
                                ? "bottom-full mb-2"
                                : "top-full mt-2",
                            tooltipAlign === "center" &&
                                "left-1/2 -translate-x-1/2",
                            tooltipAlign === "left" && "left-0",
                            tooltipAlign === "right" && "right-0",
                        )}
                    >
                        {title}
                        <div
                            className={cn(
                                "absolute border-4 border-transparent",
                                tooltipPos === "top"
                                    ? "top-full -mt-[1px] border-t-gray-900/95"
                                    : "bottom-full -mb-[1px] border-b-gray-900/95",
                                tooltipAlign === "center" &&
                                    "left-1/2 -translate-x-1/2",
                                tooltipAlign === "left" && "left-4",
                                tooltipAlign === "right" && "right-4",
                            )}
                        />
                    </div>
                )}
            </button>
        );
    },
);
Button.displayName = "Button";
