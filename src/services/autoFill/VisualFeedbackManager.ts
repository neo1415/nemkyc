/**
 * VisualFeedbackManager Service
 * 
 * This service provides real-time visual feedback during verification and auto-fill operations.
 * It manages loading indicators, success/error messages, auto-fill markers, and field states.
 */

import { ErrorType } from '../../types/autoFill';

/**
 * VisualFeedbackManager class
 * 
 * Provides methods to show/hide visual feedback elements
 */
export class VisualFeedbackManager {
  private loadingElements: Map<HTMLElement, HTMLElement> = new Map();

  /**
   * Shows a loading indicator on the identifier field
   * 
   * Creates a spinner element and appends it to the field's parent container.
   * Also disables the field to prevent changes during verification.
   * 
   * @param fieldElement - The identifier field element
   */
  showLoading(fieldElement: HTMLInputElement): void {
    // Disable the field
    this.disableField(fieldElement);

    // Add loading class
    fieldElement.classList.add('auto-fill-loading');

    // Create loading spinner
    const spinner = document.createElement('span');
    spinner.className = 'auto-fill-spinner';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', 'Verifying...');
    spinner.innerHTML = '⏳'; // Simple loading indicator

    // Insert spinner after the field
    if (fieldElement.parentElement) {
      fieldElement.parentElement.insertBefore(spinner, fieldElement.nextSibling);
      this.loadingElements.set(fieldElement, spinner);
    }
  }

  /**
   * Hides the loading indicator
   * 
   * Removes the spinner element and re-enables the field.
   * 
   * @param fieldElement - The identifier field element
   */
  hideLoading(fieldElement: HTMLInputElement): void {
    // Remove loading class
    fieldElement.classList.remove('auto-fill-loading');

    // Remove spinner
    const spinner = this.loadingElements.get(fieldElement);
    if (spinner && spinner.parentElement) {
      spinner.parentElement.removeChild(spinner);
      this.loadingElements.delete(fieldElement);
    }

    // Re-enable the field
    this.enableField(fieldElement);
  }

  /**
   * Shows a success message
   * 
   * Displays a toast notification indicating successful auto-fill
   * and the number of fields that were populated.
   * 
   * @param message - Success message to display
   * @param populatedFieldCount - Number of fields that were populated
   */
  showSuccess(message: string, populatedFieldCount: number): void {
    const fullMessage = `${message} (${populatedFieldCount} field${populatedFieldCount !== 1 ? 's' : ''} populated)`;
    this.showToast(fullMessage, 'success');
  }

  /**
   * Shows an error message
   * 
   * Displays a toast notification with error details.
   * The message style varies based on error type.
   * 
   * @param message - Error message to display
   * @param errorType - Type of error that occurred
   */
  showError(message: string, errorType: ErrorType): void {
    this.showToast(message, 'error');
  }

  /**
   * Marks a field as auto-filled
   * 
   * Adds visual indicators (CSS class, data attribute, icon) to show
   * that the field was populated by auto-fill.
   * 
   * @param fieldElement - The field element to mark
   */
  markFieldAutoFilled(fieldElement: HTMLInputElement): void {
    fieldElement.classList.add('auto-filled');
    fieldElement.setAttribute('data-auto-filled', 'true');
    fieldElement.setAttribute('title', 'Auto-filled from verified data');
  }

  /**
   * Removes the auto-fill marker from a field
   * 
   * Removes visual indicators when the user edits an auto-filled field.
   * 
   * @param fieldElement - The field element to unmark
   */
  removeAutoFillMarker(fieldElement: HTMLInputElement): void {
    fieldElement.classList.remove('auto-filled');
    fieldElement.removeAttribute('data-auto-filled');
    fieldElement.removeAttribute('title');
  }

  /**
   * Disables a field
   * 
   * Prevents user interaction with the field during verification.
   * 
   * @param fieldElement - The field element to disable
   */
  disableField(fieldElement: HTMLInputElement): void {
    fieldElement.disabled = true;
    fieldElement.classList.add('auto-fill-disabled');
  }

  /**
   * Enables a field
   * 
   * Re-enables user interaction with the field after verification.
   * 
   * @param fieldElement - The field element to enable
   */
  enableField(fieldElement: HTMLInputElement): void {
    fieldElement.disabled = false;
    fieldElement.classList.remove('auto-fill-disabled');
  }

  /**
   * Shows a toast notification
   * 
   * Creates and displays a temporary notification message.
   * The toast automatically disappears after 5 seconds.
   * 
   * @param message - Message to display
   * @param type - Type of toast ('success' or 'error')
   */
  private showToast(message: string, type: 'success' | 'error'): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `auto-fill-toast auto-fill-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    // Add to document
    document.body.appendChild(toast);

    // Remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 5000);
  }

  /**
   * Clears all visual feedback
   * 
   * Removes all loading indicators, toasts, and auto-fill markers.
   * Useful for cleanup when navigating away from a form.
   */
  clearAll(): void {
    // Remove all loading indicators
    this.loadingElements.forEach((spinner, field) => {
      if (spinner.parentElement) {
        spinner.parentElement.removeChild(spinner);
      }
      this.enableField(field as HTMLInputElement);
    });
    this.loadingElements.clear();

    // Remove all toasts
    const toasts = document.querySelectorAll('.auto-fill-toast');
    toasts.forEach(toast => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    });

    // Remove all auto-fill markers
    const autoFilledFields = document.querySelectorAll('.auto-filled');
    autoFilledFields.forEach(field => {
      field.classList.remove('auto-filled');
      field.removeAttribute('data-auto-filled');
      field.removeAttribute('title');
    });
  }
}
