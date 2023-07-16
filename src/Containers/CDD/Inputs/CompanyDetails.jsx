import React from 'react'

const CompanyDetails = ({handleChange,formErrors,formData}) => {
  return (
    <div>
      
        <div className='flex-form'>

        <div className='flex-one'>
        <label htmlFor="companyName">Company Name <span className='required'>*</span></label>
        <input type="text" id="companyName" name="companyName" placeholder='Company Name' value={formData.companyName} onChange={handleChange} required />
        {formErrors.companyName && <span className="error-message">{formErrors.companyName}</span>}
        
        <label htmlFor="registeredCompanyAddress">Registered Company Address <span className='required'>*</span></label>
        <input type="text" id="registeredCompanyAddress" placeholder='Registered Company Address' name="registeredCompanyAddress" value={formData.registeredCompanyAddress} onChange={handleChange} required />
        {formErrors.registeredCompanyAddress && <span className="error-message">{formErrors.registeredCompanyAddress}</span>}

        <label htmlFor="contactTelephoneNumber">Contact Telephone Number <span className='required'>*</span></label>
        <input type="number" id="contactTelephoneNumber" placeholder='Contact Telephone Number' name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />
        {formErrors.contactTelephoneNumber && <span className="error-message">{formErrors.contactTelephoneNumber}</span>}

        <label htmlFor="emailAddress">Email Address <span className='required'>*</span></label>
        <input type="email" id="emailAddress" placeholder='Email Address' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
        {formErrors.email && <span className="error-message">{formErrors.email}</span>}

        <label htmlFor="website">Website</label>
        <input type="email" id="website" placeholder='Website' name="website" value={formData.website} onChange={handleChange}  />

        <label htmlFor="contactPerson">Contact Person</label>
        <input type="text" id="contactPerson" name="contactPerson" placeholder='Contact Person' value={formData.contactPerson} onChange={handleChange} required />
        {formErrors.contactPerson && <span className="error-message">{formErrors.contactPerson}</span>}
        </div>

        <div className='flex-two'>

        <label htmlFor="contactPersonNo">Contact Person (Number)</label>
        <input type="number" id="contactPersonNo" name="contactPersonNo" placeholder='Contact Person' value={formData.contactPersonNo} onChange={handleChange} required />
        {formErrors.contactPersonNo && <span className="error-message">{formErrors.contactPersonNo}</span>}

        <label htmlFor="taxIdentificationNumber">Tax Identification Number <span className='required'>*</span></label>
        <input type="text" id="taxIdentificationNumber" placeholder='Tax Identification Number' name="taxIdentificationNumber" value={formData.taxIdentificationNumber} onChange={handleChange} required />
        {formErrors.taxIdentificationNumber && <span className="error-message">{formErrors.taxIdentificationNumber}</span>}
        
        <label htmlFor="VATRegistrationNumber">VAT Registration Number <span className='required'>*</span></label>
        <input type="text" id="VATRegistrationNumber" placeholder='VAT Registration Number' name="VATRegistrationNumber" value={formData.VATRegistrationNumber} onChange={handleChange} required />
        {formErrors.VATRegistrationNumber && <span className="error-message">{formErrors.VATRegistrationNumber}</span>}

        <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation Registration: <span className='required'>*</span></label>
        <input type="date" id="dateOfIncorporationRegistration" name="dateOfIncorporationRegistration" value={formData.dateOfIncorporationRegistration} onChange={handleChange} required />
        {formErrors.dateOfIncorporationRegistration && <span className="error-message">{formErrors.dateOfIncorporationRegistration}</span>}

        <label htmlFor="incorporationState">Incorporation State <span className='required'>*</span></label>
        <input type="text" placeholder='Incorporation State' id="incorporationState" name="incorporationState" value={formData.incorporationState} onChange={handleChange} required />
        {formErrors.incorporationState && <span className="error-message">{formErrors.incorporationState}</span>}
        
        <label htmlFor="companyType">Company Type <span className='required'>*</span></label>
        <select id="companyType" name="companyType"
        value={formData.companyType} onChange={handleChange} required >
            <option value="Choose Company Type">Company Type</option>
            <option value="Sole-Proprietor">Sole Proprietor</option>
            <option value="Limited-Liability-Company">Limited Liability Company</option>
            <option value="Joint-Venture">Joint Venture</option>
        </select> 
        {formErrors.companyType && <span className="error-message">{formErrors.companyType}</span>}
    </div>
        </div>
    </div>
  )
}

export default CompanyDetails