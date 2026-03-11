// Example integration of Gemini Document Verification system

import React, { useState, useEffect } from 'react';
import { DocumentUploadSection } from '../components/gemini/DocumentUploadSection';
import { formSubmissionController } from '../services/geminiFormSubmissionController';
import { 
  FormVerificationState, 
  SubmissionEligibility, 
  VerificationResult 
} from '../types/geminiDocumentVerification';

interface ExampleFormProps {
  formType: 'nfiu' | 'kyc';
  formSubtype: 'individual' | 'corporate';
}

export const GeminiDocumentVerificationExample: React.FC<ExampleFormProps> = ({
  formType,
  formSubtype
}) => {
  const [formId] = useState(() => `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [userId] = useState('example-user-123');
  const [verificationState, setVerificationState] = useState<FormVerificationState | null>(null);
  const [eligibility, setEligibility] = useState<SubmissionEligibility | null>(null);
  const [formData, setFormData] = useState({
    // Example form data
    companyName: 'Example Company Limited',
    rcNumber: 'RC123456',
    address: '123 Example Street, Lagos',
    fullName: 'John Doe',
    nin: '12345678901',
    dateOfBirth: '1990-01-01'
  });

  // Initialize form session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const state = await formSubmissionController.initializeFormSession(
          formId,
          userId,
          formType,
          formData
        );
        setVerificationState(state);
        
        // Check initial eligibility
        const initialEligibility = await formSubmissionController.checkSubmissionEligibility(formId);
        setEligibility(initialEligibility);
      } catch (error) {
        console.error('Failed to initialize form session:', error);
      }
    };

    initializeSession();
  }, [formId, userId, formType]);

  // Handle verification completion
  const handleVerificationComplete = async (documentType: string, result: VerificationResult) => {
    try {
      // Update verification state
      const updatedState = await formSubmissionController.updateDocumentVerification(
        formId,
        documentType,
        result
      );
      setVerificationState(updatedState);

      // Check updated eligibility
      const updatedEligibility = await formSubmissionController.checkSubmissionEligibility(formId);
      setEligibility(updatedEligibility);

      console.log(`${documentType} verification completed:`, result);
    } catch (error) {
      console.error('Failed to handle verification completion:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!eligibility?.canSubmit) {
      alert('Form cannot be submitted. Please resolve all issues first.');
      return;
    }

    try {
      // In a real application, this would submit the form data
      console.log('Form submitted successfully!', {
        formId,
        formData,
        verificationState
      });
      
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Form submission failed:', error);
      alert('Form submission failed. Please try again.');
    }
  };

  if (!verificationState || !eligibility) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Initializing form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {formType.toUpperCase()} {formSubtype} Form
        </h1>
        <p className="text-gray-600">
          Complete document verification to submit your form
        </p>
      </div>

      {/* Form Data Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formSubtype === 'corporate' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RC Number
                </label>
                <input
                  type="text"
                  value={formData.rcNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, rcNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          
          {formSubtype === 'individual' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIN
                </label>
                <input
                  type="text"
                  value={formData.nin}
                  onChange={(e) => setFormData(prev => ({ ...prev, nin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Document Verification Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Document Verification</h2>
        
        {/* CAC Document Upload (for corporate forms) */}
        {formSubtype === 'corporate' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              CAC Certificate Verification
            </h3>
            <DocumentUploadSection
              formId={formId}
              documentType="cac"
              formData={formData}
              onVerificationComplete={(result) => handleVerificationComplete('cac', result)}
            />
          </div>
        )}

        {/* Individual Document Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Identity Document Verification
          </h3>
          <DocumentUploadSection
            formId={formId}
            documentType="individual"
            formData={formData}
            onVerificationComplete={(result) => handleVerificationComplete('individual', result)}
          />
        </div>
      </div>

      {/* Submission Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Status</h2>
        
        <div className="space-y-4">
          {/* Verification Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Document Verifications</h3>
            <div className="space-y-2">
              {verificationState.documentVerifications.map((verification, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    verification.status === 'verified' ? 'bg-green-500' :
                    verification.status === 'failed' ? 'bg-red-500' :
                    verification.status === 'processing' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`} />
                  <span className="text-sm text-gray-700 capitalize">
                    {verification.documentType} Document: {verification.status}
                  </span>
                  {verification.result && (
                    <span className="text-xs text-gray-500">
                      ({verification.result.confidence}% confidence)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Blocking Reasons */}
          {eligibility.blockingReasons.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Issues to Resolve</h3>
              <ul className="space-y-1">
                {eligibility.blockingReasons.map((reason, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-start space-x-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{reason.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Actions */}
          {eligibility.requiredActions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Required Actions</h3>
              <ul className="space-y-1">
                {eligibility.requiredActions.map((action, index) => (
                  <li key={index} className="text-sm text-blue-600 flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{action.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSubmit}
              disabled={!eligibility.canSubmit}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                eligibility.canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {eligibility.canSubmit ? 'Submit Form' : 'Complete Verification to Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Information (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify({ verificationState, eligibility }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};