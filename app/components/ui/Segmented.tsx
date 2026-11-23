export function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { mode: T; label: string }[];
    value: T;
    onChange: (mode: T) => void;
}) {
    const wide = options.length >= 4;
    return (
        <div
            className={`flex flex-wrap gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-100 ${
                wide ? "sm:grid sm:grid-cols-4" : ""
            }`}
        >
            {options.map(({ mode, label }) => (
                <button
                    key={mode}
                    type="button"
                    className={`flex-1 min-w-[7rem] px-3 py-3 rounded-lg transition-all font-medium text-sm
                        ${value === mode ? "bg-white text-brand-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-800"}
                    `}
                    onClick={() => onChange(mode)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
