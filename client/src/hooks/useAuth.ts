/**
 * Authentication Hook
 * Wrapper around AuthContext for backward compatibility and convenience
 */

'use client';

import { useAccount } from 'wagmi';
import { useAuthContext } from '@/context/AuthContext';

export function useAuth() {
  const auth = useAuthContext();
  const { address, isConnected } = useAccount();

  return {
    ...auth,
    address,
    isConnected,
  };
}

export default useAuth;
