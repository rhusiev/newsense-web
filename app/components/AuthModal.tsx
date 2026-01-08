import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "~/lib/auth-context";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: "login" | "register";
}

export function AuthModal({
    isOpen,
    onClose,
    initialView = "login",
}: AuthModalProps) {
    const { login, register } = useAuth();
    const [view, setView] = useState<"login" | "register">(initialView);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (view === "login") {
                await login({ username, password, remember_me: true });
            } else {
                await register({ username, password });
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-serif text-xl text-[#0e3415]">
                        {view === "login" ? "Welcome Back" : "Join Reader"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#587e5b] transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#587e5b] transition-colors"
                            required
                            minLength={8}
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-2.5 bg-[#0e3415] text-white rounded-lg font-medium hover:bg-[#587e5b] transition-colors flex justify-center items-center gap-2 mt-2"
                    >
                        {loading && (
                            <Loader2 size={16} className="animate-spin" />
                        )}
                        {view === "login" ? "Sign In" : "Create Account"}
                    </button>
                </form>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-600">
                    {view === "login"
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button
                        onClick={() => {
                            setError("");
                            setView(view === "login" ? "register" : "login");
                        }}
                        className="text-[#587e5b] font-medium hover:underline"
                    >
                        {view === "login" ? "Sign up" : "Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
