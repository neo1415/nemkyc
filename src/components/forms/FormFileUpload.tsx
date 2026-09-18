import React, { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILE_ACCEPT, MAX_FILE_SIZE_MB, getFileExtension, isAllowedFile } from '@/config/filePolicy';

export interface FormFileUploadProps {
  name: string;
  label: string;
  required?: boolean;
  /** Narrower list of formats for this field; never wider than the shared policy. */
  accept?: string;
  /** Size ceiling in MB; capped at the shared policy maximum. */
  maxSize?: number;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  currentFile?: File;
  tooltip?: string;
}

export const FormFileUpload: React.FC<FormFileUploadProps> = ({
  name,
  label,
  required = false,
  accept = FILE_ACCEPT,
  maxSize: requestedMaxSize,
  onFileSelect,
  onFileRemove,
  currentFile,
  tooltip,
}) => {
  const maxSize = Math.min(
    typeof requestedMaxSize === 'number' && requestedMaxSize > 0 ? requestedMaxSize : MAX_FILE_SIZE_MB,
    MAX_FILE_SIZE_MB,
  );
  const {
    formState: { errors },
    setValue,
  } = useFormContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Shared policy first: anything the backend would reject is rejected here.
    const policy = isAllowedFile(file);
    if (!policy.ok) {
      setUploadError(policy.reason ?? 'Please choose a valid document');
      return;
    }

    // Then this field's (possibly narrower) accept list and size ceiling.
    const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const fileExtension = getFileExtension(file.name);
    if (!acceptedTypes.includes(fileExtension) && !acceptedTypes.includes(file.type.toLowerCase())) {
      setUploadError(`File type must be one of: ${accept}`);
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploadError('');
    onFileSelect(file);
    setValue(name, file, { shouldValidate: true });
  };

  const handleRemove = () => {
    setUploadError('');
    onFileRemove();
    setValue(name, null, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={name}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-invalid={!!error || !!uploadError}
        aria-describedby={error || uploadError ? `${name}-error` : undefined}
        aria-required={required}
      />

      {!currentFile ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className={cn(
            'w-full',
            (error || uploadError) && 'border-red-500'
          )}
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose File
        </Button>
      ) : (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{currentFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(currentFile.size / 1024).toFixed(1)} KB
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {(errorMessage || uploadError) && (
        <p
          id={`${name}-error`}
          className="text-sm text-red-500"
          role="alert"
        >
          {errorMessage || uploadError}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Accepted formats: {accept} • Max size: {maxSize}MB
      </p>
    </div>
  );
};
