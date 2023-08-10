import React from 'react'

const AdditionalInfo = ({handleChange, formErrors, formData,showOtherField, handleSelectChange, handleidentificationTypeChange, showOtheridentificationType}) => {

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
          <option value="Public-Limited-Company">Public Limited Company</option>
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

             <label htmlFor="employersName">Employers Name </label>
             <input type="text" placeholder="Employer's Name" id="employersName" name="employersName" value={formData.employersName} onChange={handleChange}  />
             {formErrors.employersName && <span className="error-message">{formErrors.employersName}</span>}

             <label htmlFor="employersTelephoneNumber">Employers Telephone Number</label>
            <input type="number" id="employersTelephoneNumber" placeholder="Employer's Telephone Number" name="employersTelephoneNumber" value={formData.employersTelephoneNumber} onChange={handleChange} />
             {formErrors.employersTelephoneNumber && <span className="error-message">{formErrors.employersTelephoneNumber}</span>}

             <label htmlFor="employersAddress">Employers Address <span className='required'>*</span></label>
            <input type="text" id="employer'sAddress" placeholder='Employers Address' name="employersAddress" value={formData.employersAddress} onChange={handleChange} required />
             {formErrors.employersAddress && <span className="error-message">{formErrors.employersAddress}</span>}

             <label htmlFor="taxIDNumber">Tax Identification Number </label>
            <input type="text" id="taxIDNumber" placeholder="Employer's Telephone Number" name="taxIDNumber" value={formData.taxIDNumber} onChange={handleChange} />
             {formErrors.taxIDNumber && <span className="error-message">{formErrors.taxIDNumber}</span>}


            </div>
        
            <div className='flex-two'>

             <label htmlFor="BVNNumber">BVN</label>
            <input type="number" id="identificationNumber" placeholder='BVN' name="BVNNumber" value={formData.BVNNumber} onChange={handleChange} />
             {/* {formErrors.BVNNumber && <span className="error-message">{formErrors.BVNNumber}</span>} */}

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

             <label htmlFor="intPassNo">Identification Number <span className='required'>*</span></label>
            <input type="text" id="intPassNo" placeholder='Identification Number' name="intPassNo" value={formData.intPassNo} onChange={handleChange} required />
             {formErrors.intPassNo && <span className="error-message">{formErrors.intPassNo}</span>}


             <label htmlFor="issuingCountry">Issuing Country <span className='required'>*</span></label>
            <input type="text" id="issuingCountry" placeholder='issuingCountry' name="issuingCountry" value={formData.issuingCountry} onChange={handleChange} required />
             {formErrors.issuingCountry && <span className="error-message">{formErrors.issuingCountry}</span>}
        
            <label htmlFor="issuedDate">Issued Date  <span className='required'>*</span> </label>
            <input type="date" id="issuedDate" name="issuedDate" value={formData.issuedDate} onChange={handleChange} required />
             {formErrors.issuedDate && <span className="error-message">{formErrors.issuedDate}</span>}

            <label htmlFor="expiryDate">expiry Date:</label>
            <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
             {/* {formErrors.expiryDate && <span className="error-message">{formErrors.expiryDate}</span>} */}

             {/* <label htmlFor="passCountry">Passport country <span className='required'>*</span></label>
            <input type="text" id="passCountry" placeholder='Passport Country' name="passCountry" value={formData.passCountry} onChange={handleChange} required />
             {formErrors.passCountry && <span className="error-message">{formErrors.passCountry}</span>} */}

            </div>
          </div>
    </div>
  )
}

export default AdditionalInfo