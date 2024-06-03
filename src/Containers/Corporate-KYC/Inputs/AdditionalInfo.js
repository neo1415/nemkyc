import React,{useState} from 'react'

const AdditionalInfo = ({register, errors}) => {


  return (
  <div className='individual'>
    <div className='flex-form declaration'>
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
                by law or regulator. 
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
      information to <b>NEM Insurance</b> , if required.       </li>
      {errors.signature2 && <span className="error-message">{errors.signature2.message}</span>}

      <li className='data-privacy'>
      I/We <input type='text' {...register("signature3", 
      { required: true,  minLength: 3, maxLength: 30  })} 
      className='signature-input' placeholder='Your Full Name' /> 
      agree to submit all required and 
      requested for documents and <b>NEM Insurance</b> shall 
       not be held sponsible for any delay in
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