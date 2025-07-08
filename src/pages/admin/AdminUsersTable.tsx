import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Button, Typography, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Delete, Edit } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c2d12',
    },
  },
});

const AdminUsersTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'super-admin') {
      navigate('/unauthorized');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersData: any[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date(),
      });

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      
      setDeleteDialog({ open: false, user: null });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: (params: any) => (
        <Select
          value={params.value}
          onChange={(e) => handleRoleChange(params.row.id, e.target.value)}
          size="small"
          disabled={params.row.id === user?.uid}
        >
          <MenuItem value="default">Default</MenuItem>
          <MenuItem value="compliance">Compliance</MenuItem>
          <MenuItem value="claims">Claims</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="super-admin">Super Admin</MenuItem>
        </Select>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 120,
      valueFormatter: (params: any) => params.value?.toLocaleDateString() || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            color="error"
            startIcon={<Delete size={16} />}
            onClick={() => setDeleteDialog({ open: true, user: params.row })}
            disabled={params.row.id === user?.uid}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  const regularUsers = users.filter(u => u.role === 'default');
  const adminUsers = users.filter(u => u.role !== 'default');

  if (!user || user.role !== 'super-admin') {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Regular Users (${regularUsers.length})`} />
          <Tab label={`Admin Users (${adminUsers.length})`} />
        </Tabs>
        
        <Box sx={{ height: 600, width: '100%', mt: 2 }}>
          <DataGrid
            rows={tabValue === 0 ? regularUsers : adminUsers}
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

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user "{deleteDialog.user?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, user: null })}>Cancel</Button>
            <Button onClick={() => handleDeleteUser(deleteDialog.user?.id)} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AdminUsersTable;