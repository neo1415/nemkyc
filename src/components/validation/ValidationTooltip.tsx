/**
 * ValidationTooltip Component
 * 
 * Displays a tooltip on disabled navigation buttons showing which fields
 * need to be corrected before the user can proceed.
 * 
 * Keyboard accessible: The tooltip is associated with the button via aria-describedby
 * and will be announced when the button receives focus.
 * 
 * Requirements: 6.3, 17.4, 17.5
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ValidationTooltipProps {
  /** Whether to show the tooltip */
  show: boolean;
  /** Main message to display */
  message: string;
  /** List of field labels that are mismatched */
  mismatchedFields: string[];
  /** ID for aria-describedby association */
  id?: string;
}

/**
 * ValidationTooltip Component
 * 
 * Renders a tooltip with a list of fields that need correction.
 * Appears on disabled navigation buttons to explain why navigation is blocked.
 * Keyboard accessible via aria-describedby on the associated button.
 */
export const ValidationTooltip: React.FC<ValidationTooltipProps> = ({
  show,
  message,
  mismatchedFields,
  id = 'validation-tooltip'
}) => {
  // Don't render if not shown or no mismatched fields
  if (!show || mismatchedFields.length === 0) {
    return null;
  }

  return (
    <div
      id={id}
      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
      role="tooltip"
      aria-live="polite"
    >
      <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs">
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
          <div className="border-8 border-transparent border-t-gray-900"></div>
        </div>

        {/* Tooltip content */}
        <div className="flex items-start">
          <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-400" aria-hidden="true" />
          <div>
            <p className="font-medium mb-1">{message}</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              {mismatchedFields.map((fieldLabel, index) => (
                <li key={index}>{fieldLabel}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationTooltip;
