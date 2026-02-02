import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helpText, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "w-full px-3 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all placeholder:text-gray-400 text-brand-950",
                        error ? "border-red-500" : "border-gray-200",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                        className,
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                {helpText && !error && (
                    <p className="text-[10px] text-gray-400">{helpText}</p>
                )}
            </div>
        );
    },
);
Input.displayName = "Input";
