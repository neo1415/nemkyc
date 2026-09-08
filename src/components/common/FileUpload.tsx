
import React, { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: File | string;
  label?: string;
  required?: boolean;
  error?: string;
  documentType?: 'cac' | 'nin' | 'document';
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10,
  currentFile,
  label,
  required = false,
  error,
  documentType = 'document'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptedMimeTypes = new Set(
    accept.split(',').map(value => value.trim().toLowerCase()).flatMap(value => {
      switch (value) {
        case '.jpg':
        case '.jpeg': return ['image/jpeg', 'image/jpg'];
        case '.png': return ['image/png'];
        case '.gif': return ['image/gif'];
        case '.pdf': return ['application/pdf'];
        case '.doc': return ['application/msword'];
        case '.docx': return ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        case 'image/*': return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        default: return value.includes('/') ? [value] : [];
      }
    })
  );

  const getDetailedErrorMessage = (errorType: string, details?: any) => {
    switch (errorType) {
      case 'INVALID_TYPE':
        return {
          title: 'Invalid File Format',
          description: `This form accepts: ${accept}. Please choose one of those file formats.`,
          suggestions: [
            'Use PDF for scanned documents',
            'Use PNG or JPG for photos',
            'Avoid HEIC, WEBP, or other formats'
          ]
        };
      case 'FILE_TOO_LARGE':
        return {
          title: 'File Too Large',
          description: `Your file is larger than ${maxSize}MB. Please reduce the file size.`,
          suggestions: [
            'Compress your PDF using online tools',
            'Reduce image quality when scanning',
            'Split large documents into smaller files'
          ]
        };
      case 'CORRUPTED_FILE':
        return {
          title: 'File Cannot Be Read',
          description: 'The file appears to be corrupted or damaged.',
          suggestions: [
            'Try uploading the file again',
            'Re-scan or re-photograph the document',
            'Check that the file opens correctly on your device'
          ]
        };
      default:
        return {
          title: 'Upload Failed',
          description: 'There was an error uploading your file. Please try again.',
          suggestions: [
            'Check your internet connection',
            'Try uploading a different file',
            'Contact support if the problem persists'
          ]
        };
    }
  };

  const showDetailedError = (errorType: string, details?: any) => {
    const errorInfo = getDetailedErrorMessage(errorType, details);
    
    toast({
      title: errorInfo.title,
      description: errorInfo.description,
      variant: 'destructive',
      duration: 8000,
    });
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!acceptedMimeTypes.has(file.type.toLowerCase())) {
      showDetailedError('INVALID_TYPE');
      return;
    }
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      showDetailedError('FILE_TOO_LARGE');
      return;
    }
    
    // Try to validate file integrity (basic check)
    if (file.size === 0) {
      showDetailedError('CORRUPTED_FILE');
      return;
    }
    
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getFileName = () => {
    if (currentFile && typeof currentFile === 'object' && 'name' in currentFile) {
      return currentFile.name;
    }
    if (typeof currentFile === 'string') {
      return currentFile.split('/').pop() || 'file';
    }
    return null;
  };

  const fileName = getFileName();

  const removeFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileRemove?.();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <Card className={cn(
        "border-2 border-dashed transition-colors",
        dragOver ? "border-red-900 bg-red-50" : "border-gray-300",
        error ? "border-red-500" : ""
      )}>
        <CardContent className="p-6">
          {fileName ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <File className="h-5 w-5 text-red-900" />
                <span className="text-sm font-medium text-gray-900">{fileName}</span>
                <Check className="h-4 w-4 text-green-600" />
              </div>
              {onFileRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div
              className="text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <p className="mt-2 text-sm text-gray-600">
                  or drag and drop your file here
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Max size: {maxSize}MB. Supported: {accept}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
