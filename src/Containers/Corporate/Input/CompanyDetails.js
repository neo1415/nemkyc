import React,{useState} from 'react'
import {Controller} from 'react-hook-form'
import '../CDD.scss'

const CompanyDetails = ({register, errors, formValues, watch, control}) => {

  return (
    <div>    
        <div className='flex-form'>
        <div className='flex-one'>
        <label htmlFor="companyName">Company Name <span className='required'>*</span></label>
      <input type='text' {...register("companyName", { required: false })} placeholder='Company Name' />
      {errors.companyName && <span className="error-message">This field is required</span>}

      <label htmlFor="registeredCompanyAddress">Registered Company Address<span className='required'>*</span></label>
      <input type='text' {...register("registeredCompanyAddress", { required: false })} placeholder='Registered Company Address' />
      {errors.registeredCompanyAddress && <span className="error-message">This field is required</span>}

      <label htmlFor="incorporationNumber">Incorporation Number <span className='required'>*</span></label>
      <input type='text' {...register("incorporationNumber", { required: false })} placeholder='Incorporation Number' />
      {errors.incorporationNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="incorporationState">Registered Office <span className='required'>*</span></label>
      <input type='text' {...register("incorporationState", { required: false })} placeholder='Registered Office' />
      {errors.incorporationState && <span className="error-message">This field is required</span>}

      <label htmlFor="companyLegalForm">Company Type</label>
        <Controller
          name="companyLegalForm"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <select {...field}>
              <option value="Choose Company Type">Company Type</option>
              <option value="Sole-Proprietor">Sole Proprietor</option>
              <option value="Limited-Liability-Company">Limited Liability Company</option>
              <option value="Public-Limited-Company">Public Limited Company</option>
              <option value="Joint-Venture">Joint Venture</option>
              {/* <option value="Other">Other(please specify)</option> */}
            </select>
          )}
        />
      {errors.companyType && <span className="error-message">This field is required</span>}

        </div>

        <div className='flex-two'>
            
      <label htmlFor="dateOfIncorporationRegistration">Date Of Incorporation Registration </label>
      <input  type="date" {...register("dateOfIncorporationRegistration",{ required: false, minLength: 10, maxLength: 15 })} placeholder='Date Of Incorporation Registration' />
      {errors.dateOfIncorporationRegistration && <span className="error-message">This Field is Required</span>}

        <label htmlFor="emailAddress">Email Address <span className='required'>*</span></label>
      <input   type="email"{...register("emailAddress",{ required: false, pattern: /^\S+@\S+$/i })} placeholder='Email Address' />
      {errors.emailAddress && <span className="error-message">Please enter a valid email</span>}

      <label htmlFor="website">Website <span className='required'>*</span></label>
      <input type='text' {...register("website", { required: false,})} placeholder='website' />
      {errors.website && <span className="error-message">Please enter a valid website</span>}

      <label htmlFor="taxIdentificationNumber">Tax Identification Number <span className='required'>*</span></label>
      <input type='text' {...register("taxIdentificationNumber",  { required: false })} placeholder='Tax Identification Number' />
      {errors.taxIdentificationNumber && <span className="error-message">THis field is required</span>}

      <label htmlFor="telephoneNumber">Telephone Number <span className='required'>*</span></label>
      <input type="number" {...register("telephoneNumber", { required: false, minLength: 10, maxLength: 15 })} placeholder='telephone Number' />
      {errors.telephoneNumber && <span className="error-message">Please enter a valid phone number</span>}

        </div>
        </div>
    </div>
  )
}

export default CompanyDetails