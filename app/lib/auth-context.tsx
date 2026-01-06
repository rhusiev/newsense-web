import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "~/lib/api";
import type { User } from "~/lib/types";
import { useNavigate } from "react-router";

interface AuthContextType {
    user: User | null;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
    children,
    initialUser,
}: {
    children: ReactNode;
    initialUser: User | null;
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const navigate = useNavigate();

    const login = async (data: any) => {
        const res = await api.login(data);
        setUser(res);
        navigate(0);
    };

    const register = async (data: any) => {
        const res = await api.register(data);
        setUser(res);
        navigate(0);
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
        navigate(0);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
