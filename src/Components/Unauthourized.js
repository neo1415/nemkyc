import React from 'react'
import './Unauthourized.scss'

const Unauthourized = () => {
  return (
    <div className='unauthourized'>
    <div className="lock"></div>
        <div className="message">
        <h1>Access to this page is restricted</h1>
        <p>Please check with the site admin if you believe this is a mistake.</p>
        </div>
    </div>
  )
}

export default Unauthourized