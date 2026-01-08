import { useState } from "react";
import { useAuth } from "~/lib/auth-context";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={view === "login" ? "Welcome Back" : "Join Reader"}
        >
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

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-600">
                <button
                    onClick={() =>
                        setView(view === "login" ? "register" : "login")
                    }
                    className="text-brand-600 font-medium hover:underline"
                >
                    {view === "login"
                        ? "Don't have an account? Sign up"
                        : "Already have an account? Log in"}
                </button>
            </div>
        </Modal>
    );
}
