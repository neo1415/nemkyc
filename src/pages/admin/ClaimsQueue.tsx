import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { collection as firestoreCollection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CLAIM_NAV_ITEMS, canAccessClaimCollection, getClaimTypeLabel } from '@/config/claimAccessPolicy';
import {
  ClaimStage,
  STAGES,
  STAGE_LABELS,
  STEPS,
  WaitingOn,
  daysSinceNotification,
  resolveClaimBlock,
} from '@/lib/claimLifecycle';

const theme = createTheme({
  palette: {
    primary: { main: '#800020' },
    secondary: { main: '#FFD700' },
  },
});

interface QueueRow {
  id: string;
  collection: string;
  docId: string;
  ticketId: string;
  formType: string;
  claimant: string;
  stage: ClaimStage;
  step: string;
  waitingOn: WaitingOn;
  days: number | null;
  lastUpdate: Date | null;
}

const WAITING_LABELS: Record<WaitingOn, string> = { customer: 'Customer', nem: 'NEM', none: '—' };

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'object' && value !== null && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date(Number((value as { seconds: number }).seconds) * 1000);
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function claimantName(data: Record<string, any>): string {
  const composite = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  return (
    data.nameOfInsured ||
    data.insuredName ||
    data.companyName ||
    data.fullName ||
    data.name ||
    composite ||
    data.email ||
    data.insuredEmail ||
    'N/A'
  );
}

export function buildQueueRow(collectionName: string, docId: string, data: Record<string, any>, now = Date.now()): QueueRow {
  const block = resolveClaimBlock(data);
  const lastHistory = block.history[block.history.length - 1];
  const lastUpdate =
    toDate(data.updatedAt) ||
    (lastHistory ? new Date(lastHistory.at) : null) ||
    toDate(data.submittedAt) ||
    toDate(data.timestamp) ||
    toDate(data.createdAt);
  return {
    id: `${collectionName}/${docId}`,
    collection: collectionName,
    docId,
    ticketId: data.ticketId || docId,
    formType: getClaimTypeLabel(collectionName),
    claimant: claimantName(data),
    stage: block.stage,
    step: STEPS[block.step].label,
    waitingOn: block.waitingOn,
    days: daysSinceNotification(block, now),
    lastUpdate,
  };
}

const ClaimsQueue: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<'all' | ClaimStage>('all');

  const visibleCollections = useMemo(
    () => CLAIM_NAV_ITEMS.map((item) => item.collection).filter((name) => canAccessClaimCollection(user, name)),
    [user],
  );

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const results = await Promise.all(
        visibleCollections.map(async (name) => {
          try {
            const snapshot = await getDocs(firestoreCollection(db, name));
            return snapshot.docs.map((snap) => buildQueueRow(name, snap.id, snap.data()));
          } catch (error) {
            console.error(`ClaimsQueue: failed to load ${name}`, error);
            return [];
          }
        }),
      );
      if (cancelled) return;
      const merged = results.flat().sort((a, b) => (b.days ?? -1) - (a.days ?? -1));
      setRows(merged);
      setLoading(false);
      if (merged.length === 0 && visibleCollections.length === 0) {
        toast({ title: 'No claim types assigned', description: 'Ask an administrator to assign claim units to your account.' });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, navigate, visibleCollections, toast]);

  const filteredRows = useMemo(
    () => (stageFilter === 'all' ? rows : rows.filter((row) => row.stage === stageFilter)),
    [rows, stageFilter],
  );

  const columns: GridColDef<QueueRow>[] = [
    { field: 'ticketId', headerName: 'Claim number', width: 170 },
    { field: 'formType', headerName: 'Form type', width: 220 },
    { field: 'claimant', headerName: 'Claimant', flex: 1, minWidth: 180 },
    {
      field: 'stage',
      headerName: 'Stage',
      width: 120,
      valueFormatter: (value: ClaimStage) => STAGE_LABELS[value] || value,
      renderCell: (params) => (
        <Chip
          size="small"
          label={STAGE_LABELS[params.row.stage]}
          color={params.row.stage === 'declined' ? 'error' : params.row.stage === 'closed' ? 'default' : 'primary'}
          variant={params.row.stage === 'closed' ? 'outlined' : 'filled'}
        />
      ),
    },
    { field: 'step', headerName: 'Step', width: 220 },
    {
      field: 'waitingOn',
      headerName: 'Waiting on',
      width: 120,
      valueFormatter: (value: WaitingOn) => WAITING_LABELS[value] || value,
    },
    {
      field: 'days',
      headerName: 'Days since notification',
      width: 190,
      type: 'number',
      renderCell: (params) => {
        const days = params.row.days;
        if (days === null) return <span>—</span>;
        return (
          <Typography
            component="span"
            variant="body2"
            sx={{ color: days > 45 ? 'error.main' : 'inherit', fontWeight: days > 60 ? 700 : 400 }}
          >
            {days}
          </Typography>
        );
      },
    },
    {
      field: 'lastUpdate',
      headerName: 'Last update',
      width: 140,
      type: 'date',
      valueFormatter: (value: Date | null) => (value ? value.toLocaleDateString() : '—'),
    },
  ];

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Claims Queue
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="claims-queue-stage-label">Stage</InputLabel>
            <Select
              labelId="claims-queue-stage-label"
              label="Stage"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as 'all' | ClaimStage)}
            >
              <MenuItem value="all">All stages</MenuItem>
              {STAGES.map((stage) => (
                <MenuItem key={stage} value={stage}>{STAGE_LABELS[stage]}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {visibleCollections.length} claim type{visibleCollections.length === 1 ? '' : 's'} · {filteredRows.length} claim{filteredRows.length === 1 ? '' : 's'}
        </Typography>
        <Box sx={{ height: 640, width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            onRowClick={(params) => navigate(`/admin/form/${params.row.collection}/${params.row.docId}`)}
            disableRowSelectionOnClick
            sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ClaimsQueue;
