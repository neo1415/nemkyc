import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormDraft } from '../hooks/useFormDraft';

const draftMocks = vi.hoisted(() => ({
  saveFormDraft: vi.fn(),
  getFormDraft: vi.fn(),
  clearFormDraft: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => draftMocks,
}));

describe('shared form draft persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftMocks.saveFormDraft.mockResolvedValue(undefined);
    draftMocks.getFormDraft.mockResolvedValue(null);
  });

  it('waits for encrypted draft storage and restores every saved field', async () => {
    draftMocks.getFormDraft.mockResolvedValue({
      firstName: 'Daniel',
      lastName: 'Oyeniyi',
      companyName: 'NEM Insurance PLC',
    });
    const formMethods = { setValue: vi.fn() };

    renderHook(() => useFormDraft('individualKYC', formMethods));

    await waitFor(() => expect(formMethods.setValue).toHaveBeenCalledTimes(3));
    expect(formMethods.setValue).toHaveBeenCalledWith(
      'firstName',
      'Daniel',
      { shouldDirty: false },
    );
  });

  it('saves and clears through the shared secure-storage functions', async () => {
    const formMethods = { setValue: vi.fn() };
    const { result } = renderHook(() => useFormDraft('corporateCDD', formMethods));

    act(() => result.current.saveDraft({ companyName: 'Example Limited' }));
    act(() => result.current.clearDraft());

    expect(draftMocks.saveFormDraft).toHaveBeenCalledWith(
      'corporateCDD',
      { companyName: 'Example Limited' },
    );
    expect(draftMocks.clearFormDraft).toHaveBeenCalledWith('corporateCDD');
  });
});
