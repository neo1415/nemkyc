import React from 'react'

const AdditionalInfo = ({register, errors}) => {


  return (
  <div className='individual-c'>

<div className='flexer'>
    <div className='flex-one'>
    <h3>Local Account Details</h3>

    <label htmlFor="bankName">Bank Name <span className='required'>*</span></label>
      <input type='text' {...register("bankName", { required: true, minLength: 3, maxLength: 50  })} placeholder='Bank Name' />
      {errors.bankName && <span className="error-message">This field is required</span>}

      <label htmlFor="accountNumber">Account Number <span className='required'>*</span></label>
      <input type='number' {...register("accountNumber", { required: true,  minLength: 7, maxLength: 10  })} placeholder='Account Number' />
      {errors.accountNumber && <span className="error-message">Please enter a valid account number</span>}

      <label htmlFor="bankBranch">Bank Branch <span className='required'>*</span></label>
      <input type='text' {...register("bankBranch", { required: true,  minLength: 3, maxLength: 30  })} placeholder='Bank Branch' />
      {errors.bankBranch && <span className="error-message">This field is required</span>}

      <label htmlFor="accountOpeningDate">Account Opening Date <span className='required'>*</span></label>
      <input type='date' {...register("accountOpeningDate", { required: true})} placeholder='Account Opening Date' />
      {errors.accountOpeningDate && <span className="error-message">{errors.accountOpeningDate.message}</span>}

</div>
<div className='flex-two'>
        <h3> Foreign Account Details</h3>

      <label htmlFor="bankName2">Bank Name </label>
      <input type='text' {...register("bankName2")} placeholder='Bank Name' />
    
      <label htmlFor="accountNumber2">Account Number </label>
      <input type='number' {...register("accountNumber2")} placeholder='Account Number' />
    
      <label htmlFor="bankBranch2">Bank Branch </label>
      <input type='text' {...register("bankBranch2")} placeholder='Bank Branch' />

      <label htmlFor="accountOpeningDate2">Account Opening Date </label>
      <input type='date' {...register("accountOpeningDate2")} placeholder='Account Opening Date' />
      {errors.accountOpeningDate2 && <span className="error-message">{errors.accountOpeningDate2.message}</span>}
     </div>

    </div>

    <div className='flex-form declaration'>
    <h3>Privacy Statement</h3>
        <div className='flex-one border-flex'>
            <ul className='privacy-list'>
                <li className='data-privacy'>
                Your data will solemnly be used for the purposes of this business 
                contract and also to enable us reach you with the 
                updates about our products and services. 
                </li>  
<hr></hr>
                <li className='data-privacy'>
                Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria 
                Data Protection Act 2023.
                </li>  
<hr></hr>
                <li className='data-privacy'>
                Your personal data shall not be shared with or sold 
                to any third-party without your consent unless we are compelled 
                by law or regulatory bodies. 
                </li>  
            </ul>     
          </div>

      <div className='flex-two'>
        <h2 className='declaration-head'> Declaration</h2>
     <ol>
      <li className='data-privacy'>
      I/We <input type='text' {...register("signature1",
       { required: true,  minLength: 3, maxLength: 30  })} 
       className='signature-input' placeholder='Your Full Name' />
       declare to the best of my/our knowledge 
      and belief that the information given on this 
      form is true in every respect and agree that if
       I/we have made any false or fraudulent statement,
        be it suppression or concealment, the policy shall
         be cancelled and the claim shall be forfeited. 
      </li>
      {errors.signature1 && <span className="error-message">{errors.signature1.message}</span>}
      <li className='data-privacy'>
      I/We <input type='text' {...register("signature2", 
      { required: true,  minLength: 3, maxLength: 30  })} 
      className='signature-input' placeholder='Your Full Name' />
       agree to provide additional 
      information to <b>NEM Insurance Plc</b> , if required.       </li>
      {errors.signature2 && <span className="error-message">{errors.signature2.message}</span>}

      <li className='data-privacy'>
      I/We <input type='text' {...register("signature3", 
      { required: true,  minLength: 3, maxLength: 30  })} 
      className='signature-input' placeholder='Your Full Name' /> 
      agree to submit all required and 
      requested for documents and <b>NEM Insurance Plc</b> shall 
       not be held responsible for any delay in
      settlement of claim due to non-fulfillment of 
       requirements. 
      </li>
      {errors.signature3 && <span className="error-message">{errors.signature3.message}</span>}
     </ol>
      </div>
          </div>
    </div>
  )
}

export default AdditionalInfo