'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { api, User } from '@/lib/api';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    login: () => Promise<{ success: boolean; user?: User; isNewUser?: boolean; error?: string }>;
    adminLogin: (
        email: string,
        password: string,
    ) => Promise<{ success: boolean; user?: User; error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateProfile: (data: { email?: string; name?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const router = useRouter();

    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
    });

    // Define logout function first (used in useEffect below)
    const logout = useCallback(() => {
        api.setToken(null);
        setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
        });
        router.push('/');
    }, [router]);

    // Check existing authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = api.getToken();

            if (!token) {
                setState((prev) => ({ ...prev, isLoading: false }));
                return;
            }

            try {
                const { data, error } = await api.getMe();

                if (error || !data) {
                    api.setToken(null);
                    setState((prev) => ({ ...prev, isLoading: false }));
                    return;
                }

                setState({
                    user: data,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });
            } catch (err: any) {
                // Only clear token if it's an authentication error (401)
                // This prevents redirect loops on temporary network errors
                if (err?.status === 401 || err?.message?.includes('401')) {
                    api.setToken(null);
                }
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        };

        checkAuth();
    }, []);

    // Auto-logout when wallet disconnects (only for wallet-based auth, not admin email/password)
    // Admin users can stay logged in even without wallet connection
    useEffect(() => {
        if (!isConnected && state.isAuthenticated && state.user) {
            // Only auto-logout if user logged in via wallet (has walletAddress matching connected address)
            // Admin users with email/password login should not be logged out
            const token = api.getToken();
            if (token && state.user.role !== 'ADMIN' && state.user.role !== 'SUPER_ADMIN') {
                // Only logout regular users, not admins
                logout();
            }
        }
    }, [isConnected, state.isAuthenticated, state.user, logout]);

    /**
     * Admin login with email/password
     * Sets token and updates auth state directly
     */
    const adminLogin = useCallback(
        async (email: string, password: string) => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const { data, error } = await api.adminLogin(email, password);

                if (error || !data) {
                    throw new Error(error || 'Login failed');
                }

                // Store token
                api.setToken(data.token);

                // Update state immediately with the user data
                setState({
                    user: data.user,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });

                return { success: true, user: data.user };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Login failed';
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: message,
                }));
                return { success: false, error: message };
            }
        },
        [],
    );

    /**
     * Wallet-based login
     */
    const login = useCallback(async () => {
        if (!address) {
            setState((prev) => ({ ...prev, error: 'Wallet not connected' }));
            return { success: false, error: 'Wallet not connected' };
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // Get nonce from server
            const { data: nonceData, error: nonceError } = await api.getNonce(address);

            if (nonceError || !nonceData) {
                throw new Error(nonceError || 'Failed to get nonce');
            }

            // Sign the nonce message
            const signature = await signMessageAsync({ message: nonceData.nonce });

            // Login with signature
            const { data: loginData, error: loginError } = await api.login(
                address,
                signature,
                nonceData.nonce,
            );

            if (loginError || !loginData) {
                throw new Error(loginError || 'Login failed');
            }

            // Store token and update state
            api.setToken(loginData.token);

            setState({
                user: loginData.user,
                isLoading: false,
                isAuthenticated: true,
                error: null,
            });

            return { success: true, user: loginData.user, isNewUser: loginData.isNewUser };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Authentication failed';
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: message,
            }));
            return { success: false, error: message };
        }
    }, [address, signMessageAsync]);

    const refreshUser = useCallback(async () => {
        if (!state.isAuthenticated) return;

        try {
            const { data, error } = await api.getMe();

            if (error || !data) {
                logout();
                return;
            }

            setState((prev) => ({ ...prev, user: data }));
        } catch (err: any) {
            // Only logout on auth error
            if (err?.status === 401 || err?.message?.includes('401')) {
                logout();
            }
        }
    }, [state.isAuthenticated, logout]);

    const updateProfile = useCallback(async (data: { email?: string; name?: string }) => {
        try {
            const { data: updatedUser, error } = await api.updateProfile(data);

            if (error || !updatedUser) {
                throw new Error(error || 'Failed to update profile');
            }

            setState((prev) => ({ ...prev, user: updatedUser }));
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Update failed';
            return { success: false, error: message };
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                adminLogin,
                logout,
                refreshUser,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
