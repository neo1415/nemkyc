import React, { useRef, useState } from 'react';
import { CheckCircle2, Circle, FileUp, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ClaimBlock, OutstandingDocument } from '@/lib/claimLifecycle';
import { uploadFile } from '@/services/fileService';
import { markDocumentProvided } from '@/services/claimsApi';
import { formatDate } from '@/utils/dateFormatter';

interface OutstandingDocumentsProps {
  collection: string;
  id: string;
  claim: ClaimBlock;
  /** Receives the updated claim block after a document is marked as provided. */
  onUpdated?: (claim: ClaimBlock) => void;
  className?: string;
}

const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '_');

const OutstandingDocuments: React.FC<OutstandingDocumentsProps> = ({ collection, id, claim, onUpdated, className }) => {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const documents = claim.outstandingDocuments || [];
  if (documents.length === 0) return null;

  const received = documents.filter(d => d.receivedAt).length;

  const handleFile = async (document: OutstandingDocument, file: File | undefined) => {
    if (!file) return;
    setUploadingKey(document.key);
    try {
      const path = `${collection}/${id}/outstanding/${document.key}-${Date.now()}-${safeFileName(file.name)}`;
      const url = await uploadFile(file, path);
      const response = await markDocumentProvided(collection, id, document.key, url);
      onUpdated?.(response.claim);
      toast.success(`${document.label} uploaded`, { description: 'Thank you. Our claims team has been notified.' });
    } catch (error) {
      console.error('Outstanding document upload failed:', error);
      toast.error(`Could not upload ${document.label}`, {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setUploadingKey(null);
      const input = inputRefs.current[document.key];
      if (input) input.value = '';
    }
  };

  return (
    <Card className={cn('shadow-sm', className)} data-testid="outstanding-documents">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[#800020] flex items-center gap-2">
          <FileUp className="h-5 w-5" aria-hidden="true" />
          Documents for your claim
        </CardTitle>
        <CardDescription>
          {received} of {documents.length} received. Upload anything still outstanding to keep your claim moving.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-gray-100">
          {documents.map(document => {
            const isReceived = Boolean(document.receivedAt);
            const isUploading = uploadingKey === document.key;
            return (
              <li
                key={document.key}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                data-testid={`outstanding-document-${document.key}`}
                data-received={isReceived ? 'true' : 'false'}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {isReceived ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" aria-label="Received" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" aria-label="Not yet received" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn('text-sm font-medium', isReceived ? 'text-gray-700' : 'text-gray-900')}>{document.label}</p>
                      {document.required ? (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-[#800020] text-[#800020]">Required</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-gray-500">Optional</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isReceived
                        ? `Received ${formatDate(document.receivedAt, { includeTime: true })}`
                        : document.requestedAt
                          ? `Requested ${formatDate(document.requestedAt)}`
                          : 'Awaiting upload'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isReceived && document.url && (
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#800020] hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                  {!isReceived && document.required && (
                    <>
                      <input
                        ref={el => { inputRefs.current[document.key] = el; }}
                        type="file"
                        className="sr-only"
                        id={`outstanding-upload-${document.key}`}
                        data-testid={`outstanding-upload-input-${document.key}`}
                        onChange={event => handleFile(document, event.target.files?.[0])}
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white"
                        disabled={isUploading}
                        onClick={() => inputRefs.current[document.key]?.click()}
                        data-testid={`outstanding-upload-${document.key}`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" /> Uploading
                          </>
                        ) : (
                          <>
                            <FileUp className="h-4 w-4 mr-1" aria-hidden="true" /> Upload
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default OutstandingDocuments;
