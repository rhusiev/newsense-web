export function Badge({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={`bg-brand-600 rounded-full px-1.5 py-0.5 text-white text-[10px] font-bold min-w-[20px] text-center shadow-sm ${className}`}
        >
            {children}
        </span>
    );
}
