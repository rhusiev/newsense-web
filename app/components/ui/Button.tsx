import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
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
            "inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
            primary: "bg-brand-950 text-white hover:bg-brand-600",
            secondary: "bg-brand-50 text-brand-950 hover:bg-brand-100",
            outline:
                "border border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600",
            ghost: "text-gray-600 hover:bg-gray-100 hover:text-brand-950",
            danger: "text-red-600 hover:bg-red-50",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base",
            icon: "p-2",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isLoading}
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
