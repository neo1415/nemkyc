import React,{useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../../Context/AuthContext'
import './form.scss'

const ResetPassword = () => {

    const [error, setError] = useState(false)
    const [email, setEmail] = useState('')

const {resetPassword} = UserAuth()

const navigate=useNavigate()



const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await resetPassword(email);
      alert("Password reset link sent!");
      navigate('/signin')
    } catch(e){
        setError(e.message)
        console.log(e.message)
    }
  };



  return (
    <div className='login'>
    <div className='loginTitle'>
        <h2>Enter Your Email to reset your password</h2>
    </div>
    <form onSubmit={handleSubmit}> 
    <div className='Inputs'>        
             <label>E-mail</label>
            <input type='email'  onChange={(e)=> setEmail(e.target.value)} />
        </div>
        <button>Send Email</button>

    </form>
</div>
  )
}

export default ResetPassword