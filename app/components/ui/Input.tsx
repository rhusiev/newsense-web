import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <input
                {...props}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all ${
                    error ? "border-red-500" : "border-gray-200"
                }`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
