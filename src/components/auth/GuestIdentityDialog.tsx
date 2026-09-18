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

interface GuestIdentityDialogProps {
  open: boolean;
  /** Called with `null` when the person dismisses the dialog without finishing. */
  onClose: (result: GuestIdentityResult | null) => void;
  /**
   * Sign an existing account in. Only invoked when `accountExists` is true, i.e. after the backend
   * refused a guest submission because the email already belongs to an account.
   */
  signIn: (email: string, password: string) => Promise<void>;
  /** Email the backend said already has an account; switches the dialog to its password step. */
  accountExists?: boolean;
  /** Prefill from a previous attempt (for example after the sign-in step). */
  initialIdentity?: Partial<GuestIdentity>;
  busy?: boolean;
  formLabel?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(identity: GuestIdentity): Partial<Record<keyof GuestIdentity, string>> {
  const errors: Partial<Record<keyof GuestIdentity, string>> = {};
  const name = identity.name.trim();
  const email = identity.email.trim();
  if (name.length < 2) errors.name = 'Enter your full name.';
  else if (name.length > 100) errors.name = 'Name is too long.';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  return errors;
}

export function GuestIdentityDialog({
  open,
  onClose,
  signIn,
  accountExists = false,
  initialIdentity,
  busy = false,
  formLabel = 'this form',
}: GuestIdentityDialogProps) {
  const [name, setName] = useState(initialIdentity?.name ?? '');
  const [email, setEmail] = useState(initialIdentity?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'password', string>>>({});
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialIdentity?.name ?? '');
    setEmail(initialIdentity?.email ?? '');
    setPassword('');
    setErrors({});
  }, [open, initialIdentity?.name, initialIdentity?.email]);

  const disabled = busy || signingIn;

  const submitGuest = (event: React.FormEvent) => {
    event.preventDefault();
    const identity = { name: name.trim(), email: email.trim().toLowerCase() };
    const validation = validate(identity);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    onClose({ kind: 'guest', identity });
  };

  const submitSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    if (!password) {
      setErrors({ password: 'Enter your password.' });
      return;
    }
    setSigningIn(true);
    setErrors({});
    try {
      await signIn(trimmedEmail, password);
      onClose({ kind: 'signed-in', email: trimmedEmail });
    } catch (error) {
      const message =
        error instanceof Error && /wrong-password|invalid-credential|user-not-found|invalid-login/i.test(error.message)
          ? 'That password does not match this email.'
          : error instanceof Error && error.message
            ? error.message
            : 'Sign-in failed. Please try again.';
      setErrors({ password: message });
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !disabled) onClose(null); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (disabled) e.preventDefault(); }}>
        {accountExists ? (
          <form onSubmit={submitSignIn} noValidate>
            <DialogHeader>
              <DialogTitle>Sign in to continue</DialogTitle>
              <DialogDescription>
                {email} already has a NEM Forms account. Enter its password so we can attach {formLabel} to it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="guest-signin-email">Email</Label>
                <Input
                  id="guest-signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="grid gap-2">
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
                <a href="/auth/reset-password" className="text-sm underline text-muted-foreground" target="_blank" rel="noreferrer">
                  Forgot your password?
                </a>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose(null)} disabled={disabled}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled}>
                {signingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Sign in and submit
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={submitGuest} noValidate>
            <DialogHeader>
              <DialogTitle>Almost done</DialogTitle>
              <DialogDescription>
                Tell us who is submitting {formLabel}. We will email your reference number and a link to set a password so you can track it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
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
              </div>
              <div className="grid gap-2">
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
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose(null)} disabled={disabled}>
                Cancel
              </Button>
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
