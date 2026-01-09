import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "~/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={cn(
                        "w-full px-3 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all placeholder:text-gray-400 text-brand-950 resize-none",
                        error ? "border-red-500" : "border-gray-200",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                        className,
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    },
);
Textarea.displayName = "Textarea";
