
import React, { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Upload, File, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: File | string;
  label?: string;
  required?: boolean;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSize = 10,
  currentFile,
  label,
  required = false,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
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
    if (currentFile instanceof File) {
      return currentFile.name;
    }
    if (typeof currentFile === 'string') {
      return currentFile.split('/').pop() || 'file';
    }
    return null;
  };

  const fileName = getFileName();

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
                  onClick={onFileRemove}
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
                  Max size: {maxSize}MB. Supported: PDF, DOC, DOCX, JPG, PNG
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
