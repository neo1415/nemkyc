import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '70%', // Adjust the width for mobile devices
  maxWidth: 400, // Maximum width for larger screens
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 10,
};

const SubmitModal = ({closeModal, resetForm}) => {
  const handleClose = () => {
    closeModal()
  };

  const newForm=()=>{
    resetForm()
  }

  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={true}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={true}>
          <Box sx={style}>
            <Typography id="transition-modal-title" variant="h6" component="h2">
              Thank you, your form has been submitted!
            </Typography>
            <Button onClick={newForm}>Submit a New Form</Button>
            <Button onClick={handleClose}>Close</Button>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};

export default SubmitModal;
