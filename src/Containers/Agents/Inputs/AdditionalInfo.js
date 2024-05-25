import React,{useState} from 'react'
import {Controller} from 'react-hook-form'

const AdditionalInfo = ({register, errors}) => {


  return (
  <div>
    <div className='flex-form'>
        <div className='flex-one'>

        <label htmlFor="agentsName">Agent Name <span className='required'>*</span> </label>
        <input type="text" id="agentsName" placeholder="Agent's Name" {...register("agentsName")} />
        {errors.agentsName && <span className="error-message">{errors.agentsName.message}</span>}

        <label htmlFor="agentsAddress">Agents Office Address <span className='required'>*</span> </label>
        <input type="text" id="agentsAddress" placeholder='Agents Office Address' {...register("agentsAddress")} />
        {errors.agentsAddress && <span className="error-message">{errors.agentsAddress.message}</span>}

        <label htmlFor="naicomNo">Naicom Lisence Number (RIA) <span className='required'>*</span></label>
        <input type="text" id="naicomNo" placeholder='Naicom Lisence Number' {...register("naicomNo")} />
        {errors.naicomNo && <span className="error-message">{errors.naicomNo.message}</span>}

        <label htmlFor="lisenceIssuedDate">Lisence Issued Date <span className='required'>*</span></label>
        <input type="date" id="lisenceIssuedDate" {...register("lisenceIssuedDate", { required: true })} />
        {errors.lisenceIssuedDate && <span className="error-message">Issuing Date is required</span>}

        <label htmlFor="lisenceExpiryDate">Lisence Expiry Date <span className='required'>*</span></label>
        <input type="date" id="lisenceExpiryDate" {...register("lisenceExpiryDate")} />
        {errors.lisenceExpiryDate && <span className="error-message">Expiry Date is required</span>}

        <label htmlFor="agentsEmail"> Email Address <span className='required'>*</span> </label>
        <input type="email" id="agentsEmail" placeholder='Email Address' {...register("agentsEmail", { required: true })} />
        {errors.agentsEmail && <span className="error-message">{errors.agentsEmail.message}</span>}


      </div>

      <div className='flex-two'>

      <label htmlFor="website">Website </label>
      <input type='text' {...register("website", { required: true,})} placeholder='website' />
      {/* {errors.website && <span className="error-message">Please enter a valid website</span>} */}
   
        <label htmlFor="mobileNo">Mobile Number <span className='required'>*</span></label>
        <input type="number" id="mobileNo" placeholder="Employer's Telephone Number" {...register("mobileNo")} />
        {errors.mobileNo && <span className="error-message">{errors.mobileNo.message}</span>}

        <label htmlFor="taxIDNo">Tax Identification Number </label>
        <input type="text" id="taxIDNo" placeholder="Tax Identification Number" {...register("taxIDNo")} />
        {/* {errors.taxIDNo && <span className="error-message">{errors.taxIDNo.message}</span>} */}

        <label htmlFor="arian">ARIAN Membership Number <span className='required'>*</span></label>
      <input type="text" {...register("arian", { required: true, minLength: 1, maxLength: 20 })} placeholder='ARIAN Membership Number' />
      {errors.arian && <span className="error-message">This Field is Required</span>}

        <label htmlFor="listOfAgents">List of Agents Approved Principals (Insurers) <span className='required'>*</span></label>
        <input type="text" id="listOfAgents" placeholder='List of Agents Approved Principals (Insurers)' {...register("listOfAgents", { required: true })} />
        {errors.listOfAgents && <span className="error-message">{errors.listOfAgents.message}</span>}

            </div>
          </div>
    </div>
  )
}

export default AdditionalInfo