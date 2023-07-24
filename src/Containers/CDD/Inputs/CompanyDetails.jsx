import React from 'react'

const CompanyDetails = ({handleChange,formErrors,formData}) => {
  return (
    <div>
      
        <div className='flex-form'>

        <div className='flex-one'>
        <label htmlFor="companyName">Company Name <span className='required'>*</span></label>
        <input type="text" id="companyName" name="companyName" placeholder='Company Name' value={formData.companyName} onChange={handleChange} required />
        {formErrors.companyName && <span className="error-message">{formErrors.companyName}</span>}
        
        {/* <label htmlFor="commercialName">Commercial Name <span className='required'>*</span></label>
        <input type="text" id="commercialName" name="commercialName" placeholder='Commercial Name' value={formData.commercialName} onChange={handleChange} required />
        {formErrors.commercialName && <span className="error-message">{formErrors.commercialName}</span>}

        <label htmlFor="city">City <span className='required'>*</span></label>
        <input type="text" id=" city" placeholder='City' name="city" value={formData.city} onChange={handleChange} required />
        {formErrors.city && <span className="error-message">{formErrors.city}</span>}

        <label htmlFor="state">State <span className='required'>*</span></label>
        <input type="text" id=" state" placeholder='State' name="state" value={formData.state} onChange={handleChange} required />
        {formErrors.state && <span className="error-message">{formErrors.state}</span>}

        <label htmlFor="companyCountry">Company Country <span className='required'>*</span></label>
        <input type="text" id=" companyCountry" placeholder='companyCountry' name="companyCountry" value={formData.companyCountry} onChange={handleChange} required />
        {formErrors.companyCountry && <span className="error-message">{formErrors.companyCountry}</span>} */}

        <label htmlFor="registeredCompanyAddress">Registered Company Address <span className='required'>*</span></label>
        <input type="text" id="registeredCompanyAddress" placeholder='Registered Company Address' name="registeredCompanyAddress" value={formData.registeredCompanyAddress} onChange={handleChange} required />
        {formErrors.registeredCompanyAddress && <span className="error-message">{formErrors.registeredCompanyAddress}</span>}

        <label htmlFor="incorporationNumber">Incorporation Number <span className='required'>*</span></label>
        <input type="number" id="incorporationNumber" placeholder='Incorporation Number' name="incorporationNumber" value={formData.incorporationNumber} onChange={handleChange} required />
        {formErrors.incorporationNumber && <span className="error-message">{formErrors.incorporationNumber}</span>}

        <label htmlFor="incorporationState">Incorporation State <span className='required'>*</span></label>
        <input type="text" placeholder='Incorporation State' id="incorporationState" name="incorporationState" value={formData.incorporationState} onChange={handleChange} required />
        {formErrors.incorporationState && <span className="error-message">{formErrors.incorporationState}</span>}

        <label htmlFor="companyLegalForm">Company Legal Form <span className='required'>*</span></label>
        <select id="companyLegalForm" name="companyLegalForm"
        value={formData.companyLegalForm} onChange={handleChange} required >
            <option value="Choose Company Type">Company Type</option>
            <option value="Sole-Proprietor">Sole Proprietor</option>
            <option value="Limited-Liability-Company">Limited Liability Company</option>
            <option value="Joint-Venture">Joint Venture</option>
        </select> 
        {formErrors.companyLegalForm && <span className="error-message">{formErrors.companyLegalForm}</span>}

        <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation Registration: <span className='required'>*</span></label>
        <input type="date" id="dateOfIncorporationRegistration" name="dateOfIncorporationRegistration" value={formData.dateOfIncorporationRegistration} onChange={handleChange} required />
        {formErrors.dateOfIncorporationRegistration && <span className="error-message">{formErrors.dateOfIncorporationRegistration}</span>}

        </div>

        <div className='flex-two'>

        <label htmlFor="emailAddress">Email Address <span className='required'>*</span></label>
        <input type="text" id="emailAddress" placeholder='Email Address' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
        {formErrors.email && <span className="error-message">{formErrors.email}</span>}

        <label htmlFor="website">Website</label>
        <input type="email" id="website" placeholder='Website' name="website" value={formData.website} onChange={handleChange}  />

        <label htmlFor="taxIdentificationNumber">Tax Identification Number <span className='required'>*</span></label>
        <input type="text" id="taxIdentificationNumber" placeholder='Tax Identification Number' name="taxIdentificationNumber" value={formData.taxIdentificationNumber} onChange={handleChange} required />
        {formErrors.taxIdentificationNumber && <span className="error-message">{formErrors.taxIdentificationNumber}</span>}
        
        <label htmlFor="telephoneNumber">Telephone Number <span className='required'>*</span></label>
        <input type="text" id="telephoneNumber" placeholder='Telephone Number' name="telephoneNumber" value={formData.telephoneNumber} onChange={handleChange} required />
        {formErrors.telephoneNumber && <span className="error-message">{formErrors.telephoneNumber}</span>}

    </div>
        </div>
    </div>
  )
}

export default CompanyDetails