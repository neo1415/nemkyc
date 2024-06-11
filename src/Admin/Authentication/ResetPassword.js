import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const { confirmPasswordReset } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('oobCode');
    if (code) {
      setOobCode(code);
    } else {
      setError('Error retrieving password reset code from the URL.');
    }
  }, [location]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must include at least 8 characters, includes uppercase, lowercase, number, special char.');
      return;
    }

    try {
      await confirmPasswordReset(oobCode, password);
      alert("Password has been reset successfully!");
      navigate('/signin');
    } catch (e) {
      setError(e.message);
    }
  };

  const validatePassword = (password) => {
    const strongPasswordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');
    return strongPasswordRegex.test(password);
  };

  return (
    <div className='login'>
      <div className='loginTitle'>
        <h2>Reset Your Password .</h2>
      </div>
      <form onSubmit={handlePasswordReset}>
        <div className='Inputs'>
          <label>New Password</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Confirm New Password</label>
          <input
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit">Reset Password</button>
        {error && <p className="error-message" style={{marginTop:'2rem'}}>{error}</p>}
      </form>
    </div>
  );
};

export default ResetPassword;
