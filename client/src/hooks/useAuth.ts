/**
 * Authentication Hook
 * Handles wallet-based authentication with backend
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { api, User } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Check existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const { data, error } = await api.getMe();
        
        if (error || !data) {
          api.setToken(null);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        setState({
          user: data,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } catch {
        api.setToken(null);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  // Auto-logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && state.isAuthenticated) {
      logout();
    }
  }, [isConnected, state.isAuthenticated]);

  const login = useCallback(async () => {
    if (!address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

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
        nonceData.nonce
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
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, [address, signMessageAsync]);

  const logout = useCallback(() => {
    api.setToken(null);
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const { data, error } = await api.getMe();
      
      if (error || !data) {
        logout();
        return;
      }

      setState(prev => ({ ...prev, user: data }));
    } catch {
      logout();
    }
  }, [state.isAuthenticated, logout]);

  const updateProfile = useCallback(async (data: { email?: string; name?: string }) => {
    try {
      const { data: updatedUser, error } = await api.updateProfile(data);
      
      if (error || !updatedUser) {
        throw new Error(error || 'Failed to update profile');
      }

      setState(prev => ({ ...prev, user: updatedUser }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return { success: false, error: message };
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshUser,
    updateProfile,
    address,
    isConnected,
  };
}

export default useAuth;
