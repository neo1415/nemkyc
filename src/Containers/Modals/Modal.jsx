import React,{useState} from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Link } from 'react-router-dom';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', // Adjust the width for mobile devices
    maxWidth: 400, // Maximum width for larger screens
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function SubmitModal() {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false); // Add the agreed state
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAgreeChange = (event) => {
    setAgreed(event.target.checked);
  };

  const resetForm = () => {
    //reload page
    window.location.reload(false);

  }


  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <Typography id="transition-modal-title" variant="h6" component="h2">
             Thank You
            </Typography>
            <Typography id="transition-modal-description" sx={{ mt: 2 }}>
            Your form has been successfully submitted.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreed}
                  onChange={handleAgreeChange}
                  name="agreement"
                />
              }
              label="I agree to the privacy policy"
            />
            <Button
              disabled={!agreed}
              onClick={resetForm}
            >
             Submit Another form
            </Button>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
