import { forwardRef, type ButtonHTMLAttributes } from "react";
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
            ...props
        },
        ref,
    ) => {
        const baseStyles =
            "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e3415] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

        const variants = {
            primary:
                "bg-[#0e3415] text-white hover:bg-[#587e5b] shadow-sm border border-transparent",
            secondary:
                "bg-[#eef5ef] text-[#0e3415] hover:bg-[#dcebdd] border border-transparent",
            outline:
                "border border-gray-200 bg-white text-gray-700 hover:border-[#587e5b] hover:text-[#0e3415]",
            ghost: "text-gray-500 hover:bg-gray-100 hover:text-[#0e3415] bg-transparent",
            danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-9 px-4 py-2 text-sm",
            lg: "h-11 px-8 text-base",
            icon: "h-9 w-9 p-0",
            "icon-sm": "h-7 w-7 p-0",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className,
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <Loader2 size={16} className="animate-spin mr-2" />
                )}
                {children}
            </button>
        );
    },
);
Button.displayName = "Button";
