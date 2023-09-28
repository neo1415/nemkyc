import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';
import './form.scss';

const ResetPassword = () => {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const { resetPassword } = UserAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    try {
      await resetPassword(email);
      alert("Password reset link sent!");
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
          <input type='email' onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button>Send Email</button>
        {error && <p className="error-message">{error}</p>} {/* Display error message if an error occurs */}
      </form>
    </div>
  );
};

export default ResetPassword;
