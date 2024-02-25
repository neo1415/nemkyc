import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import UserRegistration from '../../Admin/Authentication/SignUp';

const AddUserModal = ({ openModal, handleCloseModal, handleUserAdded }) => {
  return (
    <Dialog open={openModal} onClose={handleCloseModal}>
      <DialogTitle>Add User</DialogTitle>
      <DialogContent>
        <UserRegistration onUserAdded={handleUserAdded} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseModal} color="primary">
          Cancel
        </Button>
        <Button onClick={handleCloseModal} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserModal;
