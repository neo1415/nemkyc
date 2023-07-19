import React from 'react'

const Director1 = ({handleChange,formErrors,formData}) => {
  return (
    <div>
        <div className='flexer'>
     
          <div className='flex-one'>
   
            <label htmlFor="firstName">first Name <span className='required'>*</span></label>
            <input type="text" id=" firstName" placeholder='First Name' name="firstName" value={formData.firstName} onChange={handleChange}  required />
            {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}     

            <label htmlFor="lastName">Last Name <span className='required'>*</span></label>
            <input type="text" placeholder='Last Name' id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}

            <label htmlFor="dob">Date of Birth: <span className='required'>*</span></label>
            <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />
            {formErrors.dob && <span className="error-message">{formErrors.dob}</span>}
            
            <label htmlFor="placeOfBirth">Place of Birth <span className='required'>*</span></label>
            <input type="text" id="placeOfBirth" placeholder='Place Of Birth' name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required />
            {formErrors.placeOfBirth && <span className="error-message">{formErrors.placeOfBirth}</span>}

            <label htmlFor="nationality">Nationality <span className='required'>*</span></label>
            <input type="text" id="nationality" placeholder='Nationality' name="nationality" value={formData.nationality} onChange={handleChange}  required/>
            {formErrors.nationality && <span className="error-message">{formErrors.nationality}</span>}
    
            <label htmlFor="country">Country <span className='required'>*</span></label>
            <input type="text" id="country" placeholder='country' name="country" value={formData.country} onChange={handleChange} required />
            {formErrors.country && <span className="error-message">{formErrors.country}</span>}

            <label htmlFor="occupation">Occupation <span className='required'>*</span></label>
            <input type="text" id="occupation" placeholder='Occupation' name="occupation" value={formData.occupation} onChange={handleChange} required />
            {formErrors.occupation && <span className="error-message">{formErrors.occupation}</span>}

            <label htmlFor="BVNNumber">BVN <span className='required'>*</span></label>
            <input type="text" placeholder='BVN' id="BVNNumber" name="BVNNumber" value={formData.BVNNumber} onChange={handleChange} required />
            {formErrors.BVNNumber && <span className="error-message">{formErrors.BVNNumber}</span>}

            <label htmlFor="employersName">Employers Name <span className='required'>*</span></label>
            <input type="text" placeholder='Employers Name' id="employersName" name="employersName" value={formData.employersName} onChange={handleChange} required />
            {formErrors.employersName && <span className="error-message">{formErrors.employersName}</span>}

            <label htmlFor="phoneNumber">Phone Number <span className='required'>*</span></label>
            <input type="number" id="phoneNumber" placeholder='Phone Number' name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
            {formErrors.phoneNumber && <span className="error-message">{formErrors.phoneNumber}</span>}

            <label htmlFor="residentialAddress">Residential Address <span className='required'>*</span></label>
            <input type="text" id="residentialAddress" placeholder='Residential Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required/>
            {formErrors.residentialAddress && <span className="error-message">{formErrors.residentialAddress}</span>}
          
</div>
     <div className='flex-two'>
        
     <label htmlFor="email">email <span className='required'>*</span></label>
            <input type="email" id="email" placeholder='Email' name="email" value={formData.email} onChange={handleChange}  required/>
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}

            <label htmlFor="taxIDNumber">Tax ID Number <span className='required'>*</span></label>
            <input type="text" id="taxIDNumber" placeholder='Tax ID Number' name="taxIDNumber" value={formData.taxIDNumber} onChange={handleChange}  required/>
            {formErrors.taxIDNumber && <span className="error-message">{formErrors.taxIDNumber}</span>}

            <label htmlFor="intPassNo">International Passport Number <span className='required'>*</span></label>
            <input type="text" id="intPassNo" placeholder='International Passport Number' name="intPassNo" value={formData.intPassNo} onChange={handleChange} required />
             {formErrors.intPassNo && <span className="error-message">{formErrors.intPassNo}</span>}

             <label htmlFor="passCountry">Passport country <span className='required'>*</span></label>
            <input type="text" id="passCountry" placeholder='Passport Country' name="passCountry" value={formData.passCountry} onChange={handleChange} required />
             {formErrors.passCountry && <span className="error-message">{formErrors.passCountry}</span>}

             <label htmlFor="idType">ID Type <span className='required'>*</span></label>
            <select id="idType" name="idType"
             value={formData.idType} onChange={handleChange}  required>
                <option value="Choose ID Type">Choose ID Type</option>
                <option value="international passport">International passport</option>
                <option value="NIMC">NIMC</option>
                <option value="Drivers licence">Drivers Licence</option>
                <option value="Voters Card">Voters Card</option>
            </select> 
            {formErrors.idType && <span className="error-message">{formErrors.idType}</span>}

            <label htmlFor="idNumber">ID Number <span className='required'>*</span></label>
            <input type="text" id="idNumber" placeholder='ID Number' name="idNumber" value={formData.idNumber} onChange={handleChange} required/>
            {formErrors.idNumber && <span className="error-message">{formErrors.idNumber}</span>}

            <label htmlFor="issuingBody">Issuing Body <span className='required'>*</span></label>
            <input type="text" id="issuingBody" placeholder='Issuing Body' name="issuingBody" value={formData.issuingBody} onChange={handleChange} required />
            {formErrors.issuingBody && <span className="error-message">{formErrors.issuingBody}</span>}

            <label htmlFor="issuedDate">Issued Date <span className='required'>*</span></label>
            <input type="date" id="issuedDate" placeholder='Issued Date' name="issuedDate" value={formData.issuedDate} onChange={handleChange}  required/>
            {formErrors.issuedDate && <span className="error-message">{formErrors.issuedDate}</span>}

            <label htmlFor="expiryDate">Expiry date <span className='required'>*</span></label>
            <input type="date" id="expiryDate" placeholder='Expiry Date' name="expiryDate" value={formData.expiryDate} onChange={handleChange}  required/>
            {formErrors.expiryDate && <span className="error-message">{formErrors.expiryDate}</span>}

            <label htmlFor="sourceOfIncome">Source Of Income <span className='required'>*</span></label>
            <select id="sourceOfIncome" name="sourceOfIncome" size=""
             value={formData.sourceOfIncome} onChange={handleChange} required >
                <option value="Choose Income Source">Source Of Income</option>
                <option value="salaryOrBusinessIncome">Salary or Business Income</option>
                <option value="investmentsOrDividends">Investments or Dividends</option>
            </select> 
            {formErrors.sourceOfIncome && <span className="error-message">{formErrors.sourceOfIncome}</span>}

          </div>
          
          
            </div>
    </div>
  )
}

export default Director1