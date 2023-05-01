import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import React,{useState} from 'react'
import { Link,useNavigate } from 'react-router-dom'
import { UserAuth } from '../../Context/AuthContext';
import './form.scss'
import { auth } from '../../APi/index';

const SignUp = () => {

    const [error, setError] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')

    const {createUser}= UserAuth()

    const navigate= useNavigate()

    const handleSubmit = async(e) =>{
        e.preventDefault()
        setError('')
        try{
            await createUser(email, password,name);
            updateProfile(auth.currentUser,{displayName:name})
            navigate('/adminHome')
        } catch(e){
            setError(e.message)
            console.log(e.message)
        }


    }


  return (
    <div className='login'>
        <div className='loginTitle'>
            <h2>Sign Up To Your Account</h2>
            <p>Already Have an account? <Link to='/signin'>Sign in</Link></p>
        </div>
        <form onSubmit={handleSubmit}>
            <div className='Inputs'>
                <label>Email Address</label>
                <input type='email' onChange={(e)=> setEmail(e.target.value)} />
                <label>Name</label>
                <input type='text' onChange={(e)=> setName(e.target.value)} />
                <label>Password</label>
                <input type='password' onChange={(e)=> setPassword(e.target.value)} />
            </div>
            <button className='sign'>Sign Up</button>

        </form>
    </div>
  )
}

export default SignUp