import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { SearchInput } from "../ui/SearchInput";

interface SearchableSectionHeaderProps {
    title: string;
    onSearch: (value: string) => void;
    searchValue: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    collapsible?: boolean;
}

export function SearchableSectionHeader({
    title,
    onSearch,
    searchValue,
    isExpanded,
    onToggleExpand,
    collapsible = false,
}: SearchableSectionHeaderProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isExpanded) {
            setIsSearchOpen(false);
        }
    }, [isExpanded]);

    const handleSearchToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSearchOpen) {
            setIsSearchOpen(false);
            onSearch("");
        } else {
            setIsSearchOpen(true);
        }
    };

    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    return (
        <div className="flex flex-col px-6 py-2">
            <div className="flex items-center justify-between h-7">
                <div
                    className={`flex items-center group select-none ${collapsible ? "cursor-pointer" : ""}`}
                    onClick={() => collapsible && onToggleExpand()}
                >
                    {collapsible && (
                        <span className="mr-2 text-gray-500 group-hover:text-[#587e5b] transition-colors p-0.5 rounded">
                            {isExpanded ? (
                                <ChevronDown size={14} strokeWidth={3} />
                            ) : (
                                <ChevronRight size={14} strokeWidth={3} />
                            )}
                        </span>
                    )}
                    <span className="text-[#587e5b] uppercase tracking-wider text-xs font-bold group-hover:text-[#0e3415] transition-colors">
                        {title}
                    </span>
                </div>

                {isExpanded && (
                    <button
                        onClick={handleSearchToggle}
                        className={`transition-colors p-1 rounded-md ml-2 ${
                            isSearchOpen
                                ? "text-brand-700 bg-brand-50"
                                : "text-gray-300 hover:text-[#587e5b] hover:bg-gray-100"
                        }`}
                        title={isSearchOpen ? "Close search" : "Search"}
                    >
                        {isSearchOpen ? <X size={14} /> : <Search size={14} />}
                    </button>
                )}
            </div>

            <div
                className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
                    isSearchOpen
                        ? "grid-rows-[1fr] opacity-100 mt-2 mb-1"
                        : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
            >
                <div className="overflow-hidden p-[1px]">
                    <SearchInput
                        ref={inputRef}
                        value={searchValue}
                        onChange={(e) => onSearch(e.target.value)}
                        onClear={() => onSearch("")}
                        placeholder={`Filter ${title.toLowerCase()}...`}
                    />
                </div>
            </div>
        </div>
    );
}
