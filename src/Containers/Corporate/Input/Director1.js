import React,{useState} from 'react'
import {Controller} from 'react-hook-form'
import '../CDD.scss'

const Director1 = ({register, errors, formValues, watch, control}) => {

  const IDType= watch("idType", "");
  const sourceOfIncome= watch("sourceOfIncome", "");
  console.log('Form values:', formValues); 
  return (
    <div>   
      <div className='flex-form'>
      <div className='flex-one'>
      <label htmlFor="firstName">First Name <span className='required'>*</span></label>
      <input type='text' {...register("firstName", { required: false })} placeholder='First Name' />
      {errors.firstName && <span className="error-message">This field is required</span>}

      <label htmlFor="lastName">Last Name<span className='required'>*</span></label>
      <input type='text' {...register("lastName", { required: false })} placeholder='Last Name' />
      {errors.lastName && <span className="error-message">This field is required</span>}

      <label htmlFor="dob">Date of Birth <span className='required'>*</span></label>
      <input type='date' {...register("dob", { required: false })} placeholder='Date of Birth' />
      {errors.dob && <span className="error-message">This field is required</span>}

      <label htmlFor="placeOfBirth">Place Of Birth <span className='required'>*</span></label>
      <input type='text' {...register("placeOfBirth", { required: false })} placeholder='Place Of Birth' />
      {errors.placeOfBirth && <span className="error-message">This field is required</span>}

      <label htmlFor="nationality">Nationality <span className='required'>*</span></label>
      <input type='text' {...register("nationality", { required: false })} placeholder='Nationality' />
      {errors.nationality && <span className="error-message">This field is required</span>}

      <label htmlFor="country">Country <span className='required'>*</span></label>
      <input type='text' {...register("country", { required: false })} placeholder='Country' />
      {errors.country && <span className="error-message">This field is required</span>}

      <label htmlFor="occupation">Occupation <span className='required'>*</span></label>
      <input type='text' {...register("occupation", { required: false })} placeholder='Occupation' />
      {errors.occupation && <span className="error-message">This field is required</span>}

      <label htmlFor="email">Email <span className='required'>*</span></label>
      <input type='email' {...register("email", { required: false, pattern: /^\S+@\S+$/i })} placeholder='email' />
      {errors.email && <span className="error-message">This field is required</span>}

      <label htmlFor="phoneNumber">Phone Number <span className='required'>*</span></label>
      <input type='number' {...register("phoneNumber", { required: false })} placeholder='Phone Number' />
      {errors.phoneNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="BVNNumber">BVN </label>
      <input type='number' {...register("BVNNumber", { required: false })} placeholder='BVN' />
      {errors.BVNNumber && <span className="error-message">This field is required</span>}

        </div>

        <div className='flex-two'>
            
      <label htmlFor="employersName">Employers Name </label>
      <input  type="text" {...register("employersName",{ required: false, minLength: 10, maxLength: 15 })} placeholder='Employers Name' />
      {errors.employersName && <span className="error-message">This Field is Required</span>}

      <label htmlFor="employersPhoneNumber">employers Phone Number </label>
      <input  type="number"{...register("employersPhoneNumber",{ required: false })} placeholder='Employers Phone Number' />
      {errors.employersPhoneNumber && <span className="error-message">Please enter a valid number</span>}

      <label htmlFor="residentialAddress">Residential Address <span className='required'>*</span></label>
      <input type='text' {...register("residentialAddress", { required: false,})} placeholder='Residential Address' />
      {errors.residentialAddress && <span className="error-message">This Field is required</span>}

      <label htmlFor="taxIDNumber">Tax ID Number </label>
      <input type='text' {...register("taxIDNumber",  { required: false })} placeholder='Tax Identification Number' />
      {errors.taxIDNumber && <span className="error-message">THis field is required</span>}

      <label htmlFor="idType">ID Type <span className='required'>*</span></label>
        <Controller
          name="idType"
          control={control}
          defaultValue=""
          rules={{ required: 'ID Type is required' }}
          render={({ field }) => (
            <select {...field}>
              <option value="Choose Identification Type">Choose Identification Type</option>
              <option value="international passport">International passport</option>
              <option value="NIMC">NIMC</option>
              <option value="Drivers licence">Drivers licence</option>
              <option value="Voters Card">Voters Card</option>
              <option value="NIN">NIN</option>
              {/* <option value="Other">Other(please specify)</option> */}
            </select>
          )}
        />
      {errors.idType && <span className="error-message">This field is required</span>}

      <label htmlFor="idNumber">Identification Number <span className='required'>*</span></label>
      <input type="text" {...register("idNumber", { required: false, minLength: 10, maxLength: 15 })} placeholder='Identification Number' />
      {errors.idNumber && <span className="error-message">This Field is Required</span>}

      <label htmlFor="issuingBody">Issuing Body <span className='required'>*</span></label>
      <input type="text" {...register("issuingBody", { required: false, minLength: 10, maxLength: 15 })} placeholder='Issuing Body' />
      {errors.issuingBody && <span className="error-message">This Field is Requiredr</span>}

      <label htmlFor="issuedDate">Issued Date <span className='required'>*</span></label>
      <input type="date" {...register("issuedDate", { required: false, minLength: 10, maxLength: 15 })} placeholder='Issued Date' />
      {errors.issuedDate && <span className="error-message">This Field is Required</span>}

      <label htmlFor="expirydDate">Expiry Date </label>
      <input type="date" {...register("expiryDate", { required: false, minLength: 10, maxLength: 15 })} placeholder='Expiry Date' />
      {errors.expiryDate && <span className="error-message">This Field is Required</span>}

      <label htmlFor="sourceOfIncome">ID Type <span className='required'>*</span></label>
        <Controller
          name="sourceOfIncome"
          control={control}
          rules={{ required: 'ID Type is required' }}
          defaultValue=""
          render={({ field }) => (
            <select {...field}>
              <option value="Choose Income Source">Choose Income Source</option>
              <option value="salaryOrBusinessIncome">Salary Or Business Income</option>
              <option value="investmentsOrDividends">Investments Or Dividends</option>
              {/* <option value="Other">Other(please specify)</option> */}
            </select>
          )}
        />
      {errors.sourceOfIncome && <span className="error-message">This field is required</span>}

        </div>
        </div>
    </div>
  )
}

export default Director1