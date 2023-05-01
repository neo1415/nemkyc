// import { createContext, useEffect, useReducer } from "react";
// import AuthReducer from "./AuthReducer,";

// const INITIAL_STATE = {
//   currentUser: JSON.parse(localStorage.getItem("user")) || null,
// };

// export const AuthContext = createContext(INITIAL_STATE);

// export const AuthContextProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

//   useEffect(() => {
//     localStorage.setItem("user", JSON.stringify(state.currentUser));
//   }, [state.currentUser]);

//   return (
//     <AuthContext.Provider value={{ currentUser: state.currentUser, dispatch }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // import {
// //   createUserWithEmailAndPassword,
// //   GoogleAuthProvider,
// //   onAuthStateChanged,
// //   sendPasswordResetEmail,
// //   signInWithEmailAndPassword,
// //   signInWithPopup,
// //   signOut,
// // } from 'firebase/auth';
// // import { useState } from 'react';
// // import { useEffect } from 'react';
// // import { useContext } from 'react';
// // import { createContext } from 'react';
// // import { auth } from '../firebase/config';

// // const authContext = createContext();

// // export const useAuth = () => {
// //   return useContext(authContext);
// // };

// // const AuthContext = ({ children }) => {
// //   const [currentUser, setCurrentUser] = useState(null);
// //   const [modal, setModal] = useState({ isOpen: false, title: '', content: '' });
// //   const [alert, setAlert] = useState({
// //     isAlert: false,
// //     severity: 'info',
// //     message: '',
// //     timeout: null,
// //     location: '',
// //   });
// //   const [loading, setLoading] = useState(false);

// //   const signUp = (email, password) => {
// //     return createUserWithEmailAndPassword(auth, email, password);
// //   };
// //   const login = (email, password) => {
// //     return signInWithEmailAndPassword(auth, email, password);
// //   };
// //   const loginWithGoogle = () => {
// //     const provider = new GoogleAuthProvider();
// //     return signInWithPopup(auth, provider);
// //   };
// //   const logout = () => {
// //     return signOut(auth);
// //   };

// //   const resetPassword = (email) => {
// //     return sendPasswordResetEmail(auth, email);
// //   };

// //   useEffect(() => {
// //     const unsubscribe = onAuthStateChanged(auth, (user) => {
// //       setCurrentUser(user);
// //       console.log('user status changed: ', user);
// //     });
// //     return unsubscribe;
// //   }, []);

// //   const value = {
// //     currentUser,
// //     signUp,
// //     login,
// //     logout,
// //     modal,
// //     setModal,
// //     loginWithGoogle,
// //     alert,
// //     setAlert,
// //     loading,
// //     setLoading,
// //     resetPassword,
// //   };
// //   return <authContext.Provider {...{ value }}>{children}</authContext.Provider>;
// // };

// // export default AuthContext;
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
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    console.log(currentUser)
    setUser(currentUser)
  })
  return () => {
    unsubscribe()
  }
  
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
