import { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchableSectionHeaderProps {
    title: string;
    compact?: boolean;
    onSearch: (value: string) => void;
}

export function SearchableSectionHeader({
    title,
    compact = false,
    onSearch,
}: SearchableSectionHeaderProps) {
    const [isSearching, setIsSearching] = useState(false);

    const handleClear = () => {
        setIsSearching(false);
        onSearch("");
    };

    return (
        <div
            className={`flex items-center justify-between pr-4 ${compact ? "pl-2" : "pl-6"} h-8 mb-1`}
        >
            {!isSearching ? (
                <>
                    <span
                        className={`${compact ? "text-gray-500" : "text-[#587e5b]"} uppercase tracking-wider text-xs font-bold`}
                    >
                        {title}
                    </span>
                    <button
                        onClick={() => setIsSearching(true)}
                        className="text-gray-300 hover:text-[#587e5b]"
                    >
                        <Search size={14} />
                    </button>
                </>
            ) : (
                <div className="flex items-center w-full relative animate-in fade-in duration-200">
                    <input
                        className="w-full text-xs bg-transparent border-b border-[#587e5b] focus:outline-none pb-0.5 text-[#0e3415] placeholder-gray-300"
                        placeholder={`Filter ${title}...`}
                        autoFocus
                        onBlur={(e) => {
                            if (!e.target.value) handleClear();
                        }}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                    <button
                        onClick={handleClear}
                        className="absolute right-0 text-gray-400 hover:text-red-500"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
