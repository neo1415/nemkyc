import React from 'react'

const AccountDetails = ({register, errors, formValues, watch, control}) => {
    console.log('Form values:', formValues); 
  return (
  <div>
    <div className='flexer'>
    <div className='flex-one'>
    <h3>Local Account Details</h3>

    <label htmlFor="bankName">Bank Name <span className='required'>*</span></label>
      <input type='text' {...register("bankName", { required: false })} placeholder='Bank Name' />
      {errors.bankName && <span className="error-message">This field is required</span>}

      <label htmlFor="accountNumber">First Name <span className='required'>*</span></label>
      <input type='number' {...register("accountNumber", { required: false })} placeholder='Account Number' />
      {errors.accountNumber && <span className="error-message">Please enter a valid account number</span>}

      <label htmlFor="bankBranch">Bank Branch <span className='required'>*</span></label>
      <input type='text' {...register("bankBranch", { required: false })} placeholder='Bank Branch' />
      {errors.bankBranch && <span className="error-message">This field is required</span>}

</div>
<div className='flex-two'>
        <h3> Foreign Account Details</h3>

      <label htmlFor="bankName2">Bank Name <span className='required'>*</span></label>
      <input type='text' {...register("bankName2", { required: false })} placeholder='Bank Name' />
      {errors.bankName2 && <span className="error-message">This field is required</span>}

      <label htmlFor="accountNumber2">Account Number <span className='required'>*</span></label>
      <input type='number' {...register("accountNumber2", { required: false })} placeholder='Account Number' />
      {errors.accountNumber2 && <span className="error-message">Please Enter a Valid Account Number</span>}

      <label htmlFor="bankBranch2">Bank Branch <span className='required'>*</span></label>
      <input type='text' {...register("bankBranch2", { required: false })} placeholder='Bank Branch' />
      {errors.bankBranch2 && <span className="error-message">This field is required</span>}

     </div>

    </div>
    </div>
  )
}

export default AccountDetails