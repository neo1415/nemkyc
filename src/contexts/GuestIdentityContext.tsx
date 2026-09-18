import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GuestIdentityDialog, type GuestIdentity, type GuestIdentityResult } from '@/components/auth/GuestIdentityDialog';

export interface RequestGuestIdentityOptions {
  formLabel?: string;
  /** The backend refused a guest submission because this email already has an account. */
  accountExists?: boolean;
  initialIdentity?: Partial<GuestIdentity>;
}

interface GuestIdentityContextValue {
  /**
   * Opens the guest identity dialog and resolves with what the person chose:
   * a guest identity, a completed sign-in, or null if they dismissed it.
   * Mounted once in App so form pages and hooks never render the dialog themselves.
   */
  requestGuestIdentity: (options?: RequestGuestIdentityOptions) => Promise<GuestIdentityResult | null>;
}

const GuestIdentityContext = createContext<GuestIdentityContextValue>({
  requestGuestIdentity: async () => {
    console.warn('GuestIdentityProvider is not mounted; guest submissions are unavailable.');
    return null;
  },
});

export function GuestIdentityProvider({ children }: { children: React.ReactNode }) {
  const { signIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RequestGuestIdentityOptions>({});
  const resolverRef = useRef<((result: GuestIdentityResult | null) => void) | null>(null);

  const requestGuestIdentity = useCallback((next: RequestGuestIdentityOptions = {}) => {
    // A second request while one is open resolves the first as dismissed.
    resolverRef.current?.(null);
    return new Promise<GuestIdentityResult | null>((resolve) => {
      resolverRef.current = resolve;
      setOptions(next);
      setOpen(true);
    });
  }, []);

  const handleClose = useCallback((result: GuestIdentityResult | null) => {
    setOpen(false);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(result);
  }, []);

  const value = useMemo(() => ({ requestGuestIdentity }), [requestGuestIdentity]);

  return (
    <GuestIdentityContext.Provider value={value}>
      {children}
      <GuestIdentityDialog
        open={open}
        onClose={handleClose}
        signIn={signIn}
        accountExists={options.accountExists}
        initialIdentity={options.initialIdentity}
        formLabel={options.formLabel}
      />
    </GuestIdentityContext.Provider>
  );
}

export function useGuestIdentity() {
  return useContext(GuestIdentityContext);
}
