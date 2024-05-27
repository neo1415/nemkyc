import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './form.scss';
import { useLocation } from 'react-router-dom';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

const PasswordReset = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { uid } = location.state || {}; // Get UID from state passed during navigation
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
          const response = await axios.post('/resetpassword', { uid, newPassword });
    
          if (response.ok) {
            setSuccess('Password reset successful. Please login with your new password.');
            setTimeout(() => {
              navigate('/signin');
            }, 3000);
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Password reset failed');
          }
        } catch (e) {
          setError(e.message || 'Password reset failed. Please try again.');
        }
      };
  
    return (
      <div className='reset-password'>
        <div className='reset-password-title'>
          <h2>Reset Your Password</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='Inputs'>
            <label>New Password</label>
            <input type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          {error && <span className='error'>{error}</span>}
          {success && <span className='success'>{success}</span>}
          <button type="submit">Reset Password</button>
        </form>
      </div>
    );
  };
  
  export default PasswordReset;