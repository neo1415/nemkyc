import React from 'react'
import { HiCloudUpload } from 'react-icons/hi';

const Uploads = ({changeHandler,cac, identification, cacForm, formErrors, handleChange}) => {
  return (
    <div>
       <div className='upload-flex'>

        <div className='flex-upload'>
        <div className='upload-form'>
        <div className='uploader'>
        <label htmlFor="cac" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your CAC Certificate</h4> 
         
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
           
            <input type="file" id="cac" name="cac" onChange={changeHandler}  />
            <div className='Output'>
            {formErrors.cac && <span className="error-message">{formErrors.cac}</span>}
            {cac && <div className='error'>{cac.name}</div>}
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
            </label>
  
            <input type="file" id="identification" name="identification" onChange={changeHandler}   />
            <div className='Output'>
            {formErrors.identification && <span className="error-message">{formErrors.identification}</span>}
                {identification && <div className='error'>{identification.name}</div>}
              </div>
              </div>
              </div>
            </div>
        </div>

        <div className='flex-upload'>
            {/* <div className='upload-form'>
        <div className='uploader'>
            <label htmlFor="tax" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your Tax Card</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
            <input type="file" id="tax" name="tax" onChange={changeHandler}  />
            <div className='Output'>
            {formErrors.tax && <span className="error-message">{formErrors.tax}</span>}
             {tax && <div className='error'>{tax.name}</div>}
              </div>
            </div>
            </div> */}
            <div className='upload-form'>
        <div className='uploader'>
        <h6>For NAICOM Regulated Companies</h6>
            <label htmlFor="cacForm" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>NAICOM License Certificate</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
            <input type="file" id="cacForm" name="cacForm" onChange={changeHandler}  />
            <div className='Output'>
            <div className='Output'>
            {formErrors.tax && <span className="error-message">{formErrors.tax}</span>}
                {cacForm && <div className='error'>{cacForm.name}</div>}
                </div>
              </div>
              </div>
    
              </div>
        </div>
        <label htmlFor="privacy">
                <input type="checkbox" id="privacy" name="privacy" onChange={handleChange} style={{border:'3rem solid black'}} />
                Please note that your data will be treated 
                with the utmost respect and privacy as  by law.
                By checking this box, you acknowledge and 
                agree to the purpose set-out in this clause 
                and our data privacy policy. Thank you.<span className="-star">*</span>
              </label>
              {formErrors.privacy && <span className="error-message">{formErrors.privacy}</span>}
      </div>  
    </div>
  )
}

export default Uploads