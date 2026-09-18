import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import {
  ClaimBlock,
  ClaimStep,
  LegacyStatus,
  STAGE_LABELS,
  STEPS,
  STEP_REQUIREMENTS,
  TRANSITIONS,
  resolveClaimBlock,
} from '@/lib/claimLifecycle';
import { ClaimsApiError, TransitionInput, transitionClaim } from '@/services/claimsApi';

/** The happy-path order of steps, used only to draw the roadmap; legality still comes from TRANSITIONS. */
const STAFF_PATH: ClaimStep[] = [
  'registered', 'docs_requested', 'docs_complete', 'coverage_confirmed', 'assessed',
  'offer_issued', 'offer_accepted', 'discharged', 'payment_processed', 'payment_confirmed', 'closed',
];

export interface ClaimTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  collection: string;
  id: string;
  /** The submission document as loaded from Firestore (claim block optional for legacy docs). */
  doc: Parameters<typeof resolveClaimBlock>[0];
  onUpdated: (claim: ClaimBlock, status: LegacyStatus) => void;
}

interface DocumentRow {
  label: string;
  required: boolean;
}

interface DeductionRow {
  label: string;
  amount: string;
}

const TERMINAL_STEPS: ClaimStep[] = ['closed', 'declined'];

const emptyDocumentRow = (): DocumentRow => ({ label: '', required: true });
const emptyDeductionRow = (): DeductionRow => ({ label: '', amount: '' });

