import React from 'react'

const AccountDetails = ({formData,formErrors,handleChange}) => {
  return (
    <div>
              <div className='flexer'>
      <div className='flex-one'>
        <h3>Naira Account Details</h3>

<label htmlFor="accountName">Account Number <span className='required'>*</span></label>
<input type="text" id="accountNumber" placeholder='Account Number' name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
{formErrors.accountNumber && <span className="error-message">{formErrors.accountNumber}</span>}

<label htmlFor="bankName">Bank Name <span className='required'>*</span></label>
<input type="text" placeholder='Bank Name' id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />
{formErrors.bankName && <span className="error-message">{formErrors.bankName}</span>}

<label htmlFor="bankBranch">Bank Branch <span className='required'>*</span></label>
<input type="text" id="bankBranch" placeholder='Bank Branch Body' name="bankBranch" value={formData.bankBranch} onChange={handleChange} required />
{formErrors.bankBranch && <span className="error-message">{formErrors.bankBranch}</span>}

<label htmlFor="accountOpeningDate">Account Opening Date <span className='required'>*</span></label>
<input type="date" id="accountOpeningDate" placeholder='Account Opening Date' name="accountOpeningDate" value={formData.accountOpeningDate} onChange={handleChange} required />
{formErrors.accountOpeningDate && <span className="error-message">{formErrors.accountOpeningDate}</span>}

</div>
<div className='flex-two'>
        <h3> Dollar Account Details</h3>

            <label htmlFor="accountName2">Account Number</label>
            <input type="text" id="accountNumber2" placeholder='Account Number' name="accountNumber2" value={formData.accountNumber2} onChange={handleChange} />

            <label htmlFor="bankName2">Bank Name</label>
            <input type="text" placeholder='Bank Name' id="bankName2" name="bankName2" value={formData.bankName2} onChange={handleChange} />
            
            <label htmlFor="bankBranch2">Bank Branch</label>
            <input type="text" id="bankBranch2" placeholder='Bank Branch Body' name="bankBranch2" value={formData.bankBranch2} onChange={handleChange} />
            
            <label htmlFor="accountOpeningDate2">Account Opening Date</label>
            <input type="date" id="accountOpeningDate2" placeholder='Account Opening Date' name="accountOpeningDate2" value={formData.accountOpeningDate2} onChange={handleChange} />

            </div>

            </div>
    </div>
  )
}

export default AccountDetails