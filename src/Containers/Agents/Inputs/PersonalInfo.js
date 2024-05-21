import React,{useState} from 'react'
import {Controller} from 'react-hook-form'

const PersonalInfo = ({register, errors, control}) => {

  const [showOtherIncomeField, setShowOtherIncomeField] = useState(false);

  const handleIncomeSelectChange = (value) => {
    setShowOtherIncomeField(value === 'Other');
    return value === 'Other' ? '' : value;
  };

  return (

<div>
  <div className='flex-form'>
    <div className='flex-one'>

      <label htmlFor="firstName">First Name <span className='required'>*</span></label>
      <input type="text" id="firstName" placeholder='First Name' {...register("firstName", { required: true })} />
      {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}

      <label htmlFor="middleName">Middle Name </label>
      <input type='text' {...register("middleName", { minLength: 3, maxLength: 30  })} placeholder='Middle Name' />

      <label htmlFor="lastName">Last Name <span className='required'>*</span></label>
      <input type="text" id="lastName" placeholder='Last Name' {...register("lastName", { required: true })} />
      {errors.lastName && <span className="error-message">{errors.lastName.message}</span>}

      <label htmlFor="residentialAddress">Residential Address <span className='required'>*</span></label>
      <input type="text" id="residentialAddress" placeholder='Residential Address' {...register("residentialAddress", { required: true })} />
      {errors.residentialAddress && <span className="error-message">{errors.residentialAddress.message}</span>}

      <label htmlFor="gender">Gender <span className='required'>*</span></label>
      <select id="gender" {...register("gender", { required: true })}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      {errors.gender && <span className="error-message">{errors.gender.message}</span>}

      <label htmlFor="position">Position/Role </label>
      <input type='text' {...register("position", { required: true, minLength: 3, maxLength: 30 })} placeholder='Position' />

      <label htmlFor="dateOfBirth">Date Of Birth <span className='required'>*</span></label>
      <input type="date" id="dateOfBirth" placeholder='Date Of Birth' {...register("dateOfBirth", { required: true })} />
      {errors.dateOfBirth && <span className="error-message">Date of Birth is required</span>}

      <label htmlFor="placeOfBirth">Place of Birth <span className='required'>*</span></label>
      <input type="text" id="placeOfBirth" placeholder='Place Of Birth' {...register("placeOfBirth", { required: true })} />
      {errors.placeOfBirth && <span className="error-message">{errors.placeOfBirth.message}</span>}

      <label htmlFor="sourceOfIncome">Other Source of Income <span className='required'>*</span></label>
        <Controller
          name="sourceOfIncome"
          control={control}
          rules={{ required: 'Source of income is required' }}
          defaultValue=""
          render={({ field }) => (
            showOtherIncomeField ? (
              <input
                {...field}
                type="text"
                placeholder='Specify Your Income Source'
              />
            ) : (
              <select {...field} onChange={(e) => field.onChange(handleIncomeSelectChange(e.target.value))}>
                <option value="Choose Income Source">Choose Income Source</option>
                <option value="salaryOrBusinessIncome">Salary Or Business Income</option>
                <option value="investmentsOrDividends">Investments Or Dividends</option>
                <option value="Other">Other(please specify)</option>
              </select>
    )
  )}
/>
{errors.sourceOfIncome && <span className="error-message">This field is required</span>}

<label htmlFor="nationality">Nationality <span className='required'>*</span></label>
      <input type="text" id="nationality" placeholder='Nationality' {...register("nationality", { required: true })} />
      {errors.nationality && <span className="error-message">{errors.nationality.message}</span>}


      
    </div>

    <div className='flex-two'>

    <label htmlFor="GSMno">Phone Number <span className='required'>*</span></label>
      <input type="number" id="GSMno" placeholder='Mobile Number' {...register("GSMno", { required: true })} />
      {errors.GSMno && <span className="error-message">{errors.GSMno.message}</span>}

    <label htmlFor="BVNNumber">BVN  <span className='required'>*</span> </label>
      <input type='number' {...register("BVNNumber", { required: true,  minLength:11, maxLength: 11 })} placeholder='BVN' />
      {errors.BVNNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="taxIDNumber">Tax ID Number </label>
      <input type='text' {...register("taxIDNumber")} placeholder='Tax Identification Number' />
      {/* {errors.taxIDNumber && <span className="error-message">THis field is required</span>} */}

      <label htmlFor="occupation">Occupation <span className='required'>*</span></label>
      <input type="text" id="occupation" placeholder='Occupation' {...register("occupation", { required: true })} />
      {errors.occupation && <span className="error-message">{errors.occupation.message}</span>}

      <label htmlFor="email">Email <span className='required'>*</span></label>
      <input type="email" id="emailAddress" placeholder='Email Address' {...register("emailAddress", { required: true })} />
      {errors.emailAddress && <span className="error-message">{errors.emailAddress.message}</span>}
    
    <label htmlFor="idType"> Valid means of ID  <span className='required'>*</span></label>
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
              {/* <option value="Other">Other(please specify)</option> */}
            </select>
          )}
        />
      {errors.idType && <span className="error-message">This field is required</span>}

      <label htmlFor="idNumber">Identification Number <span className='required'>*</span></label>
      <input type="text" {...register("idNumber", { required: true, minLength: 1, maxLength: 20 })} placeholder='Identification Number' />
      {errors.idNumber && <span className="error-message">This Field is Required</span>}

      <label htmlFor="issuedDate">Issued Date <span className='required'>*</span></label>
      <input type="date" {...register("issuedDate", { required: true })} placeholder='Issued Date' />
      {errors.issuedDate && <span className="error-message">This Field is Required</span>}

      <label htmlFor="expirydDate">Expiry Date </label>
      <input type="date" {...register("expiryDate" ,{ required: false })} placeholder='Expiry Date' />
      {errors.expiryDate && <span className="error-message">{errors.expiryDate.message}</span>}
      
      <label htmlFor="issuingBody">Issuing Body <span className='required'>*</span></label>
      <input type="text" {...register("issuingBody", { required: true, minLength: 1, maxLength: 50 })} placeholder='Issuing Body' />
      {errors.issuingBody && <span className="error-message">This Field is Requiredr</span>}

    </div>
  </div>
</div>
  )
}

export default PersonalInfo