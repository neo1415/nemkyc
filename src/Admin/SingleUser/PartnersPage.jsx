import React,{useEffect} from 'react'
import './single.scss'
import {doc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { useParams } from 'react-router-dom';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import useAutoLogout from '../../Components/Timeout';
import { UserAuth } from '../../Context/AuthContext';
import { toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useFetchUserRole from '../../Components/checkUserRole';
import { useDispatch, useSelector } from 'react-redux';
import { csrfProtectedPost } from '../../Components/CsrfUtils';


const PartnersPage = () => {

  const dispatch = useDispatch();
      const { user } = UserAuth();
      const userRole = useFetchUserRole(user);
    const data = useSelector(state => state.data);
    const editData = useSelector(state => state.editData);
    const editingKey = useSelector(state => state.editingKey);

    const handleInputChange = (event) => {
      dispatch({ type: 'SET_EDIT_DATA', data: { ...editData, [event.target.name]: event.target.value } });
    };
  
    const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
  
    const handleFormSubmit = async (event, key) => {
      event.preventDefault();
  
      // Update the UI immediately
      dispatch({ type: 'SET_DATA', data: editData });
      dispatch({ type: 'SET_EDITING_KEY', key: null });
  
      try {
        const response = await csrfProtectedPost(`${serverURL}/edit-partners-form/${data.id}`, {
          [key]: editData[key]
        });
    
        const result = response.data;
    
        if (response.status !== 200) {
          console.error(result.error);
          // If the server returns an error, revert the changes in the UI
          dispatch({ type: 'SET_EDIT_DATA', data });
          toast.error('Update failed. Please try again.');
        }  else {
          toast.success('Form updated successfully.');
        }
      } catch (err) {
        console.error('Error:', err);
        // If the request fails, revert the changes in the UI
        dispatch({ type: 'SET_EDIT_DATA', data });
        toast.error('Update failed. Please try again.');
      }
    };
  
    const handleEditClick = (key) => {
      dispatch({ type: 'SET_EDITING_KEY', key });
    };
  
    const handleCancelClick = () => {
      dispatch({ type: 'SET_EDITING_KEY', key: null });
      dispatch({ type: 'SET_EDIT_DATA', data });
    };
  
    const { logout } = UserAuth(); // Replace UserAuth with your authentication context

    // Use the custom hook for the automatic logout
    useAutoLogout({
      timeoutDuration: 10 * 60 * 1000 ,//(adjust as needed)
      logout, // Use the logout function from your context
      redirectPath: '/signin', // Specify the redirect path
    });

    const {id} = useParams();

   const style={
        size:30,
        marginLeft:10,
        color:'white'
    }

    useEffect(() => {
      const docRef = doc(db, 'partners-kyc', id);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
          dispatch({ type: 'SET_DATA', data: { ...snapshot.data(), id: snapshot.id } });
      });
  
      // Return a cleanup function to unsubscribe the listener when the component unmounts
      return () => unsubscribe();
    }, [id, dispatch]);

    const downloadPDF = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
      
        // Add header
        // doc.setFontSize(24);
        // doc.setTextColor(128, 0, 32);
        // doc.text('NEM Insurance PLC', 50, 70);
      
        doc.setFontSize(24);
        doc.setTextColor(128, 0, 32);
        doc.text('Partnership KYC/Due Dilligence Form', 50, 70);
      
        // Add section 1 - Company Information
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(16);
        doc.text('Company Details', 60, 120);
      
        const companyTableColumn = ['Company Information', ''];
        const companyTableRows = [
                ['Company Name', data.companyName],
                ['Registered Company Address', data.registeredCompanyAddress],
                ['City', data.city],
                ['State', data.state],
                ['Country', data.country],
                ['Contact Telephone Number', data.telephoneNumber],
                ['Email Address', data.emailAddress],
                ['Website', data.website],
                ['Contact Person Name', data.contactPerson],
                ['Contact Person Number', data.contactPersonNo],
                ['Tax Identification Number', data.taxIdentificationNumber],
                ['VAT Registration Number', data.VATRegistrationNumber],
                ['Incorporation/RC Number', data.incorporationNumber],
                ['Incorporation State', data.incorporationState],
                ['Nature of Business', data.natureOfBusiness],
                ['BVN Number', data.BVNNo],
                ['Date of Incorporation Registration', data.dateOfIncorporationRegistration],
                ["NAICOM Lisence Issuing Date", data.NAICOMLisenceIssuingDate],
                ["NAICOM Lisence Expiry Date", data.NAICOMLisenceExpiryDate],
               
              ];
      
        const companyTableProps = {
          startY: 140,
          styles: {
            halign: 'left',
            valign: 'middle',
            fontSize: 12,
            cellPadding: 8,
            overflow: 'linebreak',
            lineWidth: 0.1,
          },
          columnStyles: {
            0: {
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
            },
            1: {
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
        };
      
        doc.autoTable(companyTableColumn, companyTableRows, companyTableProps);
      
        // Add sub-section - Directors Information
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('Directors Information', 40, doc.lastAutoTable.finalY + 60);

      
        const directorsTableColumn = ['Director One', ''];
        const directorsTableRows = [
                ['Title', data.title],
                ['Gender', data.gender],
                ['First Name', data.firstName],
                ['Middle Name', data.middleName],
                ['Last Name', data.lastName],
                ['Residential Address', data.residentialAddress],
                ['Position', data.position],
                ['Date of Birth', data.dob],
                ['Place of Birth', data.placeOfBirth],
                ['Occupation', data.occupation],
                ['BVN Number', data.BVNNumber],
                ['Tax ID Number', data.taxIDNumber],
                ['International Passport Number', data.intPassNo],
                ['Passport Issued Country', data.passIssuedCountry],
                ['Source of Income', data.sourceOfIncome],
                ['Nationality', data.nationality],
                ['Phone Number', data.phoneNumber],
                ['Email', data.email],
                ['ID Type', data.idType],
                ['ID Number', data.idNumber],
                ['Issuing Body', data.issuingBody],
                ['Issued Date', data.issuedDate],
                ['Expiry Date', data.expiryDate],
              ];
      
        const directorsTableProps = {
          startY: doc.lastAutoTable.finalY + 80,
          styles: {
            halign: 'middle',
            valign: 'middle',
            fontSize: 12,
            cellPadding: 8,
            overflow: 'linebreak',
            lineWidth: 0.1,
          },
          columnStyles: {
            0: {
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
            },
            1: {
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
        };
      
        doc.autoTable(directorsTableColumn, directorsTableRows, directorsTableProps);
      
        // Add sub-section - Second Director's Information
      
const secondDirectorsTableColumn = ['Director Two', ''];
const secondDirectorsTableRows = [
  ['Title', data.title2],
  ['Gender', data.gender2],
  ['First Name', data.firstName2],
  ['Middle Name', data.middleName2],
  ['Last Name', data.lastName2],
  ['Residential Address', data.residentialAddress2],
  ['Position', data.position2],
  ['Date of Birth', data.dob2],
  ['Place of Birth', data.placeOfBirth2],
  ['Occupation', data.occupation2],
  ['BVN Number', data.BVNNumber2],
  ['Tax ID Number', data.taxIDNumber2],
  ['International Passport Number', data.intPassNo2],
  ['Passport Issued Country', data.passIssuedCountry2],
  ['Source of Income', data.sourceOfIncome2],
  ['Nationality', data.nationality2],
  ['Phone Number', data.phoneNumber2],
  ['Email', data.email2],
  ['ID Type', data.idType2],
  ['ID Number', data.idNumber2],
  ['Issuing Body', data.issuingBody2],
  ['Issued Date', data.issuedDate2],
  ['Expiry Date', data.expiryDate2],
];

const secondDirectorsTableProps = {
startY: doc.lastAutoTable.finalY + 50,
startX: 300,
styles: {
halign: 'middle',
valign: 'middle',
fontSize: 12,
cellPadding: 8,
overflow: 'linebreak',
lineWidth: 0.1,
},
columnStyles: {
0: {
fillColor: [255, 255, 255],
textColor: [0, 0, 0],
fontStyle: 'bold',
},
1: {
fillColor: [255, 255, 255],
textColor: [0, 0, 0],
},
},
};

doc.autoTable(secondDirectorsTableColumn, secondDirectorsTableRows, secondDirectorsTableProps);

// Add section 2 - Beneficial Owners Information
doc.setFontSize(18);
doc.setTextColor(0, 0, 0);
doc.text('Account Details', 40, doc.lastAutoTable.finalY + 60);

const beneficialOwnersTableColumn = ['Naira Account', ''];
const beneficialOwnersTableRows = [
        ['Account Number', data.accountNumber],
        ['Bank Name', data.bankName],
        ['Bank Branch', data.bankBranch],
        ['Account Opening Date', data.accountOpeningDate]
      ];

const beneficialOwnersTableProps = {
startY: doc.lastAutoTable.finalY + 80,
styles: {
halign: 'middle',
valign: 'middle',
fontSize: 12,
cellPadding: 8,
overflow: 'linebreak',
lineWidth: 0.1,
},
columnStyles: {
0: {
fillColor: [255, 255, 255],
textColor: [0, 0, 0],
fontStyle: 'bold',
},
1: {
fillColor: [255, 255, 255],
textColor: [0, 0, 0],
},
},
};

doc.autoTable(beneficialOwnersTableColumn, beneficialOwnersTableRows, beneficialOwnersTableProps);

// Add sub-section - Beneficial Owner 2 Information

const secondBeneficialOwnersTableColumn = ['Foreign Account', ''];
const secondBeneficialOwnersTableRows = [
        ['Account Number', data.accountNumber2],
        ['Bank Name', data.bankName2],
        ['Bank Branch', data.bankBranch2],
        ['Account Opening Date', data.accountOpeningDate2]
      ];

const secondBeneficialOwnersTableProps = {
startY: doc.lastAutoTable.finalY + 60,
styles: {
halign: 'middle',
valign: 'middle',
fontSize: 12,
cellPadding: 8,
overflow: 'linebreak',
lineWidth: 0.1,
},
columnStyles: {
0: {
fillColor: [255, 255, 255],
textColor: [0, 0, 0],
fontStyle: 'bold',
},
1: {
fillColor: [255, 255, 255],
textColor: [0, 0, 0],
},
},
};

doc.autoTable(secondBeneficialOwnersTableColumn, secondBeneficialOwnersTableRows, secondBeneficialOwnersTableProps);

doc.setFontSize(14);
// doc.setFontStyle('bold' , doc.internal.pageSize.getWidth() / 2, 150, { align: 'center' })
doc.text('Declaration:', 50, doc.autoTable.previous.finalY + 40);

let yPosition = doc.autoTable.previous.finalY + 80; // Increase space after the header

const declarations = [
    {
        text: `I/We ${data.signature} hereby affirm that all the information provided in this Form/Document is true , accurate and complete to the best of my knowledge.`,
        signature: data.signature
    },
   
];

declarations.forEach((declaration, index) => {
  const lines = doc.splitTextToSize(declaration.text, 500); // Adjust the width as needed
  doc.text(lines, 50, yPosition);
  const textWidth = doc.getTextWidth(declaration.signature);
  // doc.line(80, yPosition + 5, 50 + textWidth, yPosition + 5); // Underline the signature
  yPosition += 24 * lines.length; // Adjust this value as needed to space out the declarations
});

// Add date under the declarations
const dateText = `Date: ${new Date().toLocaleDateString()}`;
doc.text(dateText, 50, yPosition + 20);
const dateWidth = doc.getTextWidth(dateText);
// doc.line(90, yPosition + 30, 50 + dateWidth, yPosition + 30); // Underline the date

// Add section 3 - Declaration and Signature
// doc.setFontSize(18);
// doc.setTextColor(0, 0, 0);
// doc.text('Section 3 - Declaration and Signature', 40, doc.lastAutoTable.finalY + 60);

// doc.setFontSize(12);
// doc.text('I hereby declare that the information provided in this form is true and correct to the best of my knowledge and belief. I understand that any false or misleading statement may result in the rejection of this application.', 60, doc.lastAutoTable.finalY + 100);

// doc.setFontSize(16);
// doc.text('Signature:', 60, doc.lastAutoTable.finalY + 200);
// doc.line(140, doc.lastAutoTable.finalY + 200, 350, doc.lastAutoTable.finalY + 200);

// Save the PDF
doc.save('KYC Form.pdf');
    }
      

  return (
    <div className='singles'>
 <div className='form-content'>
      {/* Company Information */}
      <div className='form-contents'>
      <div className='flex-content'>
  <ul>
    <h1 className='content-h1'>Company Details</h1>
    {[
      { label: 'Company Name', key: 'companyName' },
      { label: 'Registered Company Address', key: 'registeredCompanyAddress' },
      { label: 'City', key: 'city' },
      { label: 'State', key: 'state' },
      { label: 'Country', key: 'country' },
      { label: 'Contact Telephone Number', key: 'telephoneNumber' },
      { label: 'Email Address', key: 'emailAddress' },
      { label: 'Website', key: 'website' },
      { label: 'Contact Person Number', key: 'contactPersonNo' },
      { label: 'Contact Person Name', key: 'contactPerson' },
    ].map(({ label, key }) => (
              <li className='form-list' key={key}>
                <p>{label}</p>
                {editingKey === key ? (
                  <form onSubmit={(event) => handleFormSubmit(event, key)}>
                    <input
                      type='text'
                      name={key}
                      value={editData[key]}
                      onChange={handleInputChange}
                      className='edit-input'
                    
                    />
                    <button type='submit' className='edit-submit'>Save</button>
                    <button type='button' onClick={handleCancelClick} className='edit-cancel'>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className='info'>{data[key]}</p>
                     {userRole ==='admin' && (
                    <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
                     )}
                  </>
                )}
              </li>
            ))}
  </ul>
  <ul>
    {[
      { label: 'Tax Identification Number', key: 'taxIdentificationNumber' },
      { label: 'VAT Registration Number', key: 'VATRegistrationNumber' },
      { label: 'Incorporation Number', key: 'incorporationNumber' },
      { label: 'Date of Incorporation Registration', key: 'dateOfIncorporationRegistration' },
      { label: 'Incorporation State', key: 'incorporationState' },
      { label: 'Nature of Business', key: 'natureOfBusiness' },
      { label: 'BVN Number', key: 'BVNNo' },
      { label: 'NAICOM Lisence Issuing Date', key: 'NAICOMLisenceIssuingDate' },
      { label: 'NAICOM Lisence Expiry Date', key: 'NAICOMLisenceExpiryDate' },
    ].map(({ label, key }) => (
              <li className='form-list' key={key}>
                <p>{label}</p>
                {editingKey === key ? (
                  <form onSubmit={(event) => handleFormSubmit(event, key)}>
                    <input
                      type='text'
                      name={key}
                      value={editData[key]}
                      onChange={handleInputChange}
                      className='edit-input'
                    
                    />
                    <button type='submit' className='edit-submit'>Save</button>
                    <button type='button' onClick={handleCancelClick} className='edit-cancel'>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className='info'>{data[key]}</p>
                     {userRole ==='admin' && (
                    <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
                     )}
                  </>
                )}
              </li>
            ))}
  </ul>
</div>

<div className='form-contents'>
  <div className='flex-content'>
    <ul>
      <h1>Directors Profile</h1>
      {[
        { label: 'Title', key: 'title' },
        { label: 'Gender', key: 'gender' },
        { label: 'First Name', key: 'firstName' },
        { label: 'Middle Name', key: 'middleName' },
        { label: 'Last Name', key: 'lastName' },
        { label: 'Residential Address', key: 'residentialAddress' },
        { label: 'Position', key: 'position' },
        { label: 'Date of Birth', key: 'dob' },
        { label: 'Place of Birth', key: 'placeOfBirth' },
        { label: 'Occupation', key: 'occupation' },
        { label: 'BVN Number', key: 'BVNNumber' },
        { label: 'Tax ID Number', key: 'taxIDNumber' },
        { label: 'International Passport Number', key: 'intPassNo' },
        { label: 'Passport Issued Country', key: 'passIssuedCountry' },
        { label: 'Source Of Income', key: 'sourceOfIncome' },
        { label: 'Nationality', key: 'nationality' },
        { label: 'Phone Number', key: 'phoneNumber' },
        { label: 'Email', key: 'email' },
        { label: 'ID Type', key: 'idType' },
        { label: 'ID Number', key: 'idNumber' },
        { label: 'Issuing Body', key: 'issuingBody' },
        { label: 'Issued Date', key: 'issuedDate' },
        { label: 'Expiry Date', key: 'expiryDate' },
      ].map(({ label, key }) => (
              <li className='form-list' key={key}>
                <p>{label}</p>
                {editingKey === key ? (
                  <form onSubmit={(event) => handleFormSubmit(event, key)}>
                    <input
                      type='text'
                      name={key}
                      value={editData[key]}
                      onChange={handleInputChange}
                      className='edit-input'
                    
                    />
                    <button type='submit' className='edit-submit'>Save</button>
                    <button type='button' onClick={handleCancelClick} className='edit-cancel'>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className='info'>{data[key]}</p>
                     {userRole ==='admin' && (
                    <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
                     )}
                  </>
                )}
              </li>
            ))}
    </ul>
    <ul>
      <h1>Directors Profile 2</h1>
      {[
        { label: 'Title', key: 'title2' },
        { label: 'Gender', key: 'gender2' },
        { label: 'First Name', key: 'firstName2' },
        { label: 'Middle Name', key: 'middleName2' },
        { label: 'Last Name', key: 'lastName2' },
        { label: 'Residential Address', key: 'residentialAddress2' },
        { label: 'Position', key: 'position2' },
        { label: 'Date of Birth', key: 'dob2' },
        { label: 'Place of Birth', key: 'placeOfBirth2' },
        { label: 'Occupation', key: 'occupation2' },
        { label: 'BVN Number', key: 'BVNNumber2' },
        { label: 'Tax ID Number', key: 'taxIDNumber2' },
        { label: 'International Passport Number', key: 'intPassNo2' },
        { label: 'Passport Issued Country', key: 'passIssuedCountry2' },
        { label: 'Source Of Income', key: 'sourceOfIncome2' },
        { label: 'Nationality', key: 'nationality2' },
        { label: 'Phone Number', key: 'phoneNumber2' },
        { label: 'Email', key: 'email2' },
        { label: 'ID Type', key: 'idType2' },
        { label: 'ID Number', key: 'idNumber2' },
        { label: 'Issuing Body', key: 'issuingBody2' },
        { label: 'Issued Date', key: 'issuedDate2' },
        { label: 'Expiry Date', key: 'expiryDate2' },
      ].map(({ label, key }) => (
              <li className='form-list' key={key}>
                <p>{label}</p>
                {editingKey === key ? (
                  <form onSubmit={(event) => handleFormSubmit(event, key)}>
                    <input
                      type='text'
                      name={key}
                      value={editData[key]}
                      onChange={handleInputChange}
                      className='edit-input'
                    
                    />
                    <button type='submit' className='edit-submit'>Save</button>
                    <button type='button' onClick={handleCancelClick} className='edit-cancel'>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className='info'>{data[key]}</p>
                     {userRole ==='admin' && (
                    <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
                     )}
                  </>
                )}
              </li>
            ))}
    </ul>
  </div>
</div>

{/* Account Details */}
<div className='form-contents'>
  <div className='flex-content'>
    <ul>
      <h1>Account Details</h1>
      {[
        { label: 'Account Number', key: 'accountNumber' },
        { label: 'Bank Name', key: 'bankName' },
        { label: 'Bank Branch', key: 'bankBranch' },
        { label: 'Account Opening Date', key: 'accountOpeningDate' },
      ].map(({ label, key }) => (
              <li className='form-list' key={key}>
                <p>{label}</p>
                {editingKey === key ? (
                  <form onSubmit={(event) => handleFormSubmit(event, key)}>
                    <input
                      type='text'
                      name={key}
                      value={editData[key]}
                      onChange={handleInputChange}
                      className='edit-input'
                    
                    />
                    <button type='submit' className='edit-submit'>Save</button>
                    <button type='button' onClick={handleCancelClick} className='edit-cancel'>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className='info'>{data[key]}</p>
                     {userRole ==='admin' && (
                    <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
                     )}
                  </>
                )}
              </li>
            ))}
    </ul>
    <ul>
      <h1>Account Details (Foreign)</h1>
      {[
        { label: 'Account Number', key: 'accountNumber2' },
        { label: 'Bank Name', key: 'bankName2' },
        { label: 'Bank Branch', key: 'bankBranch2' },
        { label: 'Account Opening Date', key: 'accountOpeningDate2' },
      ].map(({ label, key }) => (
              <li className='form-list' key={key}>
                <p>{label}</p>
                {editingKey === key ? (
                  <form onSubmit={(event) => handleFormSubmit(event, key)}>
                    <input
                      type='text'
                      name={key}
                      value={editData[key]}
                      onChange={handleInputChange}
                      className='edit-input'
                    
                    />
                    <button type='submit' className='edit-submit'>Save</button>
                    <button type='button' onClick={handleCancelClick} className='edit-cancel'>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className='info'>{data[key]}</p>
                     {userRole ==='admin' && (
                    <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
                     )}
                  </>
                )}
              </li>
            ))}
    </ul>
  </div>
</div>
        <div className='documents'>
          <h1>Documents</h1>
          <div className='documents-content'>

           {data.identification ? (
            <a href={data.identification} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Identification <HiDownload style={style} />{' '}
              </button>
            </a>
          ) : (
                <p className='info'>Identification not available</p>
              )}
 {data.identification2 ? (
            <a href={data.identification2} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Director 2's Identification <HiDownload style={style} />{' '}
              </button>
            </a>
 ) : (
                <p className='info'>Identification 2 not available</p>
              )}

 {data.incorporation ? (
            <a href={data.Incorporation} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Certificate of Incorporation <HiDownload style={style} />{' '}
              </button>
            </a>
   ) : (
                <p className='info'>Incorporation certificate not available</p>
              )}

               {data.formCO7 ? (
            <a href={data.formCO7} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download CAC Status Report <HiDownload style={style} />{' '}
              </button>
            </a>
               ) : (
                <p className='info'> CAC Status report not available</p>
              )}
            
            {data.VAT ? (
            <a href={data.VAT} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download VAT Registration Lisence <HiDownload style={style} />{' '}
              </button>
            </a>
       ) : (
                <p className='info'> VAT not available</p>
              )}

            {data.tax ? (
            <a href={data.tax} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Tax Clearance Certificate <HiDownload style={style} />{' '}
              </button>
            </a>
                   ) : (
                <p className='info'> Tax Clearance Certificate not available</p>
              )}

  {data.NAICOMForm ? (
            <a href={data.NAICOMForm} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                NAICOM Lisence Certificate <HiDownload style={style} />{' '}
              </button>
            </a>
                ) : (
                <p className='info'> NAICOM Lisence Certificate Certificate not available</p>
              )}
          </div>
        </div>
      </div>
    </div>
    <div className='file-download'>

    <button className='form-button' onClick={downloadPDF}>Download Form <HiDownload style={style} /> </button>
    
    </div>
    </div>
    
  )
}

export default PartnersPage