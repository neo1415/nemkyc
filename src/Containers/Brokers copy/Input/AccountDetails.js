import React from 'react'

const AccountDetails = ({register, errors, formValues}) => {
    console.log('Form values:', formValues); 
  return (
  <div>
    <div className='flexer'>
    <div className='flex-one'>
    <h3>Local Account Details</h3>

    <label htmlFor="accountNumber">Account Number <span className='required'>*</span></label>
      <input type='number' {...register("accountNumber", { required: true,  minLength: 7, maxLength: 10  })} placeholder='Account Number' />
      {errors.accountNumber && <span className="error-message">Please enter a valid account number</span>}

    <label htmlFor="bankName">Bank Name <span className='required'>*</span></label>
      <input type='text' {...register("bankName", { required: true, minLength: 3, maxLength: 50  })} placeholder='Bank Name' />
      {errors.bankName && <span className="error-message">This field is required</span>}

      <label htmlFor="bankBranch">Bank Branch <span className='required'>*</span></label>
      <input type='text' {...register("bankBranch", { required: true,  minLength: 3, maxLength: 30  })} placeholder='Bank Branch' />
      {errors.bankBranch && <span className="error-message">This field is required</span>}

      <label htmlFor="accountOpeningDate">Account Opening Date <span className='required'>*</span></label>
      <input type='date' {...register("accountOpeningDate", { required: true})} placeholder='Account Opening Date' />
      {errors.accountOpeningDate && <span className="error-message">This field is required</span>}

</div>
<div className='flex-two'>
        <h3> Foreign Account Details</h3>

      <label htmlFor="accountNumber2">Account Number </label>
      <input type='number' {...register("accountNumber2")} placeholder='Account Number' />
    
      <label htmlFor="bankName2">Bank Name </label>
      <input type='text' {...register("bankName2")} placeholder='Bank Name' />
    
      <label htmlFor="bankBranch2">Bank Branch </label>
      <input type='text' {...register("bankBranch2")} placeholder='Bank Branch' />

      <label htmlFor="accountOpeningDate2">Account Opening Date </label>
      <input type='date' {...register("accountOpeningDate2")} placeholder='Account Opening Date' />

     </div>

    </div>
    </div>
  )
}

export default AccountDetails