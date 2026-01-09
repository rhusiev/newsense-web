import { cn } from "~/lib/utils";

interface EmptyStateProps {
    children: React.ReactNode;
    className?: string;
}

export function EmptyState({ children, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "text-center py-10 px-6 text-gray-400 text-sm italic",
                className,
            )}
        >
            {children}
        </div>
    );
}
