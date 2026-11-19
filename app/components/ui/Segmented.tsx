export function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { mode: T; label: string }[];
    value: T;
    onChange: (mode: T) => void;
}) {
    return (
        <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
            {options.map(({ mode, label }) => (
                <button
                    key={mode}
                    className={`flex-1 py-1.5 rounded-lg transition-all font-medium text-xs
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
