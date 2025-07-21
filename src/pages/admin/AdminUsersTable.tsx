import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { ChevronDown, Trash2 } from 'lucide-react';

interface UserRole {
  id: string;
  name: string;
  email: string;
  role: string;
  dateCreated?: any;
  dateModified?: any;
}

const AdminUsersTable: React.FC = () => {
  const { user, firebaseUser, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AdminUsersTable useEffect - Current user:', user);
    console.log('AdminUsersTable useEffect - hasRole(super admin):', hasRole('super admin'));
    if (!hasRole('super admin')) {
      console.log('User does not have super admin role, redirecting to unauthorized');
      navigate('/unauthorized');
      return;
    }
    console.log('User has super admin role, fetching users...');
    fetchUsers();
  }, [hasRole, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from userroles collection...');
      // Remove orderBy to fetch all documents, including those without dateCreated
      const usersQuery = collection(db, 'userroles');
      const snapshot = await getDocs(usersQuery);
      console.log('Fetched snapshot:', snapshot.size, 'documents');
      const usersList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User document data:', data);
        return {
          id: doc.id,
          ...data
        };
      }) as UserRole[];
      console.log('Parsed users list:', usersList);
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-GB') + ' : ' + date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      console.log('Starting role change for user:', userId, 'to role:', newRole);
      const serverUrl = 'https://nem-server-rhdb.onrender.com';
      
      // Get CSRF token
      console.log('Fetching CSRF token...');
      const csrfRes = await fetch(`${serverUrl}/csrf-token`, { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!csrfRes.ok) {
        console.error('CSRF token fetch failed:', csrfRes.status, csrfRes.statusText);
        throw new Error(`Failed to fetch CSRF token: ${csrfRes.status}`);
      }
      
      const { csrfToken } = await csrfRes.json();
      console.log('CSRF token fetched successfully');
      
      // Get Firebase ID token
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Prepare headers with authentication and CSRF
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`,
        'CSRF-Token': csrfToken,
        'X-Timestamp': Date.now().toString(),
      };
      
      // Update in Firestore via server
      const updateResponse = await fetch(`${serverUrl}/update-user-role/${userId}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ role: newRole }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update role in Firestore');
      }

      // Set custom claims via server based on role
      let roleEndpoint = '';
      switch (newRole) {
        case 'super admin':
          roleEndpoint = 'assign-super-admin-role';
          break;
        case 'admin':
          roleEndpoint = 'assign-admin-role';
          break;
        case 'compliance':
          roleEndpoint = 'assign-compliance-role';
          break;
        case 'claims':
          roleEndpoint = 'assign-claims-role';
          break;
        case 'default':
          roleEndpoint = 'assign-default-role';
          break;
        default:
          roleEndpoint = 'assign-default-role';
      }

      const claimsResponse = await fetch(`${serverUrl}/${roleEndpoint}/${userId}`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (!claimsResponse.ok) {
        throw new Error('Failed to update custom claims');
      }

      // Update local state
      const now = new Date();
      await updateDoc(doc(db, 'userroles', userId), {
        role: newRole,
        dateModified: now
      });

      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, role: newRole, dateModified: now }
            : u
        )
      );
      
      toast({
        title: "Success",
        description: "User role updated successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }

    try {
      const serverUrl = 'https://nem-server-rhdb.onrender.com';
      
      // Get CSRF token
      const csrfRes = await fetch(`${serverUrl}/csrf-token`, { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!csrfRes.ok) {
        throw new Error(`Failed to fetch CSRF token: ${csrfRes.status}`);
      }
      
      const { csrfToken } = await csrfRes.json();
      
      // Get Firebase ID token
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Prepare headers with authentication and CSRF
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`,
        'CSRF-Token': csrfToken,
        'X-Timestamp': Date.now().toString(),
      };

      // Delete from Firebase Auth via server
      const deleteAuthResponse = await fetch(`${serverUrl}/delete-user/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!deleteAuthResponse.ok) {
        throw new Error('Failed to delete user from Firebase Auth');
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'userroles', userId));
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      
      toast({
        title: "Success",
        description: "User deleted successfully from both Firebase Auth and Firestore",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const regularUsers = users.filter(u => u.role === 'default');
  const adminUsers = users.filter(u => u.role !== 'default');

  const UserTable = ({ usersList, title }: { usersList: UserRole[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {usersList.length} {title.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Date Modified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersList.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell className="font-medium">{userRole.name}</TableCell>
                  <TableCell>{userRole.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{userRole.role}</span>
                      <Select
                        value={userRole.role}
                        onValueChange={(value) => handleRoleChange(userRole.id, value)}
                      >
                        <SelectTrigger className="w-auto border-none shadow-none p-0 h-auto">
                          <ChevronDown className="h-4 w-4" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="claims">Claims</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(userRole.dateCreated)}</TableCell>
                  <TableCell>{formatDateTime(userRole.dateModified)}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete {userRole.name}? 
                            This action cannot be undone and will remove them from the entire application.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(userRole.id, userRole.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular">Regular Users ({regularUsers.length})</TabsTrigger>
          <TabsTrigger value="admin">Admin Users ({adminUsers.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regular" className="mt-6">
          <UserTable usersList={regularUsers} title="Regular Users" />
        </TabsContent>
        
        <TabsContent value="admin" className="mt-6">
          <UserTable usersList={adminUsers} title="Admin Users" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsersTable;