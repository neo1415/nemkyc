import { useState, useEffect } from 'react';
import { doc, getDoc } from '@firebase/firestore'; // import firebase firestore
import { db } from '../APi';// import your firebase config

const useFetchUserRole = (user) => {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(db, 'userroles', user.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().role);
        }
      }
    };
  
    fetchUserRole();
  }, [user]);

  return userRole;
};

export default useFetchUserRole;
