import React,{useState} from 'react'

const AdditionalInfo = ({handleChange, formErrors, formData}) => {

  const [showOtherField, setShowOtherField] = useState(false);

  const handleSelectChange = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show the text field
    setShowOtherField(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };


  const [showOtheridentificationType, setShowOtheridentificationType] = useState(false);
  const handleidentificationTypeChange = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtheridentificationType(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };

  return (

    <div>
    
        <div className='flex-form'>
            <div className='flex-one'>

            <label htmlFor="businessType">Business Type</label>
      {showOtherField ? (
        // Show the text input for "Other" option
        <input
          type="text"
          name="businessType" // Hardcoded name for the "Other" field
          value={formData.businessType}
          onChange={handleChange}
        />
      ) : (
        // Show the select field with options
        <select id="businessType" name="businessType" value={formData.businessType} onChange={handleSelectChange}>
          <option value="Choose Company Type">Company Type</option>
          <option value="Sole-Proprietor">Sole Proprietor</option>
          <option value="Limited-Liability-Company">Limited Liability Company</option>
          <option value="Joint-Venture">Joint Venture</option>
          <option value="Other">Other</option>
        </select>
      )}
          {formErrors.businessType && <span className="error-message">{formErrors.businessType}</span>}


        <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation Registration: <span className='required'>*</span></label>
        <input type="date" id="dateOfIncorporationRegistration" name="dateOfIncorporationRegistration" value={formData.dateOfIncorporationRegistration} onChange={handleChange} required />

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
             {formErrors.employersAddress && <span className="error-message">{formErrors.employersAddress}</span>}

             <label htmlFor="email">Email <span className='required'>*</span></label>
            <input type="email" id="emailAddress" placeholder='Email Address:' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
             {formErrors.email && <span className="error-message">{formErrors.email}</span>}

             <label htmlFor="taxIDNumber">Tax Identification Number <span className='required'>*</span></label>
            <input type="text" id="taxIDNumber" placeholder="Employer's Telephone Number" name="taxIDNumber" value={formData.taxIDNumber} onChange={handleChange} required />
             {formErrors.taxIDNumber && <span className="error-message">{formErrors.taxIDNumber}</span>}

            </div>
        
            <div className='flex-two'>

             <label htmlFor="BVNNumber">BVN <span className='required'>*</span></label>
            <input type="text" id="identificationNumber" placeholder='BVN' name="BVNNumber" value={formData.BVNNumber} onChange={handleChange} required />
             {formErrors.BVNNumber && <span className="error-message">{formErrors.BVNNumber}</span>}

      <label htmlFor="identificationType">ID Type <span className='required'>*</span></label>
      {/* Show the select field with options */}
      <select
        id="identificationType"
        name="identificationType"
        value={formData.identificationType}
        onChange={handleidentificationTypeChange}
        required
      >
        <option value="Choose ID Type">Choose ID Type</option>
        <option value="international passport">International passport</option>
        <option value="NIMC">NIMC</option>
        <option value="Drivers licence">Drivers Licence</option>
        <option value="Voters Card">Voters Card</option>
        <option value="Other">Other</option>
      </select>

      {showOtheridentificationType && (
        // Show the text input for "Other" ID Type option below the select field
        <div style={{ marginTop: '8px' }}>
          <input
            type="text"
            name="identificationType" // Hardcoded name for the "Other" ID Type field
            value={formData.identificationType}
            onChange={handleChange}
          />
        </div>
      )}
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