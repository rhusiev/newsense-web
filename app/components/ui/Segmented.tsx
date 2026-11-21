export function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { mode: T; label: string }[];
    value: T;
    onChange: (mode: T) => void;
}) {
    // Four choices need a 2x2 grid on a phone; wider screens keep one row.
    const grid = options.length >= 4 ? "grid grid-cols-2 sm:flex" : "flex";
    return (
        <div
            className={`${grid} gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100`}
        >
            {options.map(({ mode, label }) => (
                <button
                    key={mode}
                    type="button"
                    className={`py-2.5 sm:py-1.5 rounded-lg transition-all font-medium text-sm sm:text-xs
                        ${value === mode ? "bg-white text-brand-900 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"}
                    `}
                    onClick={() => onChange(mode)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
