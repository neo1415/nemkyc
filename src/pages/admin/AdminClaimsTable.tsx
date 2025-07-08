import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Button, Chip, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Eye, Download, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c2d12',
    },
  },
});

interface AdminClaimsTableProps {
  formType?: string;
}

const AdminClaimsTable: React.FC<AdminClaimsTableProps> = ({ formType }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; claim: any }>({ open: false, claim: null });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchClaims();
  }, [user, isAdmin, navigate]);

  const fetchClaims = async () => {
    try {
      const claimCollections = [
        'motor-claims',
        'professional-indemnity-claims',
        'public-liability-claims',
        'employers-liability-claims',
        'burglary-claims',
        'group-personal-accident-claims',
        'fire-special-perils-claims',
        'rent-assurance-claims',
        'money-insurance-claims',
        'goods-in-transit-claims',
        'contractors-plant-machinery-claims',
        'all-risk-claims',
        'fidelity-guarantee-claims',
        'combined-gpa-employers-liability-claims'
      ];

      const allClaims: any[] = [];
      
      for (const collectionName of claimCollections) {
        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          allClaims.push({
            id: doc.id,
            collection: collectionName,
            type: collectionName.replace('-claims', '').replace('-', ' '),
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          });
        });
      }

      setClaims(allClaims);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch claims data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claim: any) => {
    try {
      const claimRef = doc(db, claim.collection, claim.id);
      await updateDoc(claimRef, {
        status: 'approved',
        approvedBy: user?.uid,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });

      // Update local state
      setClaims(prev => prev.map(c => 
        c.id === claim.id ? { ...c, status: 'approved' } : c
      ));

      // Send approval email (placeholder - implement with email service)
      console.log('Sending approval email to:', claim.email || claim.insuredEmail);

      toast({
        title: 'Success',
        description: 'Claim approved successfully',
      });

      setApprovalDialog({ open: false, claim: null });
    } catch (error) {
      console.error('Error approving claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve claim',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'type', headerName: 'Claim Type', width: 200 },
    { field: 'policyNumber', headerName: 'Policy Number', width: 150 },
    { field: 'claimantName', headerName: 'Claimant', width: 180 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => (
        <Chip 
          label={params.value || 'pending'} 
          color={getStatusColor(params.value || 'pending') as any}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Submitted',
      width: 120,
      valueFormatter: (params: any) => params.value?.toLocaleDateString() || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Eye size={16} />}
            onClick={() => navigate(`/admin/form/${params.row.collection}/${params.row.id}`)}
          >
            View
          </Button>
          {user?.role === 'claims' && params.row.status === 'pending' && (
            <Button
              size="small"
              color="success"
              startIcon={<CheckCircle size={16} />}
              onClick={() => setApprovalDialog({ open: true, claim: params.row })}
            >
              Approve
            </Button>
          )}
        </Box>
      ),
    },
  ];

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Claims Management
        </Typography>
        
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={claims}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>

        <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog({ open: false, claim: null })}>
          <DialogTitle>Approve Claim</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to approve this claim? This will send a confirmation email to the claimant.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApprovalDialog({ open: false, claim: null })}>Cancel</Button>
            <Button onClick={() => handleApprove(approvalDialog.claim)} color="success">
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AdminClaimsTable;