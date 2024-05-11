import React from 'react'

const PersonalInfo = ({register, errors}) => {

  return (

<div>
  <div className='flex-form'>
    <div className='flex-one'>
      <label htmlFor="title">Title <span className='required'>*</span></label>
      <input type="text" id="title" placeholder='Title' {...register("title", { required: true })} />
      {errors.title && <span className="error-message">{errors.title.message}</span>}

      <label htmlFor="firstName">First Name <span className='required'>*</span></label>
      <input type="text" id="firstName" placeholder='First Name' {...register("firstName", { required: true })} />
      {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}

      <label htmlFor="lastName">Last Name <span className='required'>*</span></label>
      <input type="text" id="lastName" placeholder='Last Name' {...register("lastName", { required: true })} />
      {errors.lastName && <span className="error-message">{errors.lastName.message}</span>}

      <label htmlFor="contactAddress">Contact Address <span className='required'>*</span></label>
      <input type="text" id="contactAddress" placeholder="Contact's Address" {...register("contactAddress", { required: true })} />
      {errors.contactAddress && <span className="error-message">{errors.contactAddress.message}</span>}

      {/* <label htmlFor="contactTelephoneNumber">Contact Telephone Number <span className='required'>*</span></label>
      <input type="number" id="contactTelephoneNumber" placeholder="Contact's Telephone Number" {...register("contactTelephoneNumber", { required: true })} />
      {errors.contactTelephoneNumber && <span className="error-message">{errors.contactTelephoneNumber.message}</span>} */}

      <label htmlFor="gender">Gender <span className='required'>*</span></label>
      <select id="gender" {...register("gender", { required: true })}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      {errors.gender && <span className="error-message">{errors.gender.message}</span>}

      <label htmlFor="country">Residence Country <span className='required'>*</span></label>
      <input type="text" id="country" placeholder='Country' {...register("country", { required: true })} />
      {errors.country && <span className="error-message">{errors.country.message}</span>}

      <label htmlFor="dateOfBirth">Date Of Birth <span className='required'>*</span></label>
      <input type="date" id="dateOfBirth" placeholder='Date Of Birth' {...register("dateOfBirth", { required: true })} />
      {errors.dateOfBirth && <span className="error-message">Date of Birth is required</span>}

    </div>

    <div className='flex-two'>
    
    <label htmlFor="placeOfBirth">Place of Birth <span className='required'>*</span></label>
      <input type="text" id="placeOfBirth" placeholder='Place Of Birth' {...register("placeOfBirth", { required: true })} />
      {errors.placeOfBirth && <span className="error-message">{errors.placeOfBirth.message}</span>}

      <label htmlFor="email">Email <span className='required'>*</span></label>
      <input type="email" id="emailAddress" placeholder='Email Address' {...register("emailAddress", { required: true })} />
      {errors.emailAddress && <span className="error-message">{errors.emailAddress.message}</span>}

      <label htmlFor="GSMno">Mobile Number <span className='required'>*</span></label>
      <input type="number" id="GSMno" placeholder='Mobile Number' {...register("GSMno", { required: true })} />
      {errors.GSMno && <span className="error-message">{errors.GSMno.message}</span>}

      <label htmlFor="residentialAddress">Residential Address <span className='required'>*</span></label>
      <input type="text" id="residentialAddress" placeholder='Residential Address' {...register("residentialAddress", { required: true })} />
      {errors.residentialAddress && <span className="error-message">{errors.residentialAddress.message}</span>}
{/* 
      <label htmlFor="city">City <span className='required'>*</span></label>
      <input type="text" id="city" placeholder='City' {...register("city", { required: true })} />
      {errors.city && <span className="error-message">{errors.city.message}</span>}

      <label htmlFor="state">State <span className='required'>*</span></label>
      <input type="text" id="state" placeholder='State' {...register("state", { required: true })} />
      {errors.state && <span className="error-message">{errors.state.message}</span>} */}

      <label htmlFor="nationality">Nationality <span className='required'>*</span></label>
      <input type="text" id="nationality" placeholder='Nationality' {...register("nationality", { required: true })} />
      {errors.nationality && <span className="error-message">{errors.nationality.message}</span>}

      <label htmlFor="occupation">Occupation <span className='required'>*</span></label>
      <input type="text" id="occupation" placeholder='Occupation' {...register("occupation", { required: true })} />
      {errors.occupation && <span className="error-message">{errors.occupation.message}</span>}

      <label htmlFor="position">Position</label>
      <input type="text" id="position" placeholder="Position" {...register("position")} />

    </div>
  </div>
</div>
  )
}

export default PersonalInfo