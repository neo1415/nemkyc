import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/config/constants';
import { getGuestSessionHeaders } from '@/utils/guestSession';

/**
 * Collected from a guest before their first submission. The backend creates the account from it,
 * binds the submission to the new user, and emails a set-your-password link.
 */
export interface GuestIdentity {
  name: string;
  email: string;
}

export type GuestIdentityResult =
  | { kind: 'guest'; identity: GuestIdentity }
  | { kind: 'signed-in'; email: string };

/** Whether an email already has an account; null when the check could not run. */
export type AccountCheck = (email: string) => Promise<boolean | null>;

interface GuestIdentityDialogProps {
  open: boolean;
  /** Called with `null` when the person dismisses the dialog without finishing. */
  onClose: (result: GuestIdentityResult | null) => void;
  /** Sign an existing account in (the password step). */
  signIn: (email: string, password: string) => Promise<void>;
  /** Email the backend said already has an account; opens straight on the password step. */
  accountExists?: boolean;
  /** Prefill from a previous attempt (for example after the sign-in step). */
  initialIdentity?: Partial<GuestIdentity>;
  busy?: boolean;
  formLabel?: string;
  /** Injected in tests; defaults to POST /api/public/account-status. */
  checkAccount?: AccountCheck;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const checkAccountExists: AccountCheck = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/account-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getGuestSessionHeaders()) },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return typeof result?.exists === 'boolean' ? result.exists : null;
  } catch {
    return null;
  }
};

type Step = 'email' | 'password' | 'name';

/**
 * Email first: an existing account is asked only for its password; a new person is asked for
 * their name, and the backend then creates the account and emails a set-password link.
 */
export function GuestIdentityDialog({
  open,
  onClose,
  signIn,
  accountExists = false,
  initialIdentity,
  busy = false,
  formLabel = 'this form',
  checkAccount = checkAccountExists,
}: GuestIdentityDialogProps) {
  const [step, setStep] = useState<Step>(accountExists ? 'password' : 'email');
  const [name, setName] = useState(initialIdentity?.name ?? '');
  const [email, setEmail] = useState(initialIdentity?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'password', string>>>({});
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(accountExists ? 'password' : 'email');
    setName(initialIdentity?.name ?? '');
    setEmail(initialIdentity?.email ?? '');
    setPassword('');
    setErrors({});
  }, [open, accountExists, initialIdentity?.name, initialIdentity?.email]);

  const disabled = busy || working;
  const normalizedEmail = email.trim().toLowerCase();

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    setErrors({});
    setWorking(true);
    const exists = await checkAccount(normalizedEmail);
    setWorking(false);
    // If the check could not run, ask for the name: the backend still answers ACCOUNT_EXISTS at
    // submission and the hook reopens this dialog on the password step.
    setStep(exists ? 'password' : 'name');
  };

  const submitName = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrors({ name: 'Enter your full name.' });
      return;
    }
    if (trimmed.length > 100) {
      setErrors({ name: 'Name is too long.' });
      return;
    }
    onClose({ kind: 'guest', identity: { name: trimmed, email: normalizedEmail } });
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) {
      setErrors({ password: 'Enter your password.' });
      return;
    }
    setWorking(true);
    setErrors({});
    try {
      await signIn(normalizedEmail, password);
      onClose({ kind: 'signed-in', email: normalizedEmail });
    } catch (error) {
      const message =
        error instanceof Error && /wrong-password|invalid-credential|user-not-found|invalid-login/i.test(error.message)
          ? 'That password does not match this email.'
          : error instanceof Error && error.message
            ? error.message
            : 'Sign-in failed. Please try again.';
      setErrors({ password: message });
    } finally {
      setWorking(false);
    }
  };

  const changeEmail = () => {
    setPassword('');
    setErrors({});
    setStep('email');
  };

  const cancel = (
    <Button type="button" variant="outline" onClick={() => onClose(null)} disabled={disabled}>
      Cancel
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !disabled) onClose(null); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (disabled) e.preventDefault(); }}>
        {step === 'email' && (
          <form onSubmit={submitEmail} noValidate>
            <DialogHeader>
              <DialogTitle>Almost done</DialogTitle>
              <DialogDescription>
                Enter your email to submit {formLabel}. If you already have a NEM Forms account, you will sign in;
                otherwise we will create one and email you your reference number.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="guest-email">Email</Label>
              <Input
                id="guest-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disabled}
                aria-invalid={Boolean(errors.email)}
                autoFocus
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <DialogFooter>
              {cancel}
              <Button type="submit" disabled={disabled}>
                {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Continue
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={submitPassword} noValidate>
            <DialogHeader>
              <DialogTitle>Sign in to submit</DialogTitle>
              <DialogDescription>
                {normalizedEmail} already has a NEM Forms account. Enter its password and {formLabel} will be attached to it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="guest-signin-password">Password</Label>
              <Input
                id="guest-signin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={disabled}
                aria-invalid={Boolean(errors.password)}
                autoFocus
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              <div className="flex justify-between text-sm">
                <button type="button" className="underline text-muted-foreground" onClick={changeEmail} disabled={disabled}>
                  Use a different email
                </button>
                <a href="/auth/reset-password" className="underline text-muted-foreground" target="_blank" rel="noreferrer">
                  Forgot your password?
                </a>
              </div>
            </div>
            <DialogFooter>
              {cancel}
              <Button type="submit" disabled={disabled}>
                {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Sign in and submit
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={submitName} noValidate>
            <DialogHeader>
              <DialogTitle>Your name</DialogTitle>
              <DialogDescription>
                We will create an account for {normalizedEmail} and email your reference number with a link to set your password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="guest-name">Full name</Label>
              <Input
                id="guest-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={disabled}
                aria-invalid={Boolean(errors.name)}
                autoFocus
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              <button type="button" className="text-left text-sm underline text-muted-foreground" onClick={changeEmail} disabled={disabled}>
                Use a different email
              </button>
            </div>
            <DialogFooter>
              {cancel}
              <Button type="submit" disabled={disabled}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default GuestIdentityDialog;
