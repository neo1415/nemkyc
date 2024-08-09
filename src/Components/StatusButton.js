import React, { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../APi';
import '../Admin/Table/Table.scss';

export const StatusButton = ({ id, collection, setData }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      await updateStatusInFirestore(id, collection, newStatus);
      setData(prevData => {
        const updatedData = prevData.map(item => 
          item.id === id ? { ...item, status: newStatus } : item
        );
        return updatedData; // Return the updated data array
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  const updateStatusInFirestore = async (id, collection, status) => {
    const docRef = doc(db, collection, id);
    try {
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div>
      <button onClick={handleClick} className='statusButton'>
        Status
      </button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => { handleChangeStatus(id, 'processing'); handleClose(); }}>Processing</MenuItem>
        <MenuItem onClick={() => { handleChangeStatus(id, 'completed'); handleClose(); }}>Completed</MenuItem>
      </Menu>
    </div>
  );
};
