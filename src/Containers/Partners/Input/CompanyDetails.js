import React from 'react'
import '../CDD.scss'

const CompanyDetails = ({register, errors}) => {

  return (
    <div>    
        <div className='flex-form'>
        <div className='flex-one'>
        <label htmlFor="companyName">Company Name <span className='required'>*</span></label>
      <input type='text' {...register("companyName", { required: true,  minLength: 3, maxLength: 50  })} placeholder='Company Name' />
      {errors.companyName && <span className="error-message">{errors.companyName.message}</span>}

      <label htmlFor="registeredCompanyAddress">Registered Company Address<span className='required'>*</span></label>
      <input type='text' {...register("registeredCompanyAddress", { required: true, minLength: 3, maxLength: 60  })} placeholder='Registered Company Address' />
      {errors.registeredCompanyAddress && <span className="error-message">This field is required</span>}

      <label htmlFor="city">City <span className='required'>*</span></label>
      <input type='text' {...register("city", { required: true,  minLength: 3, maxLength: 50  })} placeholder='city' />
      {errors.city && <span className="error-message">{errors.city.message}</span>}

      <label htmlFor="state">State <span className='required'>*</span></label>
      <input type='text' {...register("state", { required: true,  minLength: 3, maxLength: 50  })} placeholder='State' />
      {errors.state && <span className="error-message">{errors.state.message}</span>}

      <label htmlFor="country">Country <span className='required'>*</span></label>
      <input type='text' {...register("country", { required: true,  minLength: 3, maxLength: 50  })} placeholder='Country' />
      {errors.country && <span className="error-message">{errors.country.message}</span>}

      <label htmlFor="telephoneNumber"> Contact Telephone Number <span className='required'>*</span></label>
      <input type="number" {...register("telephoneNumber", { required: true, minLength: 5, maxLength: 11 })} placeholder='telephone Number' />
      {errors.telephoneNumber && <span className="error-message">Please enter a valid phone number</span>}

      <label htmlFor="emailAddress">Email Address <span className='required'>*</span></label>
      <input   type="email"{...register("emailAddress",{ required: true, pattern: /^\S+@\S+$/i,  minLength: 5, maxLength: 50  })} placeholder='Email Address' />
      {errors.emailAddress && <span className="error-message">Please enter a valid email</span>}
     
      <label htmlFor="website">Website </label>
      <input type='text' {...register("website", { required: true,})} placeholder='website' />
      {/* {errors.website && <span className="error-message">Please enter a valid website</span>} */}
   
      <label htmlFor="contactPerson">Contact Person (Name) <span className='required'>*</span></label>
      <input type='text' {...register("contactPerson",  { required: true, minLength: 6, maxLength: 15  })} placeholder='Contact Person' />
      {errors.contactPerson && <span className="error-message">THis field is required</span>}

      <label htmlFor="contactPersonNo">Contact Person Number <span className='required'>*</span></label>
      <input type='text' {...register("contactPersonNo",  { required: true, minLength: 6, maxLength: 15  })} placeholder='Contact Person Number' />
      {errors.contactPersonNo && <span className="error-message">THis field is required</span>}

      
        </div>

        <div className='flex-two'>

        <label htmlFor="taxIdentificationNumber">Tax Identification Number <span className='required'>*</span></label>
      <input type='text' {...register("taxIdentificationNumber",  { required: true, minLength: 6, maxLength: 15  })} placeholder='Tax Identification Number' />
      {errors.taxIdentificationNumber && <span className="error-message">THis field is required</span>}

      <label htmlFor="VATRegistrationNumber">VAT Registration Number <span className='required'>*</span></label>
      <input type='text' {...register("VATRegistrationNumber",  { required: true, minLength: 6, maxLength: 15  })} placeholder='VAT Registration Number' />
      {errors.VATRegistrationNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="incorporationNumber">Incorporation/RC Number <span className='required'>*</span></label>
      <input type='text' {...register("incorporationNumber", { required: true, minLength: 7, maxLength: 15  })} placeholder='Incorporation Number' />
      {errors.incorporationNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="dateOfIncorporationRegistration">Date Of Incorporation Registration <span className='required'>*</span> </label>
      <input  type="date" {...register("dateOfIncorporationRegistration",{ required: true, minLength: 10, maxLength: 15 })} placeholder='NAICOM Issuing Date' />
      {errors.dateOfIncorporationRegistration && <span className="error-message">This Field is Required</span>}

      <label htmlFor="incorporationState">Incorporation State <span className='required'>*</span></label>
      <input type='text' {...register("incorporationState", { required: true,  minLength: 3, maxLength: 50  })} placeholder='Incorporation State' />
      {errors.incorporationState && <span className="error-message">This field is required</span>}

      <label htmlFor="natureOfBusiness">Nature of Business<span className='required'>*</span></label>
      <input type='text' {...register("natureOfBusiness", { required: true, minLength: 3, maxLength: 60  })} placeholder='Nature of Company business' />
      {errors.natureOfBusiness && <span className="error-message">This field is required</span>}

      <label htmlFor="BVNNo">BVN  <span className='required'>*</span> </label>
      <input type='number' {...register("BVNNo", { required: true,  minLength:11, maxLength: 11 })} placeholder='BVN' />
      {errors.BVNNo && <span className="error-message">This field is required</span>}

      <label htmlFor="NAICOMLisenceIssuingDate">NAICOM Lisence Issuing Date <span className='required'>*</span> </label>
      <input  type="date" {...register("NAICOMLisenceIssuingDate",{ required: true, minLength: 10, maxLength: 15 })} placeholder='NAICOM Expiry Date' />
      {errors.NAICOMLisenceIssuingDate && <span className="error-message">This Field is Required</span>}

      <label htmlFor="NAICOMLisenceExpiryDate">NAICOM Lisence Expiry Date <span className='required'>*</span> </label>
      <input  type="date" {...register("NAICOMLisenceExpiryDate",{ required: true, minLength: 10, maxLength: 15 })} placeholder='Date Of Incorporation Registration' />
      {errors.NAICOMLisenceExpiryDate && <span className="error-message">This Field is Required</span>}
    
        </div>
        </div>
    </div>
  )
}

export default CompanyDetails