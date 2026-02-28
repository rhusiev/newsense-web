import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth, AuthProvider } from "~/lib/auth-context";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { UserPlus, ArrowLeft } from "lucide-react";
import { api, BASE_URL } from "~/lib/api";
import { data } from "react-router";
import type { Route } from "./+types/code-register";

export async function loader({ request }: Route.LoaderArgs) {
    const cookie = request.headers.get("Cookie");
    try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
            headers: {
                Cookie: cookie || "",
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) return { user: null };
        const user = await response.json();
        return data({ user });
    } catch (error) {
        return { user: null };
    }
}

export default function CodeRegisterRoute({ loaderData }: Route.ComponentProps) {
    return (
        <AuthProvider initialUser={loaderData?.user ?? null}>
            <CodeRegisterContent />
        </AuthProvider>
    );
}

function CodeRegisterContent() {
    const { code } = useParams();
    const { registerWithCode, user } = useAuth();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        
        setError("");
        setLoading(true);

        try {
            await registerWithCode(code, { username, password });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <button 
                    onClick={() => navigate("/")}
                    className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8 text-center bg-brand-surface-active border-b border-gray-100">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-brand-200">
                            <UserPlus size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Join via Invitation</h1>
                        <p className="text-gray-600 mt-2">Create your account to get started</p>
                        {code && (
                            <div className="mt-4 inline-block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-mono text-gray-500">
                                Code: {code}
                            </div>
                        )}
                    </div>

                    <div className="p-8">
                        {success ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Welcome!</h2>
                                <p className="text-gray-600 mt-1">Redirecting you to home...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <Input
                                    label="Username"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-12 text-lg"
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="h-12 text-lg"
                                />

                                <Button
                                    className="w-full h-12 text-lg mt-6 shadow-lg shadow-brand-100"
                                    isLoading={loading}
                                    type="submit"
                                >
                                    Create Account
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
                
                <p className="text-center mt-8 text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Reader. All rights reserved.
                </p>
            </div>
        </div>
    );
}
