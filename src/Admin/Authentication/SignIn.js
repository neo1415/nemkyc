import React,{useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../../Context/AuthContext'
import './form.scss'

const SignIn = () => {

    const [error, setError] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

const {signIn} = UserAuth()

const navigate=useNavigate()

const handleSubmit = async(e) =>{
    e.preventDefault()
    setError('')
    try{
        await signIn(email, password);
        navigate('/adminHome')
    } catch(e){
        setError(e.message)
        console.log(e.message)
    }


}

  return (
    <div className='login'>
    <div className='loginTitle'>
        <h2>Sign In To Your Account</h2>
        <p>Dont Have an account yet? <Link to='/signup'>Sign up</Link></p>
    </div>
    <form onSubmit={handleSubmit}> 
    <div className='Inputs'>
            <label>Email Address</label>
            <input type='email' onChange={(e)=> setEmail(e.target.value)} />

            <label>Password</label>
            <input type='password'  onChange={(e)=> setPassword(e.target.value)} />
        </div>
        { error && <span className='error'>Wrong Email or Password</span>}
        <button>Log In</button>
        <p><Link to='/resetpassword'>Forgot Password</Link></p>

    </form>
</div>
  )
}

export default SignIn