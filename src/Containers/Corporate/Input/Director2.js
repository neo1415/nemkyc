import React,{useState} from 'react'
import {Controller} from 'react-hook-form'
import '../CDD.scss'

const Director2 = ({register, errors, formValues, control}) => {

  const [showOtherIncomeField2, setShowOtherIncomeField2] = useState(false);

  const handleIncomeSelectChange2 = (value) => {
    setShowOtherIncomeField2(value === 'Other');
    return value === 'Other' ? '' : value;
  };

  console.log('Form values:', formValues); 
  return (
    <div>   
        <div className='flex-form'>
        <div className='flex-one'>
        <label htmlFor="firstName2">First Name </label>
        <input type='text' {...register("firstName2", { required: false })} placeholder='First Name' />
        {errors.firstName2 && <span className="error-message">This field is required</span>}

        <label htmlFor="middleName2">Middle Name </label>
      <input type='text' {...register("middleName2", { minLength: 3, maxLength: 30  })} placeholder='Middle Name' />

      <label htmlFor="lastName2">Last Name</label>
      <input type='text' {...register("lastName2", { required: false })} placeholder='Last Name' />
      {errors.lastName2 && <span className="error-message">This field is required</span>}

      <label htmlFor="dob2">Date of Birth </label>
      <input type='date' {...register("dob2", { required: false })} placeholder='Date of Birth' />
      {errors.dob2 && <span className="error-message">{errors.dob2.message}</span>}

      <label htmlFor="placeOfBirth2">Place Of Birth </label>
      <input type='text' {...register("placeOfBirth2", { required: false })} placeholder='Place Of Birth' />
      {errors.placeOfBirth2 && <span className="error-message">This field is required</span>}

      <label htmlFor="nationality2">Nationality </label>
      <input type='text' {...register("nationality2", { required: false })} placeholder='Nationality' />
      {errors.nationality2 && <span className="error-message">This field is required</span>}

      <label htmlFor="country2">Country </label>
      <input type='text' {...register("country2", { required: false })} placeholder='Country' />
      {errors.country2 && <span className="error-message">This field is required</span>}

      <label htmlFor="occupation2">Occupation </label>
      <input type='text' {...register("occupation2", { required: false })} placeholder='Occupation' />
      {errors.occupation2 && <span className="error-message">This field is required</span>}

      <label htmlFor="email2">Email </label>
      <input type='email' {...register("email2", { required: false, pattern: /^\S+@\S+$/i })} placeholder='Email' />
      {errors.email2 && <span className="error-message">This field is required</span>}

      <label htmlFor="BVNNumber2">BVN </label>
      <input type='number' {...register("BVNNumber2", { required: false })} placeholder='BVN' />
      {errors.BVNNumber2 && <span className="error-message">{errors.BVNNumber2.message}</span>}

      <label htmlFor="phoneNumber2">Phone Number </label>
      <input type='number' {...register("phoneNumber2")} placeholder='Phone Number' />
      {errors.phoneNumber2 && <span className="error-message">This field is required</span>}

   </div>

        <div className='flex-two'>
            
      <label htmlFor="employersName2">Employers Name </label>
      <input  type="text" {...register("employersName2",{ required: false, minLength: 10, maxLength: 15 })} placeholder='Employers Name' />
      {errors.employersName2 && <span className="error-message">This Field is Required</span>}

      <label htmlFor="employersPhoneNumber2">Employers Phone Number </label>
      <input  type="number"{...register("employersPhoneNumber2")} placeholder='Employers Phone Number' />

      <label htmlFor="residentialAddress2">Residential Address </label>
      <input type='text' {...register("residentialAddress2", { required: false,})} placeholder='Residential Address' />
      {errors.residentialAddress2 && <span className="error-message">{errors.residentialAddress2.message}</span>}

      <label htmlFor="taxIDNumber2">Tax ID Number </label>
      <input type='text' {...register("taxIDNumber2",  { required: false })} placeholder='Tax Identification Number' />

      <label htmlFor="idType2">ID Type</label>
        <Controller
          name="idType2"
          control={control}
          defaultValue=""
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
    

      <label htmlFor="idNumber2">Identification Number </label>
      <input type="text" {...register("idNumber2", { required: false, minLength: 5, maxLength: 15 })} placeholder='Identification Number' />
      {errors.idNumber2 && <span className="error-message">{errors.idNumber2.message}</span>}

      <label htmlFor="issuingBody2">Issuing Body </label>
      <input type="text" {...register("issuingBody2", { required: false, minLength: 1, maxLength: 15 })} placeholder='Issuing Body' />
      {errors.issuingBody2 && <span className="error-message">{errors.issuingBody2.message}</span>}

      <label htmlFor="issuedDate2">Issued Date </label>
      <input type="date" {...register("issuedDate2", { required: false, minLength: 10, maxLength: 15 })} placeholder='Issued Date' />
      {errors.issuedDate2 && <span className="error-message">{errors.issuedDate2.message}</span>}

      <label htmlFor="expiryDate2">Expiry Date </label>
      <input type="date" {...register("expiryDate2", { required: false, minLength: 10, maxLength: 15 })} placeholder='Expiry Date' />
      {errors.expiryDate2 && <span className="error-message">This Field is Required</span>}

      <label htmlFor="sourceOfIncome2">Source of Income </label>
<Controller
  name="sourceOfIncome2"
  control={control}
  rules={{ required: 'ID Type is required' }}
  defaultValue=""
  render={({ field }) => (
    showOtherIncomeField2 ? (
      <input
        {...field}
        type="text"
        placeholder='Specify Your Income Source'
      />
    ) : (
      <select {...field} onChange={(e) => field.onChange(handleIncomeSelectChange2(e.target.value))}>
        <option value="Choose Income Source">Choose Income Source</option>
        <option value="salaryOrBusinessIncome">Salary or Business Income</option>
        <option value="investmentsOrDividends">Investments or Dividends</option>
        <option value="Other">Other(please specify)</option>
      </select>
    )
  )}
/>

        </div>
        </div>
    </div>
  )
}

export default Director2