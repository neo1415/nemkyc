import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Download, ArrowLeft, Loader2, Hash, Calendar } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import ClaimProgress from '../../components/claims/ClaimProgress';
import ClaimTimeline from '../../components/claims/ClaimTimeline';
import OfferCard from '../../components/claims/OfferCard';
import OutstandingDocuments from '../../components/claims/OutstandingDocuments';
import { resolveClaimBlock, type ClaimBlock } from '../../lib/claimLifecycle';
import { isClaimCollection } from '../../lib/submissionFamilies';
import { downloadDynamicPDF } from '../../services/dynamicPdfService';
import { FORM_MAPPINGS, FormField } from '../../config/formMappings';
import { downloadSubmissionDocument } from '../../services/secureDocumentService';
import { formatDate as formatDateUtil } from '../../utils/dateFormatter';

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};
const statusBadgeClass = (status: unknown) =>
  STATUS_BADGE[String(status || '').toLowerCase()] || 'bg-yellow-100 text-yellow-800 border-yellow-300';

interface FormFieldWithValue extends FormField {
  value: any;
  section: string;
}

const normalizeFieldKey = (key: string) => key.replace(/[^a-z0-9]/gi, '').toLowerCase();

const FIELD_ALIASES: Record<string, string[]> = {
  firstname: ['firstName', 'firstname', 'first_name', 'givenName'],
  lastname: ['lastName', 'lastname', 'last_name', 'surname'],
  middlename: ['middleName', 'middlename', 'middle_name'],
  email: ['email', 'emailAddress', 'email_address'],
  emailaddress: ['emailAddress', 'email', 'email_address'],
  phonenumber: ['phoneNumber', 'telephoneNumber', 'contactPersonNo', 'mobileNumber', 'gsmNumber'],
  telephonenumber: ['telephoneNumber', 'phoneNumber', 'contactPersonNo', 'mobileNumber'],
  nin: ['nin', 'NIN', 'ninNumber', 'NINNumber'],
  ninnumber: ['NINNumber', 'ninNumber', 'nin', 'NIN'],
  bvn: ['bvn', 'BVN', 'bvnNumber', 'BVNNumber'],
  bvnnumber: ['BVNNumber', 'bvnNumber', 'bvn', 'BVN'],
  companyname: ['companyName', 'insured', 'nameOfInsured', 'organizationName'],
  insured: ['insured', 'companyName', 'nameOfInsured', 'fullName'],
  incorporationnumber: ['incorporationNumber', 'cacNumber', 'rcNumber', 'registrationNumber'],
  cacnumber: ['cacNumber', 'incorporationNumber', 'rcNumber', 'registrationNumber'],
};

const resolveDashboardFieldValue = (data: Record<string, any>, fieldKey: string): any => {
  if (data[fieldKey] !== undefined && data[fieldKey] !== null) return data[fieldKey];

  const normalizedTarget = normalizeFieldKey(fieldKey);
  const candidates = FIELD_ALIASES[normalizedTarget] || [fieldKey];
  for (const candidate of candidates) {
    if (data[candidate] !== undefined && data[candidate] !== null) return data[candidate];
  }

  const matchingKey = Object.keys(data).find(key => normalizeFieldKey(key) === normalizedTarget);
  return matchingKey ? data[matchingKey] : undefined;
};

const isSubmissionOwner = (
  data: Record<string, any>,
  user: { uid?: string | null; email?: string | null } | null | undefined,
): boolean => {
  if (!user) return false;
  const ownerUids = [data.userUid, data.submittedByUid, data.userId, data.uid].filter(Boolean);
  if (user.uid && ownerUids.includes(user.uid)) return true;

  const userEmail = user.email?.trim().toLowerCase();
  const ownerEmails = [data.submittedBy, data.userEmail, data.email, data.emailAddress]
    .filter((value): value is string => typeof value === 'string')
    .map(value => value.trim().toLowerCase());
  return Boolean(userEmail && ownerEmails.includes(userEmail));
};

