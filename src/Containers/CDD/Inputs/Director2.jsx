import React from 'react'

const Director2 = ({handleChange,formData,formErrors}) => {
  return (
    <div>
       
       <div className='flexer'>
     
     <div className='flex-one'>

       <label htmlFor="firstName2">first Name <span className='required'>*</span></label>
       <input type="text" id=" firstName2" placeholder='First Name' name="firstName2" value={formData.firstName2} onChange={handleChange}  />
       {formErrors.firstName2 && <span className="error-message">{formErrors.firstName2}</span>}     

       <label htmlFor="lastName2">Last Name <span className='required'>*</span></label>
       <input type="text" placeholder='Last Name' id="lastName2" name="lastName2" value={formData.lastName2} onChange={handleChange} />
       {formErrors.lastName2 && <span className="error-message">{formErrors.lastName2}</span>}

       <label htmlFor="dob2">Date of Birth: <span className='required'>*</span></label>
       <input type="date" id="dob2" name="dob2" value={formData.dob2} onChange={handleChange} />
       {formErrors.dob2 && <span className="error-message">{formErrors.dob2}</span>}
       
       <label htmlFor="placeOfBirth2">Place of Birth <span className='required'>*</span></label>
       <input type="text" id="placeOfBirth2" placeholder='Place Of Birth' name="placeOfBirth2" value={formData.placeOfBirth2} onChange={handleChange} />
       {formErrors.placeOfBirth2 && <span className="error-message">{formErrors.placeOfBirth2}</span>}

       <label htmlFor="nationality2">Nationality <span className='required'>*</span></label>
       <input type="text" id="nationality2" placeholder='Nationality2' name="nationality2" value={formData.nationality2} onChange={handleChange} />
       {formErrors.nationality2 && <span className="error-message">{formErrors.nationality2}</span>}

       <label htmlFor="country2">Country <span className='required'>*</span></label>
       <input type="text" id="country2" placeholder='country2' name="country2" value={formData.country2} onChange={handleChange} />
       {formErrors.country2 && <span className="error-message">{formErrors.country2}</span>}

       <label htmlFor="occupation2">Occupation <span className='required'>*</span></label>
       <input type="text" id="occupation2" placeholder='Occupation2' name="occupation2" value={formData.occupation2} onChange={handleChange} />
       {formErrors.occupation2 && <span className="error-message">{formErrors.occupation2}</span>}

       <label htmlFor="BVNNumber2">BVN <span className='required'>*</span></label>
       <input type="text" placeholder='BVN' id="BVNNumber2" name="BVNNumber2" value={formData.BVNNumber2} onChange={handleChange} />
       {formErrors.BVNNumber2 && <span className="error-message">{formErrors.BVNNumber2}</span>}

       <label htmlFor="employersName2">Employers Name <span className='required'>*</span></label>
       <input type="text" placeholder='Employers Name' id="employersName2" name="employersName2" value={formData.employersName2} onChange={handleChange} />
       {formErrors.employersName2 && <span className="error-message">{formErrors.employersName2}</span>}

       <label htmlFor="phoneNumber2">Phone Number <span className='required'>*</span></label>
       <input type="number" id="phoneNumber2" placeholder='Phone Number' name="phoneNumber2" value={formData.phoneNumber2} onChange={handleChange} />
       {formErrors.phoneNumber2 && <span className="error-message">{formErrors.phoneNumber2}</span>}

       <label htmlFor="residentialAddress2">Residential Address <span className='required'>*</span></label>
       <input type="text" id="residentialAddress2" placeholder='Residential Address' name="residentialAddress2" value={formData.residentialAddress2} onChange={handleChange}/>
       {formErrors.residentialAddress2 && <span className="error-message">{formErrors.residentialAddress2}</span>}
     
</div>
<div className='flex-two'>
   
<label htmlFor="email2">Email <span className='required'>*</span></label>
       <input type="email" id="email2" placeholder='Email2' name="email2" value={formData.email2} onChange={handleChange} />
       {formErrors.email2 && <span className="error-message">{formErrors.email2}</span>}

       <label htmlFor="taxIDNumber2">Tax ID Number <span className='required'>*</span></label>
       <input type="text" id="taxIDNumber2" placeholder='Tax ID Number' name="taxIDNumber2" value={formData.taxIDNumber2} onChange={handleChange} />
       {formErrors.taxIDNumber2 && <span className="error-message">{formErrors.taxIDNumber2}</span>}

       <label htmlFor="intPassNo2">International Passport Number <span className='required'>*</span></label>
       <input type="text" id="intPassNo2" placeholder='International Passport Number' name="intPassNo2" value={formData.intPassNo2} onChange={handleChange} />
        {formErrors.intPassNo2 && <span className="error-message">{formErrors.intPassNo2}</span>}

        <label htmlFor="passCountry22">Passport country2 <span className='required'>*</span></label>
       <input type="text" id="passCountry22" placeholder='Passport Country2' name="passCountry22" value={formData.passCountry22} onChange={handleChange} />
        {formErrors.passCountry22 && <span className="error-message">{formErrors.passCountry22}</span>}

        <label htmlFor="idType2">ID Type <span className='required'>*</span></label>
       <select id="idType2" name="idType2"
        value={formData.idType2} onChange={handleChange} >
           <option value="Choose ID Type">Choose ID Type</option>
           <option value="international passport">International passport</option>
           <option value="NIMC">NIMC</option>
           <option value="Drivers licence">Drivers Licence</option>
           <option value="Voters Card">Voters Card</option>
       </select> 
       {formErrors.idType2 && <span className="error-message">{formErrors.idType2}</span>}

       <label htmlFor="idNumber2">ID Number <span className='required'>*</span></label>
       <input type="text" id="idNumber2" placeholder='ID Number' name="idNumber2" value={formData.idNumber2} onChange={handleChange}/>
       {formErrors.idNumber2 && <span className="error-message">{formErrors.idNumber2}</span>}

       <label htmlFor="issuingBody2">Issuing Body <span className='required'>*</span></label>
       <input type="text" id="issuingBody2" placeholder='Issuing Body' name="issuingBody2" value={formData.issuingBody2} onChange={handleChange} />
       {formErrors.issuingBody2 && <span className="error-message">{formErrors.issuingBody2}</span>}

       <label htmlFor="issuedDate2">Issued Date <span className='required'>*</span></label>
       <input type="date" id="issuedDate2" placeholder='Issued Date' name="issuedDate2" value={formData.issuedDate2} onChange={handleChange} />
       {formErrors.issuedDate2 && <span className="error-message">{formErrors.issuedDate2}</span>}

       <label htmlFor="expiryDate2">Expiry date <span className='required'>*</span></label>
       <input type="date" id="expiryDate2" placeholder='Expiry Date' name="expiryDate2" value={formData.expiryDate2} onChange={handleChange} />
       {formErrors.expiryDate2 && <span className="error-message">{formErrors.expiryDate2}</span>}

       <label htmlFor="sourceOfIncome2">Source Of Income <span className='required'>*</span></label>
       <select id="sourceOfIncome2" name="sourceOfIncome2" size=""
        value={formData.sourceOfIncome2} onChange={handleChange} >
           <option value="Choose Income Source">Source Of Income</option>
           <option value="salaryOrBusinessIncome">Salary or Business Income</option>
           <option value="investmentsOrDividends">Investments or Dividends</option>
       </select> 
       {formErrors.sourceOfIncome2 && <span className="error-message">{formErrors.sourceOfIncome2}</span>}

     </div>
     
     
       </div>
    </div>
  )
}

export default Director2