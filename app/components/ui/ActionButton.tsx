import type { LucideIcon } from "lucide-react";

interface ActionButtonProps {
    icon: LucideIcon;
    active: boolean;
    activeClass?: string;
    defaultClass?: string;
    onClick: () => void;
    title: string;
    shouldFill?: boolean;
    size?: number;
    className?: string;
}

export function ActionButton({
    icon: Icon,
    active,
    activeClass = "bg-white text-emerald-600 shadow-sm",
    defaultClass = "text-slate-400 hover:text-emerald-600 hover:bg-slate-100",
    onClick,
    title,
    shouldFill = true,
    size = 16,
    className = "",
}: ActionButtonProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            title={title}
            className={`
                p-1.5 rounded-md transition-all duration-200
                ${active ? activeClass : defaultClass}
                ${className}
            `}
        >
            <Icon
                size={size}
                strokeWidth={active ? 2.5 : 2}
                fill={active && shouldFill ? "currentColor" : "none"}
            />
        </button>
    );
}
