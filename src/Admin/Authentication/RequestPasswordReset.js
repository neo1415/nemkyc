// RequestPasswordReset.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';

const RequestPasswordReset = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { resetPassword } = UserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await resetPassword(email);
      alert("Password reset link sent! Check your email.");
      navigate('/signin');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className='login'>
      <div className='loginTitle'>
        <h2>Enter Your Email to Reset Your Password</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className='Inputs'>
          <label>E-mail</label>
          <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit">Send Email</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default RequestPasswordReset;
