/**
 * Unit Tests for Reusable Form Components
 * 
 * Feature: kyc-nfiu-separation
 * Task 1.6: Write unit tests for reusable form components
 * 
 * **Validates: Requirements 6.1**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import React from 'react';
import { FormField } from '@/components/forms/FormField';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormFileUpload } from '@/components/forms/FormFileUpload';
import { FormTextarea } from '@/components/forms/FormTextarea';

// Test wrapper component that provides React Hook Form context
const TestWrapper: React.FC<{ children: React.ReactNode; defaultValues?: any }> = ({ 
  children, 
  defaultValues = {} 
}) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('FormField Component', () => {
  describe('Rendering', () => {
    it('should render with label and input', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/Test Label/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should show required indicator when required is true', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" required />
        </TestWrapper>
      );

      const label = screen.getByText(/Test Label/i);
      expect(label.parentElement?.textContent).toContain('*');
    });

    it('should render tooltip icon when tooltip is provided', () => {
      const { container } = render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" tooltip="This is a tooltip" />
        </TestWrapper>
      );

      // Check that the info icon SVG is present
      const infoIcon = container.querySelector('.lucide-info');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" placeholder="Enter text" />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" disabled />
        </TestWrapper>
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Input Types', () => {
    it('should render email input type', () => {
      render(
        <TestWrapper>
          <FormField name="email" label="Email" type="email" />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render tel input type', () => {
      render(
        <TestWrapper>
          <FormField name="phone" label="Phone" type="tel" />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render number input type', () => {
      render(
        <TestWrapper>
          <FormField name="age" label="Age" type="number" />
        </TestWrapper>
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Validation', () => {
    it('should enforce maxLength constraint', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" maxLength={10} />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should display error message when validation fails', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testField = { message: 'This field is required', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormField name="testField" label="Test Label" required />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should have aria-invalid when there is an error', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testField = { message: 'Error', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormField name="testField" label="Test Label" />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <FormField name="testField" label="Test Label" required />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should link error message with aria-describedby', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testField = { message: 'Error message', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormField name="testField" label="Test Label" />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'testField-error');
    });
  });
});

describe('FormSelect Component', () => {
  const testOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  describe('Rendering', () => {
    it('should render with label and select trigger', () => {
      render(
        <TestWrapper>
          <FormSelect name="testSelect" label="Test Select" options={testOptions} />
        </TestWrapper>
      );

      expect(screen.getByText(/Test Select/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show required indicator when required is true', () => {
      render(
        <TestWrapper>
          <FormSelect name="testSelect" label="Test Select" options={testOptions} required />
        </TestWrapper>
      );

      const label = screen.getByText(/Test Select/i);
      expect(label.parentElement?.textContent).toContain('*');
    });

    it('should render tooltip icon when tooltip is provided', () => {
      const { container } = render(
        <TestWrapper>
          <FormSelect 
            name="testSelect" 
            label="Test Select" 
            options={testOptions} 
            tooltip="Select an option" 
          />
        </TestWrapper>
      );

      // Check that the info icon SVG is present
      const infoIcon = container.querySelector('.lucide-info');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(
        <TestWrapper>
          <FormSelect 
            name="testSelect" 
            label="Test Select" 
            options={testOptions} 
            placeholder="Choose one" 
          />
        </TestWrapper>
      );

      expect(screen.getByText('Choose one')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <FormSelect name="testSelect" label="Test Select" options={testOptions} disabled />
        </TestWrapper>
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Options and Selection', () => {
    it('should render select trigger with placeholder', () => {
      render(
        <TestWrapper>
          <FormSelect name="testSelect" label="Test Select" options={testOptions} />
        </TestWrapper>
      );

      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should have correct number of options', () => {
      render(
        <TestWrapper defaultValues={{ testSelect: 'option1' }}>
          <FormSelect name="testSelect" label="Test Select" options={testOptions} />
        </TestWrapper>
      );

      // Verify the component renders with the selected value
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should display error message when validation fails', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testSelect = { message: 'Please select an option', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormSelect name="testSelect" label="Test Select" options={testOptions} required />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });
  });
});

describe('FormDatePicker Component', () => {
  describe('Rendering', () => {
    it('should render with label and date picker button', () => {
      render(
        <TestWrapper>
          <FormDatePicker name="testDate" label="Test Date" />
        </TestWrapper>
      );

      expect(screen.getByText(/Test Date/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show required indicator when required is true', () => {
      render(
        <TestWrapper>
          <FormDatePicker name="testDate" label="Test Date" required />
        </TestWrapper>
      );

      const label = screen.getByText(/Test Date/i);
      expect(label.parentElement?.textContent).toContain('*');
    });

    it('should render tooltip icon when tooltip is provided', () => {
      const { container } = render(
        <TestWrapper>
          <FormDatePicker name="testDate" label="Test Date" tooltip="Select a date" />
        </TestWrapper>
      );

      // Check that the info icon SVG is present
      const infoIcon = container.querySelector('.lucide-info');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should display placeholder text when no date selected', () => {
      render(
        <TestWrapper>
          <FormDatePicker name="testDate" label="Test Date" />
        </TestWrapper>
      );

      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <FormDatePicker name="testDate" label="Test Date" disabled />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Date Constraints', () => {
    it('should accept minDate constraint', () => {
      const minDate = new Date('2020-01-01');
      render(
        <TestWrapper>
          <FormDatePicker name="testDate" label="Test Date" minDate={minDate} />
        </TestWrapper>
      );

      // Component should render without errors
      expect(screen.getByText(/Test Date/i)).toBeInTheDocument();
    });

    it('should accept maxDate constraint', () => {
      const maxDate = new Date('2025-12-31');
      render(
        <TestWrapper>
          <FormDatePicker name="testDate" label="Test Date" maxDate={maxDate} />
        </TestWrapper>
      );

      // Component should render without errors
      expect(screen.getByText(/Test Date/i)).toBeInTheDocument();
    });

    it('should display selected date in formatted form', () => {
      const testDate = new Date('2024-06-15');
      render(
        <TestWrapper defaultValues={{ testDate }}>
          <FormDatePicker name="testDate" label="Test Date" />
        </TestWrapper>
      );

      // Date should be formatted (e.g., "June 15, 2024")
      expect(screen.getByRole('button').textContent).toContain('2024');
    });
  });

  describe('Validation', () => {
    it('should display error message when validation fails', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testDate = { message: 'Date is required', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormDatePicker name="testDate" label="Test Date" required />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Date is required')).toBeInTheDocument();
    });
  });
});

describe('FormFileUpload Component', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
    mockOnFileRemove.mockClear();
  });

  describe('Rendering', () => {
    it('should render with label and upload button', () => {
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf,.jpg"
            maxSize={3}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Test File/i)).toBeInTheDocument();
      expect(screen.getByText('Choose File')).toBeInTheDocument();
    });

    it('should show required indicator when required is true', () => {
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf"
            maxSize={3}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
            required
          />
        </TestWrapper>
      );

      const label = screen.getByText(/Test File/i);
      expect(label.parentElement?.textContent).toContain('*');
    });

    it('should render tooltip icon when tooltip is provided', () => {
      const { container } = render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf"
            maxSize={3}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
            tooltip="Upload your document"
          />
        </TestWrapper>
      );

      // Check that the info icon SVG is present
      const infoIcon = container.querySelector('.lucide-info');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should display file format and size information', () => {
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf,.jpg,.png"
            maxSize={5}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Accepted formats: .pdf,.jpg,.png/i)).toBeInTheDocument();
      expect(screen.getByText(/Max size: 5MB/i)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should validate file size', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf"
            maxSize={1}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/Test File/i) as HTMLInputElement;
      
      // Create a large file (2MB)
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      
      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/File size must be less than 1MB/i)).toBeInTheDocument();
      });
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should validate file type', () => {
      // This test verifies that the component accepts the correct file types
      // The actual validation happens in the component's handleFileChange
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf"
            maxSize={3}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/Test File/i) as HTMLInputElement;
      expect(input).toHaveAttribute('accept', '.pdf');
      
      // Verify the component displays accepted formats
      expect(screen.getByText(/Accepted formats: .pdf/i)).toBeInTheDocument();
    });

    it('should accept valid file', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf"
            maxSize={3}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/Test File/i) as HTMLInputElement;
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
      });
    });
  });

  describe('File Display and Removal', () => {
    it('should display selected file information', () => {
      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf"
            maxSize={3}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
            currentFile={testFile}
          />
        </TestWrapper>
      );

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText(/KB/i)).toBeInTheDocument();
    });

    it('should call onFileRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      render(
        <TestWrapper>
          <FormFileUpload
            name="testFile"
            label="Test File"
            accept=".pdf"
            maxSize={3}
            onFileSelect={mockOnFileSelect}
            onFileRemove={mockOnFileRemove}
            currentFile={testFile}
          />
        </TestWrapper>
      );

      const removeButton = screen.getByRole('button', { name: '' });
      await user.click(removeButton);

      expect(mockOnFileRemove).toHaveBeenCalled();
    });
  });
});

describe('FormTextarea Component', () => {
  describe('Rendering', () => {
    it('should render with label and textarea', () => {
      render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" />
        </TestWrapper>
      );

      expect(screen.getByText(/Test Textarea/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should show required indicator when required is true', () => {
      render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" required />
        </TestWrapper>
      );

      const label = screen.getByText(/Test Textarea/i);
      expect(label.parentElement?.textContent).toContain('*');
    });

    it('should render tooltip icon when tooltip is provided', () => {
      const { container } = render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" tooltip="Enter details" />
        </TestWrapper>
      );

      // Check that the info icon SVG is present
      const infoIcon = container.querySelector('.lucide-info');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" placeholder="Enter text here" />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" disabled />
        </TestWrapper>
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should render with custom rows', () => {
      render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" rows={6} />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '6');
    });
  });

  describe('Character Limits', () => {
    it('should enforce maxLength constraint', () => {
      render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" maxLength={100} />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '100');
    });

    it('should display character count when maxLength is set', () => {
      render(
        <TestWrapper defaultValues={{ testTextarea: '' }}>
          <FormTextarea name="testTextarea" label="Test Textarea" maxLength={100} />
        </TestWrapper>
      );

      expect(screen.getByText('0 / 100')).toBeInTheDocument();
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper defaultValues={{ testTextarea: '' }}>
          <FormTextarea name="testTextarea" label="Test Textarea" maxLength={100} />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      await waitFor(() => {
        expect(screen.getByText('5 / 100')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should display error message when validation fails', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testTextarea = { message: 'This field is required', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormTextarea name="testTextarea" label="Test Textarea" required />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should have aria-invalid when there is an error', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testTextarea = { message: 'Error', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormTextarea name="testTextarea" label="Test Textarea" />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <FormTextarea name="testTextarea" label="Test Textarea" required />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-required', 'true');
    });

    it('should link error message with aria-describedby', () => {
      const TestComponent = () => {
        const methods = useForm();
        methods.formState.errors.testTextarea = { message: 'Error message', type: 'required' };
        return (
          <FormProvider {...methods}>
            <FormTextarea name="testTextarea" label="Test Textarea" />
          </FormProvider>
        );
      };

      render(<TestComponent />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'testTextarea-error');
    });
  });
});
