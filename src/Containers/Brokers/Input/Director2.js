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

      <label htmlFor="title2">Title <span className='required'>*</span></label>
      <input type="text" id="title2" placeholder='Title2' {...register("title", { required: true })} />
      {errors.title2 && <span className="error-message">{errors.title2.message}</span>}

      <label htmlFor="gender2">Gender <span className='required'>*</span></label>
      <select id="gender2" {...register("gender2", { required: true })}>
        <option value="">Select Gender2</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      {errors.gender2 && <span className="error-message">{errors.gender2.message}</span>}

      <label htmlFor="firstName2">First Name <span className='required'>*</span></label>
      <input type='text' {...register("firstName2", { required: true,  minLength: 3, maxLength: 30  })} placeholder='First Name' />
      {errors.firstName2 && <span className="error-message">This field is required</span>}

      <label htmlFor="middleName2">Middle Nam <span className='required'>*</span> </label>
      <input type='text' {...register("middleName2", { minLength: 3, maxLength: 30  })} placeholder='Middle Name' />
      {errors.lastName2 && <span className="error-message">This field is required</span>}

      <label htmlFor="lastName2">Last Name<span className='required'>*</span></label>
      <input type='text' {...register("lastName2", { required: true ,  minLength: 3, maxLength: 30 })} placeholder='Last Name' />
      {errors.lastName2 && <span className="error-message">This field is required</span>}

      <label htmlFor="dob2">Date of Birth <span className='required'>*</span></label>
      <input type='date' {...register("dob2", { required: true })} placeholder='Date of Birth' />
      {errors.dob2 && <span className="error-message">This field is required</span>}

      <label htmlFor="placeOfBirth2">Place Of Birth <span className='required'>*</span></label>
      <input type='text' {...register("placeOfBirth2", { required: true, minLength: 3, maxLength: 30   })} placeholder='Place Of Birth' />
      {errors.placeOfBirth2 && <span className="error-message">This field is required</span>}

      <label htmlFor="nationality2">Nationality <span className='required'>*</span></label>
      <input type='text' {...register("nationality2", { required: true, minLength: 3, maxLength: 30 })} placeholder='Nationality' />
      {errors.nationality2 && <span className="error-message">This field is required</span>}

      <label htmlFor="residenceCountry2">Residence Country <span className='required'>*</span></label>
      <input type='text' {...register("residenceCountry2", { required: true,})} placeholder='Residential Address2' />
      {errors.residenceCountry2 && <span className="error-message">This Field is required</span>}

      <label htmlFor="occupation2">Occupation <span className='required'>*</span></label>
      <input type='text' {...register("occupation2", { required: true, minLength: 3, maxLength: 30 })} placeholder='Occupation2' />
      {errors.occupation2 && <span className="error-message">This field is required</span>}

      <label htmlFor="BVNNumber2">BVN  <span className='required'>*</span> </label>
      <input type='number' {...register("BVNNumber2", { required: true,  minLength:11, maxLength: 11 })} placeholder='BVN' />
      {errors.BVNNumber2 && <span className="error-message">This field is required</span>}

      <label htmlFor="employersName2">Employers Name  <span className='required'>*</span> </label>
            <input  type="text" {...register("employersName2",{ required: true, minLength: 2, maxLength: 50 })} placeholder='Employers Name' />
            {errors.employersName2 && <span className="error-message">This Field is Required</span>}


    </div>

    <div className='flex-two'>

    <label htmlFor="phoneNumber2">Phone Number  <span className='required'>*</span> </label>  
      <input  type="number"{...register("phoneNumber2",{ required: true, minLength: 5, maxLength: 11  })} placeholder='Phone Number' />
      {errors.phoneNumber2 && <span className="error-message">Please enter a valid number</span>}

     

      <label htmlFor="address2">Address <span className='required'>*</span></label>
      <input type='text' {...register("address2", { required: true,})} placeholder='Address' />
      {errors.address2 && <span className="error-message">This Field is required</span>}

      <label htmlFor="email2">Email2 <span className='required'>*</span></label>
      <input type='email2' {...register("email2", { required: true, pattern: /^\S+@\S+$/i , minLength: 6, maxLength: 30 })} placeholder='email2' />
      {errors.email2 && <span className="error-message">This field is required</span>}

      <label htmlFor="taxIDNumber2">Tax ID Number <span className='required'>*</span> </label>
      <input type='text' {...register("taxIDNumber2")} placeholder='Tax Identification Number' />
      {errors.taxIDNumber2 && <span className="error-message">THis field is required</span>}

      <label htmlFor="intPassNo2">international Passport Number <span className='required'>*</span></label>
      <input type='text' {...register("intPassNo2", { required: true, minLength: 3, maxLength: 30 })} placeholder='international Passport Number' />
      {errors.intPassNo2 && <span className="error-message">This field is required</span>}

      <label htmlFor="passIssuedCountry2">passport Issued Country <span className='required'>*</span></label>
      <input type='text' {...register("passIssuedCountry2", { required: true, minLength: 3, maxLength: 30 })} placeholder='passport Issued Country' />
      {errors.passIssuedCountry2 && <span className="error-message">This field is required</span>}


      <label htmlFor="idType2">ID Type <span className='required'>*</span></label>
        <Controller
          name="idType2"
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
      {errors.idType2 && <span className="error-message">This field is required</span>}

      <label htmlFor="idNumber2">Identification Number <span className='required'>*</span></label>
      <input type="text" {...register("idNumber2", { required: true, minLength: 1, maxLength: 20 })} placeholder='Identification Number' />
      {errors.idNumber2 && <span className="error-message">This Field is Required</span>}

      <label htmlFor="issuedBy2">issued By (Issuing Country) <span className='required'>*</span></label>
      <input type='text' {...register("issuedBy2", { required: true, minLength: 3, maxLength: 30 })} placeholder='issuedBy2' />
      {errors.issuedBy2 && <span className="error-message">This field is required</span>}

      <label htmlFor="issuedDate2">Issued Date <span className='required'>*</span></label>
      <input type="date" {...register("issuedDate2", { required: true })} placeholder='Issued Date' />
      {errors.issuedDate2 && <span className="error-message">This Field is Required</span>}

      <label htmlFor="expiryDate2">Expiry Date   <span className='required'>*</span></label>
      <input type="date" {...register("expiryDate2" ,{ required: true })} placeholder='Expiry Date' />
      {errors.expiryDate2 && <span className="error-message">This Field is Required</span>}

      <label htmlFor="sourceOfIncome2">Source of Income <span className='required'>*</span></label>
        <Controller
          name="sourceOfIncome2"
          control={control}
          rules={{ required: 'Source of income is required' }}
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
                <option value="salaryOrBusinessIncome">Salary Or Business Income</option>
                <option value="investmentsOrDividends">Investments Or Dividends</option>
                <option value="Other">Other(please specify)</option>
              </select>
        )
      )}
    />
      {errors.sourceOfIncome2 && <span className="error-message">This field is required</span>}


        </div>
        </div>
    </div>
  )
}

export default Director2