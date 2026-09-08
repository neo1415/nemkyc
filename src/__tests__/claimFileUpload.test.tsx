import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileUpload from '../components/common/FileUpload';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('claim file picker', () => {
  it('accepts Word documents when the form advertises them', () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <FileUpload onFileSelect={onFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['claim evidence'], 'evidence.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('lets the customer remove a selected file and choose another', () => {
    const onFileRemove = vi.fn();
    const { rerender } = render(
      <FileUpload
        onFileSelect={vi.fn()}
        onFileRemove={onFileRemove}
        currentFile={new File(['old'], 'wrong.pdf', { type: 'application/pdf' })}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onFileRemove).toHaveBeenCalledOnce();

    rerender(<FileUpload onFileSelect={vi.fn()} onFileRemove={onFileRemove} />);
    expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument();
  });
});
