// import React,{useState} from 'react'
// import {Controller} from 'react-hook-form'

// const AdditionalInfo = ({register, errors,control}) => {

//   const [showOtherField, setShowOtherField] = useState(false);

//   const handleSelectChange = (value) => {
//     setShowOtherField(value === 'Other');
//     return value === 'Other' ? '' : value;
//   };


//   return (
//   <div>
//     <div className='flex-form'>
//         <div className='flex-one'>
//         <label htmlFor="businessType">Business Type <span className='required'>*</span></label>
//           <Controller
//             name="businessType"
//             control={control}
//             rules={{ required: 'Business Type is required' }}
//             defaultValue=""
//             render={({ field }) => (
//           showOtherField ? (
//             <input
//               {...field}
//               type="text"
//               placeholder='Specify Your Business Type'
//             />
//           ) : (
//             <select {...field} onChange={(e) => field.onChange(handleSelectChange(e.target.value))}>
//               <option value="Choose Company Type">Company Type</option>
//               <option value="Sole-Proprietor">Sole Proprietor</option>
//               <option value="Limited-Liability-Company">Limited Liability Company</option>
//               <option value="Public-Limited-Company">Public Limited Company</option>
//               <option value="Joint-Venture">Joint Venture</option>
//               <option value="Other">Other(please specify)</option>
//             </select>
//           )
//         )}
//       />
//       {errors.businessType && <span className="error-message">This field is required</span>}

//         <label htmlFor="employersEmail">Employers Email </label>
//         <input type="email" id="employersEmail" placeholder='Employers Email' {...register("employersEmail", { required: true })} />
//         {errors.employersEmail && <span className="error-message">{errors.employersEmail.message}</span>}

//         <label htmlFor="employersName">Employers Name </label>
//         <input type="text" id="employersName" placeholder="Employer's Name" {...register("employersName")} />
//         {errors.employersName && <span className="error-message">{errors.employersName.message}</span>}

//         <label htmlFor="employersTelephoneNumber">Employers Telephone Number</label>
//         <input type="number" id="employersTelephoneNumber" placeholder="Employer's Telephone Number" {...register("employersTelephoneNumber")} />
//         {errors.employersTelephoneNumber && <span className="error-message">{errors.employersTelephoneNumber.message}</span>}

//         <label htmlFor="employersAddress">Employers Address </label>
//         <input type="text" id="employersAddress" placeholder='Employers Address' {...register("employersAddress")} />
//         {errors.employersAddress && <span className="error-message">{errors.employersAddress.message}</span>}

//         <label htmlFor="taxidentificationNumber">Tax Identification Number</label>
//         <input type="text" id="taxidentificationNumber" placeholder="Tax Identification Number" {...register("taxidentificationNumber")} />
//         {errors.taxidentificationNumber && <span className="error-message">{errors.taxidentificationNumber.message}</span>}
//       </div>

//       <div className='flex-two'>
//         <label htmlFor="BVNNumber">BVN <span className='required'>*</span></label>
//         <input type="number" id="BVNNumber" placeholder='BVN' {...register("BVNNumber")} />
//         {errors.BVNNumber && <span className="error-message">{errors.BVNNumber.message}</span>}

//         <label htmlFor="identificationType">ID Type <span className='required'>*</span></label>
//         <select id="identificationType" {...register("identificationType", { required: true })}>
//           <option value="Choose ID Type">Choose ID Type</option>
//           <option value="international passport">International passport</option>
//           <option value="NIMC">NIMC</option>
//           <option value="Drivers licence">Drivers Licence</option>
//           <option value="Voters Card">Voters Card</option>
//           <option value="Voters Card">NIN</option>
//         </select>
//         {errors.identificationType && <span className="error-message">{errors.identificationType.message}</span>}

//         <label htmlFor="identificationNumber">Identification Number <span className='required'>*</span></label>
//       <input type="text" {...register("identificationNumber", { required: true, minLength: 1, maxLength: 20 })} placeholder='Identification Number' />
//       {errors.identificationNumber && <span className="error-message">This Field is Required</span>}

//         <label htmlFor="issuingCountry">Issuing Country <span className='required'>*</span></label>
//         <input type="text" id="issuingCountry" placeholder='Issuing Country' {...register("issuingCountry", { required: true })} />
//         {errors.issuingCountry && <span className="error-message">{errors.issuingCountry.message}</span>}

//         <label htmlFor="issuedDate">Issued Date <span className='required'>*</span></label>
//         <input type="date" id="issuedDate" {...register("issuedDate", { required: true })} />
//         {errors.issuedDate && <span className="error-message">Issuing Date is required</span>}

//         <label htmlFor="expiryDate">Expiry Date:</label>
//         <input type="date" id="expiryDate" {...register("expiryDate")} />
//         {errors.expiryDate && <span className="error-message">{errors.expiryDate.message}</span>}
//       </div>
//           </div>
//     </div>
//   )
// }

// export default AdditionalInfo