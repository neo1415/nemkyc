import React, { useEffect } from 'react';
import { navigate } from '@reach/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function AdminAccess({ children }) {
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in.
        user.getIdTokenResult().then((idTokenResult) => {
          const isAdmin = !!idTokenResult.claims.admin;
          if (!isAdmin) {
            navigate('/non-admin-page');
          }
        });
      } else {
        // User is signed out.
        // You can handle this case as needed.
        // For example, you can redirect them to the sign-in page.
        navigate('/signin');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth]);

  return <>{children}</>;
}

export default AdminAccess;
