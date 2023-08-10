import React from 'react'

const PersonalInfo = ({handleChange, formData, formErrors}) => {
  return (

    <div>
         <div className='flex-form'>
            <div className='flex-one'>

            <label htmlFor="title">Title <span className='required'>*</span></label>
            <input type="text" id="title" placeholder='Title' name="title" value={formData.title} onChange={handleChange} required />
             {formErrors.title && <span className="error-message">{formErrors.title}</span>}
            
             <label htmlFor="firstName">first Name <span className='required'>*</span></label>
            <input type="text" id=" firstName" placeholder='First Name' name="firstName" value={formData.firstName} onChange={handleChange}  required />
            {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}     

            <label htmlFor="lastName">Last Name <span className='required'>*</span></label>
            <input type="text" placeholder='Last Name' id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}

             <label htmlFor="contactAddress">Contact Address <span className='required'>*</span></label>
            <input type="text" id="contactAddress" placeholder="Contact's Address" name="contactAddress" value={formData.contactAddress} onChange={handleChange} required />
             {formErrors.contactAddress && <span className="error-message">{formErrors.contactAddress}</span>}

             <label htmlFor="contactTelephoneNumber">Contact Telephone Number <span className='required'>*</span></label>
            <input type="number" id="contactTelephoneNumber" placeholder="Contact's Telephone Number" name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />
             {formErrors.contactTelephoneNumber && <span className="error-message">{formErrors.contactTelephoneNumber}</span>}
            
             <label htmlFor="gender">Gender <span className='required'>*</span></label>
            <select id="gender" name="gender" size="1"
             value={formData.gender} onChange={handleChange} required >
                <option value="Gender">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select> 
             {formErrors.gender && <span className="error-message">{formErrors.gender}</span>}

             <label htmlFor="country">Residence Country <span className='required'>*</span></label>
            <input type="text" id=" country" placeholder='Country' name="country" value={formData.country} onChange={handleChange} required />
             {formErrors.country && <span className="error-message">{formErrors.country}</span>}

            <label htmlFor="dateOfBirth">Date Of Birth <span className='required'>*</span></label>
            <input type="date" id="dateOfBirth" placeholder='Date Of Birth' name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
             {formErrors.dateOfBirth && <span className="error-message">{formErrors.dateOfBirth}</span>} 

             <label htmlFor="placeOfBirth">Place of Birth <span className='required'>*</span></label>
            <input type="text" id="placeOfBirth" placeholder='Place Of Birth' name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required />
            {formErrors.placeOfBirth && <span className="error-message">{formErrors.placeOfBirth}</span>}


            </div>

            <div className='flex-two'>
            {/* <label htmlFor="mothersMaidenName">Mothers Maiden NAme <span className='required'>*</span></label>
            <input type="text" id="mothersMaidenName" placeholder="Mother's Maiden Name" name="mothersMaidenName" value={formData.mothersMaidenName} onChange={handleChange} required />
             {formErrors.mothersMaidenName && <span className="error-message">{formErrors.mothersMaidenName}</span>} */}
            
             {/* <label htmlFor="residentialAddress">Office Address <span className='required'>*</span></label>
            <input type="text" id="residentialAddress" placeholder='Office Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />
             {formErrors.residentialAddress && <span className="error-message">{formErrors.residentialAddress}</span>} */}

             <label htmlFor="email">Email <span className='required'>*</span></label>
            <input type="email" id="emailAddress" placeholder='Email Address:' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
             {formErrors.email && <span className="error-message">{formErrors.email}</span>}


             <label htmlFor="GSMNumber">Mobile Number <span className='required'>*</span></label>
            <input type="number" id=" GSMno" placeholder='Moobile Number' name="GSMno" value={formData.GSMno} onChange={handleChange} required />
             {formErrors.GSMno && <span className="error-message">{formErrors.GSMno}</span>}

            <label htmlFor="residentialAddress">Residential Address <span className='required'>*</span></label>
            <input type="text" id="residentialAddress" placeholder='Residential Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />
             {formErrors.residentialAddress && <span className="error-message">{formErrors.residentialAddress}</span>}

             <label htmlFor="city">City <span className='required'>*</span></label>
            <input type="text" placeholder='City' id=" city" name="city" value={formData.city} onChange={handleChange} required />
             {formErrors.city && <span className="error-message">{formErrors.city}</span>}

             <label htmlFor="state">State <span className='required'>*</span></label>
            <input type="text" id=" state" placeholder='State' name="state" value={formData.state} onChange={handleChange} required /> 
             {formErrors.state && <span className="error-message">{formErrors.state}</span>}

             <label htmlFor="nationality">Nationality <span className='required'>*</span></label>
            <input type="text" id=" nationality" placeholder='Nationality' name="nationality" value={formData.nationality} onChange={handleChange} required />
             {formErrors.nationality && <span className="error-message">{formErrors.nationality}</span>}

            <label htmlFor="occupation">Occupation <span className='required'>*</span></label>
            <input type="text" placeholder='Occupation' id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} required />
             {formErrors.occupation && <span className="error-message">{formErrors.occupation}</span>}

             <label htmlFor="position">Position </label>
            <input type="text" id="position" placeholder="Position" name="position" value={formData.position} onChange={handleChange} />
             {/* {formErrors.position && <span className="error-message">{formErrors.position}</span>} */}


        </div>
      </div>
    </div>
  )
}

export default PersonalInfo