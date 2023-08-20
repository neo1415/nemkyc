import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function useAutoLogout({ timeoutDuration, logout, redirectPath }) {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const resetTimer = () => {
      setIsActive(true);
    };

    const setInactive = () => {
      setIsActive(false);
    };

    // Attach event listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('blur', setInactive);
    window.addEventListener('visibilitychange', setInactive);

    // Set a timer to check inactivity and log out if needed
    const logoutTimer = setInterval(() => {
      if (!isActive) {
        // Use the IIFE to handle the asynchronous logout function
        (async () => {
          try {
            await logout();
            navigate(redirectPath);
          } catch (e) {
            console.error('Error during logout:', e.message);
          }
        })();
      }
    }, timeoutDuration);

    // Clean up event listeners and timer on component unmount
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('blur', setInactive);
      window.removeEventListener('visibilitychange', setInactive);
      clearInterval(logoutTimer);
    };
  }, [isActive, logout, navigate, redirectPath]);
}

export default useAutoLogout;
