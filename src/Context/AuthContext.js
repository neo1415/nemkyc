import { createContext,useContext } from 'react';
import {useState, useEffect} from 'react'
import { auth } from '../APi/index';
import {
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';

export const UserContext = createContext()



export const AuthContextProvider = ({children}) => {
  const [user, setUser] = useState({})

const createUser= (email, password,name)=>{
  return createUserWithEmailAndPassword(auth, email, password,name)
}

const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

const resetPassword=(email)=>{
  return sendPasswordResetEmail(auth,email)
}

const logout= ()=>{
  return signOut(auth)
}

useEffect(() => {
  // Get user data from local storage on component mount
  const storedUser = JSON.parse(localStorage.getItem('user'));

  // Set the initial user state from local storage
  if (storedUser) {
    setUser(storedUser);
  }

  // Set up an observer to track user authentication state changes
  const unsubscribe = onAuthStateChanged(auth, (authUser) => {
    if (authUser) {
      // User is signed in
      setUser(authUser);

      // Store user data in local storage on login
      localStorage.setItem('user', JSON.stringify(authUser));
    } else {
      // User is signed out
      setUser(null);

      // Remove user data from local storage on logout
      localStorage.removeItem('user');
    }
  });

  // Clean up the observer on unmount
  return () => unsubscribe();
}, []);
  return(
    <UserContext.Provider value={{createUser, user, logout, signIn, resetPassword}}>
      {children}
    </UserContext.Provider>
  )
}

export const UserAuth=() => {
  return useContext(UserContext);
}
