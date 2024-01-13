import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';
import { Link } from 'react-router-dom';
import './form.scss';

const SignIn = () => {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn } = UserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signIn(email, password);
      // Check for the custom claim
      const idTokenResult = await userCredential.user.getIdTokenResult();
      if (idTokenResult.claims.forcePasswordReset) {
        // Redirect user to the password reset flow
        navigate('/requestpasswordreset');
      } else {
        // Redirect user to the admin home page or other appropriate page
        navigate('/adminHome');
      }
    } catch (e) {
      setError('Invalid email or password or check your internet connectiuon');
    }
  };

  return (
    <div className='login'>
      <div className='loginTitle'>
        <h2>Sign In To Your Account</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className='Inputs'>
          <label>Email Address</label>
          <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Password</label>
          <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <span className='error'>{error}</span>}
        <button type="submit">Log In</button>

        <p><Link to='/requestpasswordreset'>Reset Password</Link></p>
      </form>
    </div>
  );
};

export default SignIn;
