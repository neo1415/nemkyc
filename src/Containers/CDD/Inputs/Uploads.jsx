import React from 'react'
import { HiCloudUpload } from 'react-icons/hi';

const Uploads = ({changeHandler,cac, identification, cacForm, formErrors,register, handleChange}) => {
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
           
            <input type="file" id="cac" name="cac" onChange={changeHandler} required />
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
  
            <input type="file" id="identification" name="identification" onChange={changeHandler} required  />
            <div className='Output'>
            {formErrors.identification && <span className="error-message">{formErrors.identification}</span>}
            {identification && <div className='error'>{identification.name}</div>}
              </div>
              </div>
              </div>
            </div>
        </div>

        <div className='flex-upload'>

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
            <input type="file" id="cacForm" name="cacForm" onChange={changeHandler} required />
            <div className='Output'>
            <div className='Output'>
            {formErrors.cacForm && <span className="error-message">{formErrors.cacForm}</span>}
                {cacForm && <div className='error'>{cacForm.name}</div>}
                </div>
              </div>
              </div>
    
              </div>
        </div>

        <div className='signature'>
<label htmlFor="signature"></label>
     I <input type='text' {...register("signature", { required: true,  minLength: 3, maxLength: 30  })} className='signature-input' placeholder='Your Full Name' />
      {errors.signature && <span className="error-message">This field is required</span>}
      you acknowledge and 
      agree to the purpose set-out in this clause 
      and our data privacy policy. Thank you
</div>
{errors.signature && <span className="error-message">This field is required</span>}

        {/* <label htmlFor="privacy">
                <input type="checkbox" id="privacy" name="privacy" onChange={handleChange} style={{border:'3rem solid black'}} />
                Please note that your data will be treated 
                with the utmost respect and privacy as required by law.
                By checking this box, you acknowledge and 
                agree to the purpose set-out in this clause 
                and our data privacy policy. Thank you.<span className="-star">*</span>
              </label>
              {formErrors.privacyPolicy && <span className="error-message">{formErrors.privacyPolicy}</span>} */}
      </div>  
    </div>
  )
}

export default Uploads