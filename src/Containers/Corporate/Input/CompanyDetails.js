import React,{useState} from 'react'
import {Controller} from 'react-hook-form'
import '../CDD.scss'

const CompanyDetails = ({register, errors,control}) => {

  const [showOtherField, setShowOtherField] = useState(false);

  const handleSelectChange = (value) => {
    setShowOtherField(value === 'Other');
    return value === 'Other' ? '' : value;
  };

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

      <label htmlFor="incorporationNumber">Incorporation Number <span className='required'>*</span></label>
      <input type='text' {...register("incorporationNumber", { required: true, minLength: 7, maxLength: 15  })} placeholder='Incorporation Number' />
      {errors.incorporationNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="incorporationState">Incorporation State <span className='required'>*</span></label>
      <input type='text' {...register("incorporationState", { required: true,  minLength: 3, maxLength: 50  })} placeholder='Incorporation State' />
      {errors.incorporationState && <span className="error-message">This field is required</span>}

      <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation/Registration <span className='required'>*</span> </label>
      <input  type="date" {...register("dateOfIncorporationRegistration",{ required: true, minLength: 10, maxLength: 15 })} placeholder='Date Of Incorporation/Registration' />
      {errors.dateOfIncorporationRegistration && <span className="error-message">{errors.dateOfIncorporationRegistration.message}</span>}

      <label htmlFor="natureOfBusiness">Nature of Business<span className='required'>*</span></label>
      <input type='text' {...register("natureOfBusiness", { required: true, minLength: 3, maxLength: 60  })} placeholder='Nature of Company business' />
      {errors.natureOfBusiness && <span className="error-message">This field is required</span>}
        </div>

        <div className='flex-two'>

        <label htmlFor="companyLegalForm">Company Type <span className='required'>*</span></label>
<Controller
  name="companyLegalForm"
  control={control}
  rules={{ required: 'Company Type is required' }}
  defaultValue=""
  render={({ field }) => (
    showOtherField ? (
      <input
        {...field}
        type="text"
        placeholder='Specify Your Company Type'
      />
    ) : (
      <select {...field} onChange={(e) => field.onChange(handleSelectChange(e.target.value))}>
        <option value="Choose Company Type">Company Type</option>
        <option value="Sole-Proprietor">Sole Proprietor</option>
        <option value="Unimited-Liability-Company">Unlimited Liability Company</option>
        <option value="Unlimited-Liability-Company">Limited Liability Company</option>
        <option value="Public-Limited-Company">Public Limited Company</option>
        <option value="Joint-Venture">Joint Venture</option>
        <option value="Other">Other(please specify)</option>
      </select>
    )
  )}
/>
{errors.companyLegalForm && <span className="error-message">This field is required</span>}


        <label htmlFor="emailAddress">Email Address <span className='required'>*</span></label>
      <input   type="email"{...register("emailAddress",{ required: true, pattern: /^\S+@\S+$/i,  minLength: 5, maxLength: 50  })} placeholder='Email Address' />
      {errors.emailAddress && <span className="error-message">Please enter a valid email</span>}

      <label htmlFor="website">Website </label>
      <input type='text' {...register("website", { required: true,})} placeholder='website' />
      {/* {errors.website && <span className="error-message">Please enter a valid website</span>} */}

      <label htmlFor="taxIdentificationNumber">Tax Identification Number <span className='required'>*</span></label>
      <input type='text' {...register("taxIdentificationNumber",  { required: true, minLength: 6, maxLength: 15  })} placeholder='Tax Identification Number' />
      {errors.taxIdentificationNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="telephoneNumber">Telephone Number <span className='required'>*</span></label>
      <input type="number" {...register("telephoneNumber", { required: true, minLength: 5, maxLength: 11 })} placeholder='Telephone Number' />
      {errors.telephoneNumber && <span className="error-message">Please enter a valid phone number</span>}

        </div>
        </div>
    </div>
  )
}

export default CompanyDetails