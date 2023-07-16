import React from 'react'

const Director2 = ({handleChange,formData}) => {
  return (
    <div>
       
       <div className='flexer'>
        <div className='flex-one'>
           
            <label htmlFor="firstName2">First Name</label>
            <input type="text" id=" firstName2" placeholder='First Name' name="firstName2" value={formData.firstName2} onChange={handleChange} />

            <label  htmlFor="lastName2">Last Name</label>
            <input type="text" placeholder='Last Name' id="lastName2" name="lastName2" value={formData.lastName2} onChange={handleChange} />

            <label htmlFor="dob2">Date of Birth:</label>
            <input type="date" id="dob2" name="dob2" value={formData.dob2} onChange={handleChange} />
            
            <label htmlFor="placeOfBirth2">Place of Birth</label>
            <input type="text" id="placeOfBirth2" placeholder='Place Of Birth' name="placeOfBirth2" value={formData.placeOfBirth2} onChange={handleChange} />

            <label htmlFor="residentialAddress2">Residential Address</label>
            <input type="text" id="residentialAddress2" placeholder='Residential Address' name="residentialAddress2" value={formData.residentialAddress2} onChange={handleChange} />

            <label htmlFor="position2">Position</label>
            <input type="text" id="position2" placeholder='Position' name="position2" value={formData.position2} onChange={handleChange} />

            <label htmlFor="occupation2">Occupation</label>
            <input type="text" id="occupation2" placeholder='Occupation' name="occupation2" value={formData.occupation2} onChange={handleChange} />

            <label htmlFor="taxIDNumber2">Tax ID Number</label>
            <input type="text" id="taxIDNumber2" placeholder='Tax ID Number' name="taxIDNumber2" value={formData.taxIDNumber2} onChange={handleChange} />
    
            <label htmlFor="sourceOfIncome2">Source of Income</label>
            <select id="sourceOfIncome2" name="sourceOfIncome2" size=""
             value={formData.sourceOfIncome} onChange={handleChange} >
                <option value="Choose Income Source">Source Of Income</option>
                <option value="salaryOrBusinessIncome2">Salary or Business Income</option>
                <option value="investmentsOrDividends2">Investments or Dividends</option>
            </select> 
           
            </div>
            <div className='flex-two'>
        
            <label htmlFor="email2">Email</label>
            <input type="email" id="email2" placeholder='Email' name="email2" value={formData.email2} onChange={handleChange} />

            <label htmlFor="phoneNumber2">Phone Number</label>
            <input type="number" id="phoneNumber2" placeholder='Phone Number' name="phoneNumber2" value={formData.phoneNumber2} onChange={handleChange} />

            <label htmlFor='nationality2'>Nationality</label>
            <input type="text" id="nationality2" placeholder='Nationality' name="nationality2" value={formData.nationality2} onChange={handleChange} />

            <label htmlFor="stateOfOrigin2">State of Origin</label>
            <select id="idType2" name="idType2"
             value={formData.idType2} onChange={handleChange} >
                <option value="Choose ID Type2">Choose ID Type</option>
                <option value="international passport2">International passport</option>
                <option value="NIMC2">NIMC</option>
                <option value="Drivers licence2">Drivers Licence</option>
                <option value="Voters Card2">Voters Card</option>
            </select> 

            <label htmlFor="idNumber2">ID Number</label>
            <input type="text" id="idNumber2" placeholder='ID Number' name="idNumber2" value={formData.idNumber2} onChange={handleChange} />

            <label htmlFor="issuedDate2">Issued Date</label>
            <input type="date" id="issuedDate2" placeholder='Issued Date' name="issuedDate2" value={formData.issuedDate2} onChange={handleChange} />

            <label htmlFor="expiryDate2">Expiry date:</label>
            <input type="date" id="expiryDate2" placeholder='Expiry Date' name="expiryDate2" value={formData.expiryDate2} onChange={handleChange} />

            <label htmlFor="issuingBody2">Issuing Body</label>
            <input type="text" id="issuingBody2" placeholder='Issuing Body' name="issuingBody2" value={formData.issuingBody2} onChange={handleChange} />

            </div>
            </div>
    </div>
  )
}

export default Director2