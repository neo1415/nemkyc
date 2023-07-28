import React from 'react'
import { HiCloudUpload } from 'react-icons/hi';

const FinancialInfo = ({handleChange, changeHandler, signature, identification, formData, formErrors}) => {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <label htmlFor="annualIncomeRange">Annual Income Range <span className='required'>*</span></label>
            <select id="annualIncomeRange" name="annualIncomeRange" size="1"
             value={formData.annualIncomeRange} onChange={handleChange} required >
                <option value="Choose Income Range">Annual Income Range</option>
                <option value="lessThanIMillion">Less Than 1 Million</option>
                <option value="1million-4million">1 Million - 4 Million</option>
                <option value="4.1million-10million">4.1 Million - 10 Million</option>
                <option value="morethan10million">More than 10 Million</option>
            </select> 
             {formErrors.annualIncomeRange && <span className="formErrors-message">{formErrors.annualIncomeRange}</span>}

             <label htmlFor="premiumPaymentSource">Premium Payment Source <span className='required'>*</span></label>
            <select id="premiumPaymentSource" name="premiumPaymentSource" size="1"
             value={formData.premiumPaymentSource} onChange={handleChange} required >
                <option value="Choose Income Source">Premium Payment Source</option>
                <option value="salaryOrBusinessIncome">Salary or Business Income</option>
                <option value="investmentsOrDividends">Investments or Dividends</option>
            </select> 
             {formErrors.premiumPaymentSource && <span className="formErrors-message">{formErrors.premiumPaymentSource}</span>}

            {/* <label htmlFor=" date">Date:</label>
            <input type="date" id=" date" name="date" value={formData.date} onChange={handleChange} required />
               {formErrors.date && <span className="formErrors-message">{formErrors.date}</span>} */}

              <div className='upload-section'>
               <div className='upload-form'>
        <div className='uploader'>
            <label htmlFor="signature" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your Signature</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            <input type="file" id="signature" name="signature" onChange={changeHandler}  />
            </label>
            <div className='Output'>
            {formErrors.signature && <div className='error'>{formErrors.signature}</div>}
                {signature && <div className='error'>{signature.name}</div>}
              </div>
              </div>
              </div>
             <div className='upload-form'>
        <div className='uploader'>
            <label htmlFor="identification" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Means of Identification</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
             <input type="file" id="identification" name="identification" onChange={changeHandler}  />
            </label>
  
            <div className='Output'>
              {formErrors.identification && <div className='error'>{formErrors.identification}</div>}
              {identification && <div className='error'>{identification.name}</div>}
            </div>
              </div>
              </div>
</div>
            <label htmlFor="private">
            <input type="checkbox" id="privacy" className='conf' name="privacy" onChange={handleChange} required />
            Please note that your data will be treated 
            with the utmost respect and privacy as required by law.
            By checking this box, you acknowledge and 
            agree to the purpose set-out in this clause 
            and our data privacy policy. Thank you.<span className="required-star">*</span>
          </label>
          {formErrors.privacy && <span className="formErrors-message">{formErrors.privacy}</span>}

    </div>
  )
}

export default FinancialInfo