import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "~/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onClear?: () => void;
    containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, value, onClear, ...props }, ref) => {
        return (
            <div
                className={cn(
                    "relative w-full flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-brand-accent focus-within:ring-1 focus-within:ring-brand-accent/20 transition-all",
                    containerClassName,
                )}
            >
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    className={cn(
                        "bg-transparent border-none outline-none w-full text-sm text-brand-900 placeholder:text-gray-400 h-6",
                        !onClear ? "pr-0" : "pr-6",
                        className,
                    )}
                    {...props}
                />
                {value && onClear ? (
                    <button
                        onClick={onClear}
                        type="button"
                        className="absolute right-2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={14} />
                    </button>
                ) : (
                    <div className="absolute right-3 pointer-events-none text-gray-400">
                        <Search size={14} />
                    </div>
                )}
            </div>
        );
    },
);
SearchInput.displayName = "SearchInput";
