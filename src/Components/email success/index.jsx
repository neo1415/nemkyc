import React from 'react';
import './SuccessEmail.css'; // Import the CSS file

const SuccessEmail = () => {
  return (
    <div className="email-card">
      <div className="checkmark-container">
        <i className="checkmark">✓</i>
      </div>
      <h1>Email Sent</h1>
      <p>You have been sent a password reset email;<br /> Please update your password to continue!</p>
    </div>
  );
};

export default SuccessEmail;