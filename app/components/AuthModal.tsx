import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth-context";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { LogIn, UserPlus } from "lucide-react";

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

    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setError("");
            setUsername("");
            setPassword("");
        }
    }, [isOpen, initialView]);

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={view === "login" ? "Welcome Back" : "Join Reader"}
        >
            <div className="px-6 pt-6">
                <div className="flex gap-2 w-full">
                    <button
                        className={`flex-1 p-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm
                            ${view === "login" ? "bg-brand-surface-active text-brand-900" : "text-gray-400 hover:text-brand-900 hover:bg-gray-50"}
                        `}
                        onClick={() => setView("login")}
                    >
                        <LogIn size={18} />
                        <span>Sign In</span>
                    </button>
                    <button
                        className={`flex-1 p-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm
                            ${view === "register" ? "bg-brand-surface-active text-brand-900" : "text-gray-400 hover:text-brand-900 hover:bg-gray-50"}
                        `}
                        onClick={() => setView("register")}
                    >
                        <UserPlus size={18} />
                        <span>Register</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                />

                <Button
                    className="w-full mt-2"
                    isLoading={loading}
                    type="submit"
                >
                    {view === "login" ? "Sign In" : "Create Account"}
                </Button>
            </form>
        </Modal>
    );
}
