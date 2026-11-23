import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GuestIdentityDialog } from '../components/auth/GuestIdentityDialog';
import { validateDateOfBirth } from '../pages/auth/ResetPasswordConfirm';

vi.mock('../utils/guestSession', () => ({ getGuestSessionHeaders: vi.fn().mockResolvedValue({}) }));

const renderDialog = (checkAccount: (email: string) => Promise<boolean | null>) => {
  const onClose = vi.fn();
  const signIn = vi.fn().mockResolvedValue(undefined);
  render(<GuestIdentityDialog open onClose={onClose} signIn={signIn} checkAccount={checkAccount} formLabel="Individual KYC" />);
  return { onClose, signIn };
};

const enterEmail = (email: string) => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
};

describe('guest submit dialog (email first)', () => {
  it('asks an existing account only for its password, never its name', async () => {
    const { onClose, signIn } = renderDialog(vi.fn().mockResolvedValue(true));
    enterEmail('Ade@Example.com');

    await screen.findByLabelText('Password');
    expect(screen.queryByLabelText('Full name')).toBeNull();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in and submit' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledWith({ kind: 'signed-in', email: 'ade@example.com' }));
    expect(signIn).toHaveBeenCalledWith('ade@example.com', 'secret-pass');
  });

  it('asks a new person for their name and returns a guest identity', async () => {
    const { onClose } = renderDialog(vi.fn().mockResolvedValue(false));
    enterEmail('new@example.com');

    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Ada Obi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onClose).toHaveBeenCalledWith({ kind: 'guest', identity: { name: 'Ada Obi', email: 'new@example.com' } });
  });

  it('falls back to the name step when the account check cannot run', async () => {
    renderDialog(vi.fn().mockResolvedValue(null));
    enterEmail('someone@example.com');
    expect(await screen.findByLabelText('Full name')).toBeTruthy();
  });

  it('rejects an invalid email before checking anything', async () => {
    const checkAccount = vi.fn();
    renderDialog(checkAccount);
    enterEmail('not-an-email');
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
    expect(checkAccount).not.toHaveBeenCalled();
  });
});

describe('date of birth on account setup', () => {
  it('requires a real date for someone aged 18 or over', () => {
    expect(validateDateOfBirth('')).toMatch(/Enter your date of birth/);
    expect(validateDateOfBirth('1990-05-22')).toBeNull();
    const today = new Date();
    const seventeen = `${today.getFullYear() - 17}-01-01`;
    expect(validateDateOfBirth(seventeen)).toMatch(/at least 18/);
    expect(validateDateOfBirth('1800-01-01')).toMatch(/valid date/);
  });
});
