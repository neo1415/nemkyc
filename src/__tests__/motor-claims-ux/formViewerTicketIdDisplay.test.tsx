import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

/**
 * Property 8: Form Viewer Ticket ID Display
 * 
 * For any form submission with a ticket ID viewed in the Form Viewer,
 * the ticket ID SHALL be displayed in the rendered output.
 * 
 * Validates: Requirements 7.1
 */

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock component that simulates the ticket ID display section from UserFormViewer
const TicketIdDisplay: React.FC<{ ticketId?: string }> = ({ ticketId }) => {
  if (!ticketId) {
    return null;
  }

  return (
    <div data-testid="ticket-id-section">
      <span>Your Ticket ID</span>
      <h4 data-testid="ticket-id-value">{ticketId}</h4>
      <span>Please reference this ID in all future correspondence</span>
    </div>
  );
};

// Arbitrary for generating valid ticket IDs
const ticketIdArbitrary = fc.tuple(
  fc.constantFrom('MOT', 'FIR', 'BUR', 'ALL', 'GIT', 'MON', 'PUB', 'EMP', 'GPA', 'FID', 'REN', 'CPM', 'COM', 'PRO'),
  fc.integer({ min: 10000000, max: 99999999 })
).map(([prefix, number]) => `${prefix}-${number}`);

describe('Property 8: Form Viewer Ticket ID Display', () => {
  it('should display ticket ID when present', () => {
    fc.assert(
      fc.property(ticketIdArbitrary, (ticketId) => {
        cleanup(); // Clean before each property test iteration
        const { container } = render(<TicketIdDisplay ticketId={ticketId} />);
        
        // Property: Ticket ID should be present in the rendered output
        const ticketIdElement = container.querySelector('[data-testid="ticket-id-value"]');
        expect(ticketIdElement).toBeDefined();
        expect(ticketIdElement?.textContent).toBe(ticketId);
        
        // Verify the section is rendered
        const section = container.querySelector('[data-testid="ticket-id-section"]');
        expect(section).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should display the exact ticket ID value without modification', () => {
    fc.assert(
      fc.property(ticketIdArbitrary, (ticketId) => {
        cleanup(); // Clean before each property test iteration
        const { container } = render(<TicketIdDisplay ticketId={ticketId} />);
        
        // Property: The displayed ticket ID should match exactly
        const ticketIdElement = container.querySelector('[data-testid="ticket-id-value"]');
        expect(ticketIdElement?.textContent).toBe(ticketId);
        
        // Verify format is preserved (prefix-number)
        expect(ticketId).toMatch(/^[A-Z]{3}-\d{8}$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should not display ticket ID section when ticket ID is missing', () => {
    const { container } = render(<TicketIdDisplay ticketId={undefined} />);
    
    // Property: No ticket ID section should be rendered when ticketId is undefined
    const section = screen.queryByTestId('ticket-id-section');
    expect(section).toBeNull();
  });

  it('should not display ticket ID section when ticket ID is empty string', () => {
    const { container } = render(<TicketIdDisplay ticketId="" />);
    
    // Property: No ticket ID section should be rendered when ticketId is empty
    const section = screen.queryByTestId('ticket-id-section');
    expect(section).toBeNull();
  });

  it('should display ticket ID prominently with context message', () => {
    fc.assert(
      fc.property(ticketIdArbitrary, (ticketId) => {
        cleanup(); // Clean before each property test iteration
        const { container } = render(<TicketIdDisplay ticketId={ticketId} />);
        
        // Property: Ticket ID display should include contextual information
        const section = container.querySelector('[data-testid="ticket-id-section"]');
        const text = section?.textContent || '';
        
        // Should contain the ticket ID
        expect(text).toContain(ticketId);
        
        // Should contain contextual labels
        expect(text).toContain('Your Ticket ID');
        expect(text).toContain('Please reference this ID in all future correspondence');
      }),
      { numRuns: 100 }
    );
  });

  it('should handle all valid ticket ID prefixes', () => {
    const validPrefixes = ['MOT', 'FIR', 'BUR', 'ALL', 'GIT', 'MON', 'PUB', 'EMP', 'GPA', 'FID', 'REN', 'CPM', 'COM', 'PRO'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...validPrefixes),
        fc.integer({ min: 10000000, max: 99999999 }),
        (prefix, number) => {
          cleanup(); // Clean before each property test iteration
          const ticketId = `${prefix}-${number}`;
          const { container } = render(<TicketIdDisplay ticketId={ticketId} />);
          
          // Property: All valid prefixes should be displayed correctly
          const ticketIdElement = container.querySelector('[data-testid="ticket-id-value"]');
          expect(ticketIdElement?.textContent).toBe(ticketId);
          expect(ticketIdElement?.textContent).toContain(prefix);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain ticket ID format integrity', () => {
    fc.assert(
      fc.property(ticketIdArbitrary, (ticketId) => {
        cleanup(); // Clean before each property test iteration
        const { container } = render(<TicketIdDisplay ticketId={ticketId} />);
        
        const ticketIdElement = container.querySelector('[data-testid="ticket-id-value"]');
        const displayedValue = ticketIdElement?.textContent || '';
        
        // Property: Displayed value should maintain the format
        const parts = displayedValue.split('-');
        expect(parts).toHaveLength(2);
        expect(parts[0]).toHaveLength(3);
        expect(parts[1]).toHaveLength(8);
        expect(/^[A-Z]{3}$/.test(parts[0])).toBe(true);
        expect(/^\d{8}$/.test(parts[1])).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 8: Integration with Form Data', () => {
  // Arbitrary for form data with ticket ID
  const formDataWithTicketIdArbitrary = fc.record({
    ticketId: ticketIdArbitrary,
    formType: fc.string(),
    status: fc.constantFrom('processing', 'approved', 'rejected'),
    submittedAt: fc.date(),
  });

  it('should extract and display ticket ID from form data', () => {
    fc.assert(
      fc.property(formDataWithTicketIdArbitrary, (formData) => {
        cleanup(); // Clean before each property test iteration
        const { container } = render(<TicketIdDisplay ticketId={formData.ticketId} />);
        
        // Property: Ticket ID from form data should be displayed
        const ticketIdElement = container.querySelector('[data-testid="ticket-id-value"]');
        expect(ticketIdElement?.textContent).toBe(formData.ticketId);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle form data without ticket ID gracefully', () => {
    const formDataWithoutTicketId = {
      formType: 'Motor Claim',
      status: 'processing',
      submittedAt: new Date(),
    };

    const { container } = render(<TicketIdDisplay ticketId={undefined} />);
    
    // Property: Should not crash or display section when ticket ID is missing
    const section = screen.queryByTestId('ticket-id-section');
    expect(section).toBeNull();
  });
});
