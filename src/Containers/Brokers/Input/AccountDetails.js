import React from 'react'

const AccountDetails = ({register, errors, formValues}) => {
    console.log('Form values:', formValues); 
  return (
  <div>
    <div className='flexer'>
    <div className='flex-one'>
    <h3>Local Account Details</h3>

    <label htmlFor="localBankName">Local Bank Name <span className='required'>*</span></label>
      <input type='text' {...register("localBankName", { required: true, minLength: 3, maxLength: 50  })} placeholder='Local Bank Name' />
      {errors.localBankName && <span className="error-message">This field is required</span>}

      <label htmlFor="bankBranch">Bank Branch <span className='required'>*</span></label>
      <input type='text' {...register("bankBranch", { required: true,  minLength: 3, maxLength: 30  })} placeholder='Bank Branch' />
      {errors.bankBranch && <span className="error-message">This field is required</span>}

      <label htmlFor="currentAccountNumber">Current Account Number <span className='required'>*</span></label>
      <input type='number' {...register("currentAccountNumber", { required: true,  minLength: 7, maxLength: 10  })} placeholder='Current Account Number' />
      {errors.currentAccountNumber && <span className="error-message">Please enter a valid account number</span>}

      <label htmlFor="bankBranchName">Bank Branch Name <span className='required'>*</span></label>
      <input type='text' {...register("bankBranchName", { required: true,  minLength: 3, maxLength: 30  })} placeholder='Bank Branch Name' />
      {errors.bankBranchName && <span className="error-message">This field is required</span>}

      <label htmlFor="accountOpeningDate">Account Opening Date <span className='required'>*</span></label>
      <input type='date' {...register("accountOpeningDate", { required: true})} placeholder='Account Opening Date' />
      {errors.accountOpeningDate && <span className="error-message">{errors.accountOpeningDate.message}</span>}

</div>
<div className='flex-two'>
        <h3> Domicilliary Account Details</h3>

      <label htmlFor="domAccountNumber2">Domicilliary Account Number </label>
      <input type='number' {...register("domAccountNumber2")} placeholder='Domicilliary Account Number' />
    
      <label htmlFor="foreignBankName2">Foreign Bank Name </label>
      <input type='text' {...register("foreignBankName2")} placeholder='Foreign Bank Name' />
    
      <label htmlFor="bankBranchName2">Bank Branch Name </label>
      <input type='text' {...register("bankBranchName2")} placeholder='Bank Branch Name' />

      <label htmlFor="currency">Currency </label>
      <input type='text' {...register("currency")} placeholder='currency' />

      <label htmlFor="accountOpeningDate2">Account Opening Date </label>
      <input type='date' {...register("accountOpeningDate2")} placeholder='Account Opening Date' />
      {errors.accountOpeningDate2 && <span className="error-message">{errors.accountOpeningDate2.message}</span>}

     </div>

    </div>
    </div>
  )
}

export default AccountDetails