const UserFormViewer: React.FC = () => {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizedFields, setOrganizedFields] = useState<Record<string, FormFieldWithValue[]>>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (collection && id) {
      fetchFormData();
    }
  }, [user, collection, id, navigate]);

  const fetchFormData = async () => {
    try {
      if (!collection || !id) return;

      const docRef = doc(db, collection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          collection,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
          updatedAt: docSnap.data().updatedAt?.toDate?.() || docSnap.data().updatedAt,
          status: docSnap.data().status || 'processing'
        };

        // Verify user owns this submission
        if (!isSubmissionOwner(data, user)) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this submission',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }

        setFormData(data);

        // Organize fields using form mapping
        const mappingKey = getFormMappingKey(collection, data);
        const mapping = FORM_MAPPINGS[mappingKey];
        if (mapping) {
          const organized = organizeFieldsWithMapping(data, mapping);
          setOrganizedFields(organized);
        } else {
          const organized = organizeFieldsFallback(data);
          setOrganizedFields(organized);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Form not found',
          variant: 'destructive',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch form data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormMappingKey = (collectionName: string, formData?: any): string => {
    const collectionMappings: Record<string, string | ((data: any) => string)> = {
      'corporate-kyc': (data: any) => {
        if (data.naicomField || data.typeOfEntity === 'naicom') {
          return 'naicom-corporate-cdd';
        }
        return 'corporate-cdd';
      },
      'partners-kyc': (data: any) => {
        if (data.naicomField || data.typeOfEntity === 'naicom') {
          return 'naicom-partners-cdd';
        }
        return 'partners-cdd';
      },
      'partnersCDD': (data: any) => {
        if (data.naicomField || data.typeOfEntity === 'naicom') return 'naicom-partners-cdd';
        return 'partners-kyc';
      },
      'Individual-kyc-form': 'individual-cdd',
      'corporate-kyc-form': 'corporate-kyc',
      'individual-kyc': 'individual-cdd',
      'individual-nfiu-form': 'individual-nfiu-form',
      'corporate-nfiu-form': 'corporate-nfiu-form',
      'agents-kyc': 'agents-kyc',
      'agentsCDD': 'agents-kyc',
      'brokers-kyc': 'brokers-kyc',
      'motor-claims': 'motor-claims',
      'fire-claims': 'fire-special-perils-claims',
      'fire-special-perils-claims': 'fire-special-perils-claims',
      'professional-indemnity': 'professional-indemnity-claims',
      'professional-indemnity-claims': 'professional-indemnity-claims',
      'burglary-claims': 'burglary-claims',
      'all-risk-claims': 'all-risk-claims',
      'goods-in-transit-claims': 'goods-in-transit-claims',
      'money-insurance-claims': 'money-insurance-claims',
      'public-liability-claims': 'public-liability-claims',
      'employers-liability-claims': 'employers-liability-claims',
      'group-personal-accident-claims': 'group-personal-accident-claims',
      'fidelity-guarantee-claims': 'fidelity-guarantee-claims',
      'rent-assurance-claims': 'rent-assurance-claims',
      'contractors-plant-machinery-claims': 'contractors-claims',
      'contractors-claims': 'contractors-claims',
      'combined-gpa-employers-liability-claims': 'combined-gpa-employers-liability-claims'
    };

    const mappingKey = collectionMappings[collectionName];
    if (typeof mappingKey === 'function') {
      return mappingKey(formData || {});
    }
    return mappingKey || collectionName;
  };

  const shouldShowField = (field: FormField, watchedValues: any) => {
    if (!field.conditional) {
      return true;
    }

    const dependentValue = watchedValues[field.conditional.dependsOn];
    return dependentValue === field.conditional.value;
  };

  const organizeFieldsWithMapping = (data: any, mapping: any): Record<string, FormFieldWithValue[]> => {
    const organized: Record<string, FormFieldWithValue[]> = {};

    // Administrative fields to exclude from user view
    const adminFields = ['id', 'collection', 'formId', 'userUid', 'timestamp', 'sn', 'S/N', 'serialNumber', 'rowNumber'];

    mapping.sections.forEach((section: any) => {
      const sectionFields: FormFieldWithValue[] = [];

      section.fields.forEach((field: FormField) => {
        // Skip administrative fields
        if (adminFields.includes(field.key) ||
            field.key.toLowerCase().includes('sn') ||
            field.key.toLowerCase().includes('serial') ||
            field.label?.toLowerCase().includes('s/n') ||
            field.label?.toLowerCase().includes('serial')) {
          return;
        }

        // Check if field should be shown based on conditional logic
        if (shouldShowField(field, data)) {
          let value = resolveDashboardFieldValue(data, field.key);

          // Handle array normalization
          if (field.type === 'array' && value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Already an array
            } else if (typeof value === 'object' && value !== null) {
              value = [value];
            } else {
              value = [];
            }
          }

          sectionFields.push({
            ...field,
            value: value !== undefined && value !== null && value !== '' ? value : 'N/A',
            section: section.title
          });
        }
      });

      if (sectionFields.length > 0) {
        organized[section.title] = sectionFields;
      }
    });

    return organized;
  };

  const organizeFieldsFallback = (data: any): Record<string, FormFieldWithValue[]> => {
    const organized: Record<string, FormFieldWithValue[]> = {
      'Form Data': []
    };

    // Administrative fields to exclude (the claim lifecycle block is rendered by the tracker above)
    const adminFields = ['id', 'collection', 'formId', 'userUid', 'timestamp', 'claim'];

    Object.entries(data).forEach(([key, value]) => {
      if (!adminFields.includes(key)) {
        organized['Form Data'].push({
          key,
          label: formatFieldLabel(key),
          type: getFieldType(key, value),
          value,
          section: 'Form Data'
        });
      }
    });

    return organized;
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldType = (key: string, value: any): FormField['type'] => {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (key.toLowerCase().includes('email')) return 'email';
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) return 'url';
    if (key.toLowerCase().includes('date')) return 'date';
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('value') || key.toLowerCase().includes('cost')) return 'currency';
    if (typeof value === 'string' && value.length > 100) return 'textarea';
    return 'text';
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    if (date.toDate && typeof date.toDate === 'function') {
      return formatDateUtil(date.toDate());
    }
    if (date instanceof Date) {
      return formatDateUtil(date);
    }
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return formatDateUtil(parsedDate);
      }
    }
    return String(date);
  };

  const handleDownloadFile = async (fieldKey: string, fileName: string) => {
    try {
      if (!collection || !id) {
        throw new Error('Submission details are unavailable');
      }
      await downloadSubmissionDocument(collection, id, fieldKey, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const generatePDF = async () => {
    if (!formData || !collection) return;

    setIsGeneratingPDF(true);
    try {
      await downloadDynamicPDF(formData);

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderFieldValue = (field: FormFieldWithValue) => {
    const { key, value, type, label } = field;

    // Handle file fields
    if (type === 'file' || type === 'url' ||
        (typeof value === 'string' && (value.startsWith('gs://') || value.includes('firebasestorage.googleapis.com'))) ||
        key.toLowerCase().includes('url') || key.toLowerCase().includes('file')) {
      const fieldLabel = label.replace(/Url$/, '');

      if (!value || value === null || value === undefined || value === '') {
        return <p className="text-sm text-gray-500">N/A</p>;
      }

      return (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-1 border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white"
          onClick={() => handleDownloadFile(key, `${fieldLabel}.pdf`)}
        >
          <Download className="h-4 w-4 mr-1" aria-hidden="true" />
          Download {fieldLabel}
        </Button>
      );
    }

    // Handle empty values
    if (value === null || value === undefined || value === '') {
      return <p className="text-sm text-gray-500">N/A</p>;
    }

    switch (type) {
      case 'boolean':
        return (
          <Badge className={value ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        );

      case 'date':
        return <p className="text-sm text-gray-900">{formatDate(value)}</p>;

      case 'currency':
        return (
          <p className="text-sm font-medium text-gray-900">
            ₦{typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        );

      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-sm text-[#800020] hover:underline break-all">
            {value}
          </a>
        );

      case 'array':
        if (!Array.isArray(value) || value.length === 0) {
          return <p className="text-sm text-gray-500">N/A</p>;
        }

        return (
          <div className="mt-1 flex flex-col gap-3">
            {value.map((item, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-[#800020]">
                  {label} {index + 1}
                </p>
                {typeof item === 'object' && item !== null ? (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(item).map(([itemKey, itemValue]) => (
                      <div key={itemKey}>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{formatFieldLabel(itemKey)}</p>
                        <p className="text-sm font-medium text-gray-900 break-words">{String(itemValue || 'N/A')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{String(item)}</p>
                )}
              </div>
            ))}
          </div>
        );

      case 'object':
        if (typeof value !== 'object' || value === null) {
          return <p className="text-sm text-gray-900">{String(value)}</p>;
        }

        return (
          <div className="mt-1 space-y-1">
            {Object.entries(value).map(([objKey, objValue]) => (
              <div key={objKey} className="text-sm">
                <span className="text-xs text-gray-500">{formatFieldLabel(objKey)}: </span>
                <span className="text-gray-900 break-words">{String(objValue)}</span>
              </div>
            ))}
          </div>
        );

      default:
        const displayValue = String(value);
        return (
          <p className={`text-sm text-gray-900 break-words ${type === 'textarea' ? 'whitespace-pre-wrap' : ''}`}>
            {displayValue}
          </p>
        );
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6 text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020]"></div>
          <p className="mt-4 text-gray-600">Loading your submission...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <p className="text-gray-700">Form not found</p>
        </div>
      </div>
    );
  }

  const mappingKey = getFormMappingKey(collection || '', formData);
  const mapping = FORM_MAPPINGS[mappingKey];
  const formTitle = mapping?.title || collection?.replace(/[-_]/g, ' ').toUpperCase();
  const isClaim = isClaimCollection(collection);
  const claim: ClaimBlock | null = isClaim ? resolveClaimBlock(formData) : null;
  const applyClaimUpdate = (updated: ClaimBlock) => {
    setFormData((prev: any) => (prev ? { ...prev, claim: updated } : prev));
  };

  const submittedBadge = formData.createdAt ? (
    <Badge variant="outline" className="text-gray-700">
      <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
      Submitted: {formatDate(formData.createdAt)}
    </Badge>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="self-start text-[#800020] hover:bg-[#800020]/5"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Back to Dashboard
          </Button>
          <h1 className="flex-1 text-2xl md:text-3xl font-bold text-[#800020]">{formTitle}</h1>
          <Button
            type="button"
            className="bg-[#800020] hover:bg-[#600018] text-white"
            onClick={generatePDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" /> Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" aria-hidden="true" /> Download PDF
              </>
            )}
          </Button>
        </div>

        {isClaim && claim ? (
          <>
            {/* Claim tracker */}
            <Card className="shadow-md border-2 border-[#800020]/20" data-testid="claim-tracker">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-[#800020]">Claim progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimProgress doc={formData} />
              </CardContent>
            </Card>

            {collection && id && (
              <>
                <OfferCard collection={collection} id={id} claim={claim} onUpdated={applyClaimUpdate} />
                <OutstandingDocuments collection={collection} id={id} claim={claim} onUpdated={applyClaimUpdate} />
              </>
            )}

            <ClaimTimeline claim={claim} />
          </>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-6">
              {formData.ticketId && (
                <div className="mb-5 rounded-lg border-2 border-[#800020] bg-gray-50 p-5 text-center">
                  <p className="text-xs text-gray-500 mb-1">Your Ticket ID</p>
                  <p className="text-2xl md:text-3xl font-bold font-mono text-[#800020]">{formData.ticketId}</p>
                  <p className="text-xs text-gray-500 mt-1">Please reference this ID in all future correspondence</p>
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Submission Details</h2>
              <div className="flex flex-wrap gap-2">
                <Badge className={statusBadgeClass(formData.status)} data-testid="submission-status">
                  Status: {String(formData.status || 'pending')}
                </Badge>
                {submittedBadge}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submitted details */}
        <Card className="shadow-md" data-testid="submission-details">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#800020]">Submitted details</CardTitle>
            {isClaim && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formData.ticketId && (
                  <Badge variant="outline" className="text-gray-700 font-mono">
                    <Hash className="h-3 w-3 mr-1 text-[#DAA520]" aria-hidden="true" />
                    {formData.ticketId}
                  </Badge>
                )}
                {submittedBadge}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <Separator />
            {Object.entries(organizedFields).map(([sectionTitle, fields]) => (
              <section key={sectionTitle} className="rounded-lg bg-gray-50 border border-gray-100 p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-[#800020] mb-4">{sectionTitle}</h3>
                <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {fields.map((field) => (
                    <div key={field.key} className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{field.label}</p>
                      <div className="min-w-0 overflow-hidden break-words">{renderFieldValue(field)}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserFormViewer;
