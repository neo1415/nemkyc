import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Download, Upload, Eye, CheckSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';

interface FlowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed?: boolean;
  current?: boolean;
}

interface VerificationFlowChartProps {
  currentStep?: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  isFloating?: boolean;
  onClose?: () => void;
}

export const VerificationFlowChart: React.FC<VerificationFlowChartProps> = ({ 
  currentStep = 0, 
  className = '',
  orientation = 'horizontal',
  isFloating = false,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!isVisible) return null;
  const steps: FlowStep[] = [
    {
      id: 1,
      title: 'Download Template',
      description: 'Get the Excel template',
      icon: <Download className="w-4 h-4" />,
    },
    {
      id: 2,
      title: 'Upload File',
      description: 'Upload your filled template',
      icon: <Upload className="w-4 h-4" />,
    },
    {
      id: 3,
      title: 'Review Data',
      description: 'Check uploaded information',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      id: 4,
      title: 'Select Customers',
      description: 'Choose entries to verify',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      id: 5,
      title: 'Send Requests',
      description: 'Request NIN or CAC verification',
      icon: <Send className="w-4 h-4" />,
    },
  ];

  const isHorizontal = orientation === 'horizontal';
  const ChevronIcon = isHorizontal ? ChevronRight : ChevronDown;

  const baseClasses = `bg-white border border-gray-200 rounded-lg p-4 ${className}`;
  const floatingClasses = isFloating 
    ? 'fixed right-4 top-20 z-40 shadow-xl transition-all duration-300 ease-in-out' 
    : '';

  // Collapsed state for floating flowchart
  if (isFloating && isCollapsed) {
    return (
      <div className={`${baseClasses} ${floatingClasses} w-12 h-12 p-2 cursor-pointer hover:bg-gray-50`}
           onClick={handleToggleCollapse}>
        <div className="flex items-center justify-center h-full">
          <Maximize2 className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${floatingClasses} ${isFloating ? 'max-w-xs' : 'w-full'}`}>
      {/* Header with controls for floating version */}
      {isFloating && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-900">Verification Process</h3>
          <div className="flex gap-1">
            <button
              onClick={handleToggleCollapse}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="Minimize flowchart"
            >
              <Minimize2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="Close flowchart"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Title for non-floating version */}
      {!isFloating && (
        <h3 className="text-sm font-medium text-gray-900 mb-3">Verification Process</h3>
      )}
      
      <div className={`flex ${isHorizontal ? 'items-center justify-center space-x-4 min-w-max' : 'flex-col space-y-3'}`}>
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div className={`flex ${isHorizontal ? 'flex-col' : 'flex-row'} items-center ${isHorizontal ? 'min-w-0' : 'w-full'}`}>
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isHorizontal ? '' : 'flex-shrink-0'}
                    ${isCompleted 
                      ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                      : isCurrent 
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                        : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                    }
                  `}
                >
                  {step.icon}
                </div>
                <div className={`${isHorizontal ? 'mt-2 text-center min-w-0' : 'ml-3 text-left flex-1'}`}>
                  <p className={`text-xs font-medium ${
                    isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className={`text-xs text-gray-400 ${isHorizontal ? 'whitespace-nowrap' : 'max-w-full'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <ChevronIcon className={`${isHorizontal ? 'w-4 h-4 flex-shrink-0' : 'w-4 h-4 mx-auto'} ${
                  isCompleted ? 'text-green-400' : 'text-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default VerificationFlowChart;