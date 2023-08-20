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
    // console.log(currentUser)
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
