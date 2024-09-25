import React, {useState} from 'react'
// import { useForm,FormProvider } from 'react-hook-form';
import {Controller} from 'react-hook-form';

const PersonalInfo = ({register, errors, control}) => {

  // const methods = useForm();

  const [showOtherIncomeField, setShowOtherIncomeField] = useState(false);

  const handleIncomeSelectChange = (value) => {
    setShowOtherIncomeField(value === 'Other');
    return value === 'Other' ? '' : value;
  };

  
  return (

<div>
  <div className='flex-form'>


    <div className='flex-one'>

    <label htmlFor="branchOffice">NEM Branch Office <span className='required'>*</span></label>
      <input type="text" id="branchOffice" placeholder='Branch Office' {...register("branchOffice", { required: true })} />
      {errors.branchOffice && <span className="error-message">{errors.branchOffice.message}</span>}
          
      <label htmlFor="insured">Insured <span className='required'>*</span></label>
      <input type="text" id="insured" placeholder='Insured' {...register("insured", { required: true })} />
      {errors.insured && <span className="error-message">{errors.insured.message}</span>}

      <label htmlFor="officeAddress">Office Address <span className='required'>*</span></label>
      <input type="text" id="officeAddress" placeholder="Office Address" {...register("officeAddress", { required: true })} />
      {errors.officeAddress && <span className="error-message">{errors.officeAddress.message}</span>}

      <label htmlFor="ownershipOfCompany">Ownership of Company <span className='required'>*</span></label>
      <select id="ownershipOfCompany" {...register("ownershipOfCompany", { required: true })}>
        <option value="">Select Ownership Of Company</option>
        <option value="Nigerian">Nigerian</option>
        <option value="Foreign">Foreign</option>
        <option value="Both">Both</option>
      </select>
      {errors.ownershipOfCompany && <span className="error-message">{errors.ownershipOfCompany.message}</span>}

      <label htmlFor="contactPerson">Contact Person <span className='required'>*</span></label>
      <input type="text" id="contactPerson" placeholder='Contact Person' {...register("contactPerson", { required: true })} />
      {errors.contactPerson && <span className="error-message">{errors.contactPerson.message}</span>}

      <label htmlFor="website">Website </label>
      <input type='text' {...register("website", { required: true,})} placeholder='website' />
      {/* {errors.website && <span className="error-message">Please enter a valid website</span>} */}

      <label htmlFor="incorporationNumber">Incorporation Number <span className='required'>*</span></label>
      <input type='text' {...register("incorporationNumber", { required: true, minLength: 7, maxLength: 15  })} placeholder='Incorporation Number' />
      {errors.incorporationNumber && <span className="error-message">This field is required</span>}

      <label htmlFor="incorporationState">Incorporation State <span className='required'>*</span></label>
      <input type='text' {...register("incorporationState", { required: true,  minLength: 3, maxLength: 50  })} placeholder='Incorporation State' />
      {errors.incorporationState && <span className="error-message">This field is required</span>}


    </div>

    <div className='flex-two'>

    <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation/Registration <span className='required'>*</span> </label>
      <input  type="date" {...register("dateOfIncorporationRegistration",{ required: true, minLength: 10, maxLength: 15 })} placeholder='Date Of Incorporation/Registration' />
      {errors.dateOfIncorporationRegistration && <span className="error-message">{errors.dateOfIncorporationRegistration.message}</span>}

      <label htmlFor="BVNNumber">BVN  <span className='required'>*</span> </label>
      <input type='number' {...register("BVNNumber", { required: true,  minLength:11, maxLength: 11 })} placeholder='BVN' />
      {errors.BVNNumber && <span className="error-message">{errors.BVNNumber.message}</span>}

    <label htmlFor="contactPersonNo">Contact Person Mobile Number <span className='required'>*</span></label>
      <input type="number" id="contactPersonNo" placeholder='Contact Phone Number' {...register("contactPersonNo", { required: true })} />
      {errors.contactPersonNo && <span className="error-message">Phone Number is required</span>}
    
      <label htmlFor="taxIDNo">Tax Identification Number  </label>
      <input type='text' {...register("taxIDNo",  { required: false, minLength: 6, maxLength: 15  })} placeholder='Tax Identification Number' />
      {/* {errors.taxIDNo && <span className="error-message">This field is required</span>} */}

    <label htmlFor="emailAddress">Email Address <span className='required'>*</span></label>
      <input type="email" id="emailAddress" placeholder='Email Address' {...register("emailAddress", { required: true })} />
      {errors.emailAddress && <span className="error-message">{errors.emailAddress.message}</span>}

      <label htmlFor="natureOfBusiness">Business Type/Occupation<span className='required'>*</span></label>
      <input type='text' {...register("natureOfBusiness", { required: true, minLength: 3, maxLength: 60  })} placeholder='Nature of Business' />
      {errors.natureOfBusiness && <span className="error-message">This field is required</span>}

      <label htmlFor="estimatedTurnover">Estimated Turnover <span className='required'>*</span></label>
      <select id="estimatedTurnover" name="estimatedTurnover" {...register("estimatedTurnover", { required: true })}>
        <option value="Choose Income Range">Annual Income Range</option>
        <option value="lessThanI0Million">Less Than 10 Million</option>
        <option value="11million-50million">11 Million - 50 Million</option>
        <option value="51million-200million">51 Million - 200 Million</option>
        <option value="morethan200million">More than 200 Million</option>
      </select> 
      {errors.estimatedTurnover && <span className="error-message">This field is required</span>}
      
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
              <option value="Other">Other(please specify)</option>
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