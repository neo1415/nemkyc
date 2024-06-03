import React,{useState} from 'react'
import {Controller} from 'react-hook-form'

const PersonalInfo = ({register, errors,control}) => {

  const [showOtherIncomeField, setShowOtherIncomeField] = useState(false);

  const handleIncomeSelectChange = (value) => {
    setShowOtherIncomeField(value === 'Other');
    return value === 'Other' ? '' : value;
  };

  const [sourceOfIncome, setsourceOfIncome] = useState(false);

  const handleIncomeSourceChange = (value) => {
    setsourceOfIncome(value === 'Other');
    return value === 'Other' ? '' : value;
  };

  return (

<div>
  <div className='flex-form'>
    <div className='flex-one'>

    <label htmlFor="officeLocation">Office Location <span className='required'>*</span></label>
      <input type="text" id="Office Location" placeholder='office Location' {...register("officeLocation", { required: true })}  />
      {errors.officeLocation && <span className="error-message">{errors.officeLocation.message}</span>}

      <label htmlFor="insured">Insured <span className='required'>*</span></label>
      <input type="text" id="insured" placeholder='insured' {...register("insured", { required: true })} />
      {errors.insured && <span className="error-message">{errors.insured.message}</span>}

      <label htmlFor="contactAddress">Contact Address <span className='required'>*</span></label>
      <input type="text" id="contactAddress" placeholder="Contact's Address" {...register("contactAddress", { required: true })} />
      {errors.contactAddress && <span className="error-message">{errors.contactAddress.message}</span>}

      <label htmlFor="occupation">Occupation <span className='required'>*</span></label>
      <input type="text" id="occupation" placeholder='Occupation' {...register("occupation", { required: true })} />
      {errors.occupation && <span className="error-message">{errors.occupation.message}</span>}

      <label htmlFor="gender">Gender <span className='required'>*</span></label>
      <select id="gender" {...register("gender", { required: true })}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      {errors.gender && <span className="error-message">{errors.gender.message}</span>}

      <label htmlFor="dateOfBirth">Date Of Birth <span className='required'>*</span></label>
      <input type="date" id="dateOfBirth" placeholder='Date Of Birth' {...register("dateOfBirth", { required: true })} />
      {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth.message}</span>}

      <label htmlFor="mothersMaidenName">Mothers maiden Name </label>
      <input type="text" id="mothersMaidenName" placeholder='First Name' {...register("mothersMaidenName", { required: true })} />
      {/* {errors.mothersMaidenName && <span className="error-message">{errors.mothersMaidenName.message}</span>} */}

      <label htmlFor="employersName">Employer's Name </label>
        <input type="text" id="employersName" placeholder="Employer's Name" {...register("employersName")} />
        {errors.employersName && <span className="error-message">{errors.employersName.message}</span>}

        <label htmlFor="employersTelephoneNumber">Employer's Telephone Number</label>
        <input type="number" id="employersTelephoneNumber" placeholder="Employer's Telephone Number" {...register("employersTelephoneNumber")} />
        {errors.employersTelephoneNumber && <span className="error-message">{errors.employersTelephoneNumber.message}</span>}

        <label htmlFor="employersAddress">Employer's Address </label>
        <input type="text" id="employersAddress" placeholder='Employers Address' {...register("employersAddress")} />
        {errors.employersAddress && <span className="error-message">{errors.employersAddress.message}</span>}

        <label htmlFor="city">City <span className='required'>*</span></label>
      <input type='text' {...register("city", { required: true,  minLength: 3, maxLength: 50  })} placeholder='city' />
      {errors.city && <span className="error-message">{errors.city.message}</span>}

      <label htmlFor="state">State <span className='required'>*</span></label>
      <input type='text' {...register("state", { required: true,  minLength: 3, maxLength: 50  })} placeholder='State' />
      {errors.state && <span className="error-message">{errors.state.message}</span>}


    </div>

    <div className='flex-two'>

      <label htmlFor="country">Country <span className='required'>*</span></label>
      <input type='text' {...register("country", { required: true,  minLength: 3, maxLength: 50  })} placeholder='Country' />
      {errors.country && <span className="error-message">{errors.country.message}</span>}

      <label htmlFor="nationality">Nationality <span className='required'>*</span></label>
      <select id="nationality" {...register("nationality", { required: true })}>
        <option value="">Select Nationality</option>
        <option value="Nigerian">Nigerian</option>
        <option value="Foreign">Foreign</option>
        <option value="Both">Both</option>
      </select>
      {errors.nationality && <span className="error-message">{errors.nationality.message}</span>}

      <label htmlFor="residentialAddress">Residential Address <span className='required'>*</span></label>
      <input type="text" id="residentialAddress" placeholder='Residential Address' {...register("residentialAddress", { required: true })} />
      {errors.residentialAddress && <span className="error-message">{errors.residentialAddress.message}</span>}

      <label htmlFor="GSMno">Mobile Number <span className='required'>*</span></label>
      <input type="number" id="GSMno" placeholder='Mobile Number' {...register("GSMno", { required: true })} />
      {errors.GSMno && <span className="error-message">{errors.GSMno.message}</span>}


      <label htmlFor="email">Email <span className='required'>*</span></label>
      <input type="email" id="emailAddress" placeholder='Email Address' {...register("emailAddress", { required: true })} />
      {errors.emailAddress && <span className="error-message">{errors.emailAddress.message}</span>}

      <label htmlFor="identificationType">ID Type <span className='required'>*</span></label>
        <select id="identificationType" {...register("identificationType", { required: true })}>
          <option value="Choose ID Type">Choose ID Type</option>
          <option value="international passport">International passport</option>
          <option value="NIMC">NIMC</option>
          <option value="Drivers licence">Drivers Licence</option>
          <option value="Voters Card">Voters Card</option>
          <option value="Voters Card">NIN</option>
        </select>
        {errors.identificationType && <span className="error-message">{errors.identificationType.message}</span>}

        <label htmlFor="idNumber">Identification Number <span className='required'>*</span></label>
      <input type="text" {...register("idNumber", { required: true, minLength: 1, maxLength: 20 })} placeholder='Identification Number' />
      {errors.idNumber && <span className="error-message">This Field is Required</span>}

  <label htmlFor="issuedDate">Issued Date <span className='required'>*</span></label>
      <input type="date" {...register("issuedDate", { required: true })} placeholder='Issued Date' />
      {errors.issuedDate && <span className="error-message">{errors.issuedDate.message}</span>}

      <label htmlFor="expirydDate">Expiry Date  </label>
      <input type="date" {...register("expiryDate")} placeholder='Expiry Date' />
      {errors.expiryDate && <span className="error-message">{errors.expiryDate.message}</span>}

        <label htmlFor="sourceOfIncome">Source of Income <span className='required'>*</span></label>
        <Controller
          name="sourceOfIncome"
          control={control}
          rules={{ required: 'Source of income is required' }}
          defaultValue=""
          render={({ field }) => (
            sourceOfIncome ? (
              <input
                {...field}
                type="text"
                placeholder='Specify Your Income Source'
              />
            ) : (
              <select {...field} onChange={(e) => field.onChange(handleIncomeSourceChange(e.target.value))}>
                <option value="Choose Income Source">Choose Income Source</option>
                <option value="salaryOrBusinessIncome">Salary or Business Income</option>
                <option value="investmentsOrDividends">Investments or Dividends</option>
                <option value="Other">Other(please specify)</option>
              </select>
        )
      )}
    />
      {errors.sourceOfIncome && <span className="error-message">This field is required</span>}

      <label htmlFor="annualIncomeRange">Annual Income Range <span className='required'>*</span></label>
      <select id="annualIncomeRange" name="annualIncomeRange" {...register("annualIncomeRange", { required: true })}>
        <option value="Choose Income Range">Annual Income Range</option>
        <option value="lessThanIMillion">Less Than 1 Million</option>
        <option value="1million-4million">1 Million - 4 Million</option>
        <option value="4.1million-10million">4.1 Million - 10 Million</option>
        <option value="morethan10million">More than 10 Million</option>
      </select> 
      {errors.annualIncomeRange && <span className="error-message">This field is required</span>}
      
      <label htmlFor="premiumPaymentSource">Premium Payment Source <span className='required'>*</span></label>
      <Controller
        name="premiumPaymentSource"
        control={control}
        rules={{ required: 'Source of income is required' }}
        defaultValue=""
        render={({ field }) => (
        showOtherIncomeField ? (
          <input
            {...field}
            type="text"
              placeholder='Specify Your Source of Income'
            />
            ) : (
            <select {...field} onChange={(e) => field.onChange(handleIncomeSelectChange(e.target.value))}>
              <option value="Choose Income Source">Choose Income Source</option>
              <option value="salaryOrBusinessIncome">Salary or Business Income</option>
              <option value="investmentsOrDividends">Investments or Dividends</option>
              <option value="Other">Others(please specify)</option>
            </select>
            )
          )}
        />
        {errors.premiumPaymentSource && <span className="error-message">This field is required</span>}

      </div>
  </div>
</div>
  )
}

export default PersonalInfo