function requiresField(step: ClaimStep | '', field: string): boolean {
  if (!step) return false;
  return (STEP_REQUIREMENTS[step] || []).includes(field);
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function renderDetails(details: unknown): React.ReactNode {
  if (details === null || details === undefined) return null;
  if (Array.isArray(details)) {
    return (
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {details.map((item, index) => (
          <li key={index}>
            <Typography variant="body2">{typeof item === 'string' ? item : JSON.stringify(item)}</Typography>
          </li>
        ))}
      </Box>
    );
  }
  if (typeof details === 'string') return <Typography variant="body2">{details}</Typography>;
  return (
    <Typography variant="body2" component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
      {JSON.stringify(details, null, 2)}
    </Typography>
  );
}

const ClaimTransitionDialog: React.FC<ClaimTransitionDialogProps> = ({ open, onClose, collection, id, doc, onUpdated }) => {
  const current = useMemo(() => resolveClaimBlock(doc), [doc]);
  const isTerminal = TERMINAL_STEPS.includes(current.step);

  const options = useMemo(
    () => TRANSITIONS[current.step].filter((step) => STEPS[step].actor === 'staff'),
    [current.step],
  );

  const [targetStep, setTargetStep] = useState<ClaimStep | ''>('');
  const [note, setNote] = useState('');
  const [documents, setDocuments] = useState<DocumentRow[]>([emptyDocumentRow()]);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerBasis, setOfferBasis] = useState('');
  const [offerExcess, setOfferExcess] = useState('');
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);
  const [dvUrl, setDvUrl] = useState('');
  const [reason, setReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<{ message: string; details?: unknown } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever the dialog is (re)opened for a claim.
  useEffect(() => {
    if (!open) return;
    setTargetStep(options.length === 1 ? options[0] : '');
    setNote('');
    setDocuments([emptyDocumentRow()]);
    setOfferAmount('');
    setOfferBasis('');
    setOfferExcess('');
    setDeductions([]);
    setDvUrl('');
    setReason('');
    setPaymentReference('');
    setPaymentAmount('');
    setPaymentDate('');
    setValidationError(null);
    setServerError(null);
    setSubmitting(false);
  }, [open, options]);

  const needsDocuments = requiresField(targetStep, 'outstandingDocuments');
  const needsOffer = requiresField(targetStep, 'offer');
  const needsReason = requiresField(targetStep, 'reason');
  const needsPayment = requiresField(targetStep, 'payment');

  const buildPayload = (): TransitionInput | string => {
    if (!targetStep) return 'Choose the step to move this claim to.';
    const payload: TransitionInput = { step: targetStep, note: note.trim() };

    if (needsDocuments) {
      const rows = documents
        .map((row) => ({ label: row.label.trim(), required: row.required }))
        .filter((row) => row.label);
      if (rows.length === 0) return 'Add at least one outstanding document.';
      payload.outstandingDocuments = rows;
    }

    if (needsOffer) {
      const amount = toNumber(offerAmount);
      if (amount === null || amount <= 0) return 'Enter the settlement amount (NGN) as a positive number.';
      const excess = toNumber(offerExcess);
      if (offerExcess.trim() !== '' && excess === null) return 'Excess must be a number.';
      const deductionRows: { label: string; amount: number }[] = [];
      for (const row of deductions) {
        const label = row.label.trim();
        const rowAmount = toNumber(row.amount);
        if (!label && row.amount.trim() === '') continue;
        if (!label || rowAmount === null) return 'Each deduction needs a label and a numeric amount.';
        deductionRows.push({ label, amount: rowAmount });
      }
      payload.offer = {
        amount,
        currency: 'NGN',
        basis: offerBasis.trim(),
        excess,
        deductions: deductionRows,
        dvUrl: dvUrl.trim() || null,
      };
    }

    if (needsReason) {
      if (!reason.trim()) return 'A decline reason is required. The customer will see it.';
      payload.reason = reason.trim();
    }

    if (needsPayment) {
      if (!paymentReference.trim()) return 'Enter the payment reference.';
      const amount = toNumber(paymentAmount);
      if (paymentAmount.trim() !== '' && amount === null) return 'Payment amount must be a number.';
      const paidAt = paymentDate ? Date.parse(paymentDate) : NaN;
      payload.payment = {
        reference: paymentReference.trim(),
        amount,
        currency: 'NGN',
        ...(Number.isNaN(paidAt) ? {} : { paidAt }),
      };
    }

    return payload;
  };

  const handleSubmit = async () => {
    setServerError(null);
    const payload = buildPayload();
    if (typeof payload === 'string') {
      setValidationError(payload);
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      const result = await transitionClaim(collection, id, payload);
      onUpdated(result.claim, result.status);
      onClose();
    } catch (error) {
      if (error instanceof ClaimsApiError) {
        setServerError({ message: error.message, details: error.details });
      } else {
        setServerError({ message: error instanceof Error ? error.message : 'The request failed. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateDocument = (index: number, patch: Partial<DocumentRow>) =>
    setDocuments((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const updateDeduction = (index: number, patch: Partial<DeductionRow>) =>
    setDeductions((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move claim</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Current stage: <strong>{STAGE_LABELS[current.stage]}</strong> — {STEPS[current.step].label}
        </Typography>

        {/* The whole road ahead, so staff can see where the settlement offer (amount) is entered. */}
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Full path
          </Typography>
          <Typography variant="body2" component="div" sx={{ lineHeight: 1.8 }}>
            {STAFF_PATH.map((step, index) => {
              const state = STAFF_PATH.indexOf(current.step) > index ? 'done' : step === current.step ? 'current' : 'todo';
              return (
                <span key={step} style={{ whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontWeight: state === 'current' ? 700 : 400,
                    color: state === 'todo' ? '#8c8285' : state === 'current' ? '#8E1B2C' : '#2F6B45',
                  }}>
                    {state === 'done' ? '✓ ' : ''}{STEPS[step].label}
                    {step === 'offer_issued' ? ' (amount entered here)' : ''}
                    {STEPS[step].actor === 'customer' ? ' (customer)' : ''}
                  </span>
                  {index < STAFF_PATH.length - 1 ? <span style={{ color: '#8c8285' }}> → </span> : null}
                </span>
              );
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            "Claim declined" is available at every step up to the offer. The customer accepts or queries the offer from their dashboard; a query lets you issue a revised offer.
          </Typography>
        </Box>

        {isTerminal ? (
          <Alert severity="info">
            This claim is {current.step === 'closed' ? 'closed' : 'declined'}. No further steps are available.
          </Alert>
        ) : (
          <>
            <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
              <FormLabel component="legend">Next step</FormLabel>
              <RadioGroup value={targetStep} onChange={(e) => setTargetStep(e.target.value as ClaimStep)}>
                {options.map((step) => (
                  <FormControlLabel
                    key={step}
                    value={step}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">{STEPS[step].label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {STAGE_LABELS[STEPS[step].stage]} · {STEPS[step].customer}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {needsDocuments && (
              <Box sx={{ mb: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Outstanding documents</Typography>
                {documents.map((row, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label={`Document ${index + 1}`}
                      value={row.label}
                      onChange={(e) => updateDocument(index, { label: e.target.value })}
                    />
                    <FormControlLabel
                      sx={{ whiteSpace: 'nowrap', mr: 0 }}
                      control={<Checkbox checked={row.required} onChange={(e) => updateDocument(index, { required: e.target.checked })} />}
                      label="Required"
                    />
                    <IconButton
                      aria-label={`Remove document ${index + 1}`}
                      size="small"
                      disabled={documents.length === 1}
                      onClick={() => setDocuments((rows) => rows.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                ))}
                <Button size="small" startIcon={<Plus size={16} />} onClick={() => setDocuments((rows) => [...rows, emptyDocumentRow()])}>
                  Add document
                </Button>
              </Box>
            )}

            {needsOffer && (
              <Box sx={{ mb: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  {targetStep === 'offer_revised' ? 'Revised settlement offer' : 'Settlement offer'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
                  <TextField
                    size="small"
                    label="Amount (NGN)"
                    type="number"
                    inputProps={{ min: 0, step: '0.01' }}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    required
                  />
                  <TextField
                    size="small"
                    label="Excess (NGN)"
                    type="number"
                    inputProps={{ min: 0, step: '0.01' }}
                    value={offerExcess}
                    onChange={(e) => setOfferExcess(e.target.value)}
                  />
                </Box>
                <TextField
                  size="small"
                  fullWidth
                  label="Basis of settlement"
                  multiline
                  minRows={2}
                  value={offerBasis}
                  onChange={(e) => setOfferBasis(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Typography variant="caption" color="text.secondary">Deductions</Typography>
                {deductions.map((row, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Deduction"
                      value={row.label}
                      onChange={(e) => updateDeduction(index, { label: e.target.value })}
                    />
                    <TextField
                      size="small"
                      label="Amount (NGN)"
                      type="number"
                      sx={{ width: 170 }}
                      value={row.amount}
                      onChange={(e) => updateDeduction(index, { amount: e.target.value })}
                    />
                    <IconButton
                      aria-label={`Remove deduction ${index + 1}`}
                      size="small"
                      onClick={() => setDeductions((rows) => rows.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{ mt: 1, mb: 1.5 }}>
                  <Button size="small" startIcon={<Plus size={16} />} onClick={() => setDeductions((rows) => [...rows, emptyDeductionRow()])}>
                    Add deduction
                  </Button>
                </Box>
                <TextField
                  size="small"
                  fullWidth
                  label="Discharge voucher URL (optional)"
                  value={dvUrl}
                  onChange={(e) => setDvUrl(e.target.value)}
                />
              </Box>
            )}

            {needsReason && (
              <Box sx={{ mb: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  required
                  label="Decline reason"
                  helperText="Shown to the customer."
                  multiline
                  minRows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Box>
            )}

            {needsPayment && (
              <Box sx={{ mb: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Payment</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField
                    size="small"
                    required
                    label="Payment reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                  <TextField
                    size="small"
                    label="Amount (NGN)"
                    type="number"
                    inputProps={{ min: 0, step: '0.01' }}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <TextField
                    size="small"
                    label="Payment date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </Box>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              label="Note"
              helperText="Internal note recorded in the claim history."
              multiline
              minRows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}

        {validationError && (
          <Alert severity="warning" sx={{ mt: 2 }} role="alert">
            {validationError}
          </Alert>
        )}
        {serverError && (
          <Alert severity="error" sx={{ mt: 2 }} role="alert">
            <AlertTitle>The claim could not be moved</AlertTitle>
            <Typography variant="body2" sx={{ mb: serverError.details ? 1 : 0 }}>{serverError.message}</Typography>
            {renderDetails(serverError.details)}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isTerminal || submitting || !targetStep}
        >
          {submitting ? 'Moving…' : 'Move claim'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClaimTransitionDialog;
