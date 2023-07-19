import React from 'react'

const AdditionalInfo = ({handleChange, formErrors, formData}) => {
  return (

    <div>
    
        <div className='flex-form'>
            <div className='flex-one'>

             <label htmlFor="businessType">Business Type <span className='required'>*</span></label>
            <input type="text" id="businessType" placeholder='Busines Type' name="emailAddress" value={formData.businessType} onChange={handleChange} required />
             {formErrors.businessType && <span className="error-message">{formErrors.businessType}</span>}
            
             <label htmlFor="employersEmail">Employers Email <span className='required'>*</span></label>
            <input type="email" id="employersEmail" placeholder='Employers Email' name="employersEmail" value={formData.employersEmail} onChange={handleChange} required />
             {formErrors.employersEmail && <span className="error-message">{formErrors.employersEmail}</span>}

             <label htmlFor="employersName">Employers Name <span className='required'>*</span></label>
             <input type="text" placeholder="Employer's Name" id="employersName" name="employersName" value={formData.employersName} onChange={handleChange} required />
             {formErrors.employersName && <span className="error-message">{formErrors.employersName}</span>}

             <label htmlFor="employersTelephoneNumber">Employers Telephone Number <span className='required'>*</span></label>
            <input type="text" id="employersTelephoneNumber" placeholder="Employer's Telephone Number" name="employersTelephoneNumber" value={formData.employersTelephoneNumber} onChange={handleChange} required />
             {formErrors.employersTelephoneNumber && <span className="error-message">{formErrors.employersTelephoneNumber}</span>}

             <label htmlFor="employersAddress">Employers Address <span className='required'>*</span></label>
            <input type="text" id="employer'sAddress" placeholder='Employers Address' name="employersAddress" value={formData.employersAddress} onChange={handleChange} required />
             {formErrors.emailAddress && <span className="error-message">{formErrors.emailAddress}</span>}

             <label htmlFor="email">Email <span className='required'>*</span></label>
            <input type="email" id="emailAddress" placeholder='Email Address:' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
             {formErrors.email && <span className="error-message">{formErrors.email}</span>}

             <label htmlFor="identificationNumber">Tax Identification Number <span className='required'>*</span></label>
            <input type="text" id="identificationNumber" placeholder='Identification Number' name="identificationNumber" value={formData.identificationNumber} onChange={handleChange} required />
             {formErrors.identificationNumber && <span className="error-message">{formErrors.identificationNumber}</span>}

            </div>
        
            <div className='flex-two'>

             <label htmlFor="BVNNumber">BVN <span className='required'>*</span></label>
            <input type="text" id="identificationNumber" placeholder='BVN' name="BVNNumber" value={formData.BVNNumber} onChange={handleChange} required />
             {formErrors.BVNNumber && <span className="error-message">{formErrors.BVNNumber}</span>}

             <label htmlFor="identificationType">Identification Type <span className='required'>*</span></label>
            <select id="identificationType" name="identificationType" size="1"
             value={formData.identificationType} onChange={handleChange} required >
                <option value="Choose Identification Type">Identification Type</option>
                <option value="drivers licence">Drivers Licence</option>
                <option value="international passport">International Passport</option>
                <option value="national ID">National ID</option>
                <option value="voter's card">Voter's Card</option>
            </select> 
             {formErrors.identificationType && <span className="error-message">{formErrors.identificationType}</span>}

             <label htmlFor="issuingCountry">Issuing Country <span className='required'>*</span></label>
            <input type="text" id="issuingCountry" placeholder='issuingCountry' name="issuingCountry" value={formData.issuingCountry} onChange={handleChange} required />
             {formErrors.issuingCountry && <span className="error-message">{formErrors.issuingCountry}</span>}
        
            <label htmlFor="issuedDate">Issued Date:</label>
            <input type="date" id="issuedDate" name="issuedDate" value={formData.issuedDate} onChange={handleChange} required />
             {formErrors.issuedDate && <span className="error-message">{formErrors.issuedDate}</span>}

            <label htmlFor="expiryDate">expiry Date:</label>
            <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
             {formErrors.expiryDate && <span className="error-message">{formErrors.expiryDate}</span>}

             <label htmlFor="intPassNo">International Passport Number <span className='required'>*</span></label>
            <input type="text" id="intPassNo" placeholder='International Passport Number' name="intPassNo" value={formData.intPassNo} onChange={handleChange} required />
             {formErrors.intPassNo && <span className="error-message">{formErrors.intPassNo}</span>}

             <label htmlFor="passCountry">Passport country <span className='required'>*</span></label>
            <input type="text" id="passCountry" placeholder='Passport Country' name="passCountry" value={formData.passCountry} onChange={handleChange} required />
             {formErrors.passCountry && <span className="error-message">{formErrors.passCountry}</span>}

          </div>
          </div>
    </div>
  )
}

export default AdditionalInfo