import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from './Points';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  createTheme,
  ThemeProvider,
  CircularProgress,
  Backdrop
} from '@mui/material';
import Sidebar from '../SideBar/SideBar';
import { BsBadge4K } from 'react-icons/bs';
import './roles.scss'
import ConfirmationModal from '../../Containers/Modals/ConfirmationModal';
import AddUserModal from './../../Containers/Modals/AddUserModal';
import { csrfProtectedDelete, csrfProtectedPost } from '../../Components/CsrfUtils';

const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Replace with your desired burgundy color code
    },
  },
});

const RoleAssignment = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

useEffect(() => {
  // Set up a real-time listener for changes in the Firestore data
  setIsLoading(true);
const realTimeListener = () => {

  const eventSource = new EventSource(endpoints.listenForUpdates);

  eventSource.onmessage = (event) => {
    const responseData = JSON.parse(event.data);

    if (Array.isArray(responseData.users)) {
      // Make sure responseData.users is an array before mapping
      setUsers(responseData.users);
      // console.log('Users updated in real-time:', responseData.users);
    } else {
      console.error('Received data is not an array:', responseData);
    }
    setIsLoading(false); // Set loading to false after fetching the users
  };

  eventSource.onerror = (error) => {
    console.error('Error with real-time listener:', error);
    eventSource.close();
  };
};


  // Initialize the real-time listener
  realTimeListener();

  return () => {
    // No cleanup is needed here because the real-time listener on the server handles updates.
  };
}, []);


const openSuccessModal = () => {
  setSuccessModalOpen(true);

  // Close the success modal after 3 seconds (adjust the timing as needed)
  setTimeout(() => {
    setSuccessModalOpen(false);
  }, 3000);
};


const deleteUser = async (uid) => {
  setIsLoading(true);
  setDeleteModalOpen(false);
  try {
    const endpoint = endpoints.deleteUser(uid); // Use the endpoint with the UID
    console.log('Delete User Endpoint:', endpoint); // Log the endpoint
    const response = await csrfProtectedDelete(endpoint);

    if (response.status === 200) {
      openSuccessModal();
      // Remove the deleted user from the state
      setUsers((prevUsers) => prevUsers.filter((user) => user.uid !== uid));
    } else {
      console.error('Error deleting user:', response.statusText);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    setIsLoading(false);
  }
};

  const checkUserRole = async (uid, role) => {
    try {
      const endpoint = endpoints.checkUserRole(uid); // Use the endpoint with the UID
      const response = await csrfProtectedPost(endpoint, { role });
      console.log(role);
      return response.data.hasRole;
    } catch (error) {
      console.error(`Error checking ${role} claim:`, error);
      return false; // Default to false if there's an error
    }
  };

const handleUserAdded = (newUser) => {
  // Update the users state with the new user
  setUsers((prevUsers) => [...prevUsers, newUser]);
};


const assignRole = async () => {
  setIsLoading(true);
  try {
    openSuccessModal();
    if (!selectedUser || !selectedRole) {
      setErrorMessage('Please select a user and a role.');
      return;
    }

    // Check if the selected user already has the selected role
    const hasRole = await checkUserRole(selectedUser, selectedRole);

    if (hasRole) {
      setErrorMessage(`This user already has the ${selectedRole} role.`);
      return;
    }

    // Proceed with role assignment based on the selected role
    let endpoint;
    switch (selectedRole) {
      case 'admin':
        endpoint = endpoints.assignAdminRole(selectedUser);
        break;
      case 'moderator':
        endpoint = endpoints.assignModeratorRole(selectedUser);
        break;
      case 'default':
        endpoint = endpoints.assignDefaultRole(selectedUser);
        break;
      default:
        setErrorMessage('Invalid role selected.');
        return;
    }

    // Make the API request to assign the role and update custom claims
    const response = await csrfProtectedPost(endpoint, {});

    // Update the Firestore collection with the new role
    const firestoreEndpoint = endpoints.updateUserRole(selectedUser);
    await csrfProtectedPost(firestoreEndpoint, { role: selectedRole });

    setSuccessMessage(response.data.message);
    setErrorMessage('');
    // Close the role selection dropdown after successful role assignment
    setSelectedUser('');
    // Redirect to the admin dashboard or another page after role assignment
  } catch (error) {
    console.error('Error assigning role:', error);
    setErrorMessage('Error assigning role. Please try again.');
    setSuccessMessage('');
  } finally {
    setIsLoading(false);
  }
};
const handleAddUserClick = () => {
  setOpenModal(true);
};

const handleCloseModal = () => {
  setOpenModal(false);
};


const handleOpenDeleteModal = (uid) => {
  setUserToDelete(uid);
  setDeleteModalOpen(true);
};
const handleDeleteUser = async () => {
  if (userToDelete) {
    await deleteUser(userToDelete);
    setDeleteModalOpen(false);
  }
};

const handleCancelDelete = () => {
  setUserToDelete(null);
  setDeleteModalOpen(false);
};
return (
  
  <div className='user-management'>
  <Sidebar />
  <ThemeProvider theme={theme}>
  <div className='user-manage'>
    <h2>User Management</h2>
    <Button variant="outlined" onClick={handleAddUserClick}>
      Add User
    </Button>

    <ToastContainer />

         {/* Display loading spinner */}
         <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isLoading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>


      {/* Display user details in a table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
           <Button
  variant="outlined"
  onClick={() => {
    // Toggle the selected user when clicking "Change Roles"
    setSelectedUser((prevSelectedUser) =>
      prevSelectedUser === user.uid ? '' : user.uid
    );
  }}
>
  {selectedUser === user.uid ? 'Close Roles' : 'Change Roles'}
</Button>
{selectedUser === user.uid && (
  <div>
    <Select
      value={selectedRole}
      onChange={(e) => setSelectedRole(e.target.value)}
    >
      <MenuItem value="">Select Role</MenuItem>
      <MenuItem value="admin">Admin</MenuItem>
      <MenuItem value="moderator">Moderator</MenuItem>
      <MenuItem value="default">Default</MenuItem>
    </Select>
    <Button
      variant="outlined"
      startIcon={<BsBadge4K />}
      onClick={() => assignRole(user.uid)}
    >
      Assign Role
    </Button>
  </div>
)}


    <Button
      variant="outlined"
      onClick={() => handleOpenDeleteModal(user.uid)}
      >
      Delete User
      </Button>
      </TableCell>
      </TableRow>
    ))}
   </TableBody>
  </Table>
</TableContainer>
      {errorMessage && <p className="error">{errorMessage}</p>}
        {/* User Registration Modal */}
      <AddUserModal
        openModal={openModal}
        handleCloseModal={handleCloseModal}
        handleUserAdded={handleUserAdded}
      />

<ConfirmationModal
        open={deleteModalOpen}
        title="Delete User"
        content="Are you sure you want to delete this user?"
        onConfirm={handleDeleteUser}
        onCancel={handleCancelDelete}
      />

      <Dialog open={successModalOpen} onClose={() => setSuccessModalOpen(false)}>
  {/* <DialogTitle>Success</DialogTitle> */}

  <DialogContent>
    <div className="success-message">
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {successMessage}
          <span role="img" aria-label="checkmark">
            User Deleted Succesfully✅
          </span>
        </>
      )}
    </div>
  </DialogContent>
</Dialog>
      <ToastContainer />
      </div>
      </ThemeProvider>
    </div>
  );
};

export default RoleAssignment;