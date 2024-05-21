import React,{useEffect, useState} from 'react'
import './single.scss'
import {doc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { useParams } from 'react-router-dom';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAutoLogout from '../../Components/Timeout';
import { UserAuth } from '../../Context/AuthContext';
import useFetchUserRole from '../../Components/checkUserRole';
import { useDispatch, useSelector } from 'react-redux';

const BrokersPage = () => {

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
        const response = await fetch(`${serverURL}/edit-brokers-form/${data.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [key]: editData[key] }),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          console.error(result.error);
          // If the server returns an error, revert the changes in the UI
          dispatch({ type: 'SET_EDIT_DATA', data });
          toast.error('Update failed. Please try again.');
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
      const docRef = doc(db, 'brokers-kyc', id);
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
        doc.text(' KYC Form for Brokers', 50, 70);
      
        // Add section 1 - Company Information
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(16);
        doc.text('Company Details', 60, 120);
      
        const companyTableColumn = ['Company Information', ''];
        const companyTableRows = [
                ['Company Name', data.companyName],
                ['Company Address', data.companyAddress],
                ['City', data.city],
                ['State', data.state],
                ['Country', data.country],
                ['Incorporation Number', data.incorporationNumber],
                ['Registration Number', data.registrationNumber],
                ['Incorporation State', data.incorporationState],
                ['Company Legal Form', data.companyLegalForm],
                ['Date of Incorporation Registration', data.dateOfIncorporationRegistration],
                ['Email Address', data.emailAddress],
                ['Website', data.website],
                ['Nature of Business', data.natureOfBusiness],
                ['Tax Identification Number', data.taxIdentificationNumber],
                ['Telephone Number', data.telephoneNumber],
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
                ['Date of Birth', data.dob],
                ['Place of Birth', data.placeOfBirth],
                ['Nationality', data.nationality],
                ['Residence Country', data.residenceCountry],
                ['Occupation', data.occupation],
                ['BVN Number', data.BVNNumber],
                ['Employers Name', data.employersName],
                ['Phone Number', data.phoneNumber],
                ['Address', data.address],
                ['Email', data.email], 
                ['Tax ID Number', data.taxIDNumber],
                ['International Passport Number', data.intPassNo],
                ['Passport Issued Country', data.passIssuedCountry],
                ['ID Type', data.idType],
                ['ID Number',data.idNumber],
                ['Issuing Country', data.issuedBy],
                ['Issued Date', data.issuedDate],
                ['Expiry Date', data.expiryDate],
                ['Source of Income', data.sourceOfIncome],
                
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
  ['Date of Birth', data.dob2],
  ['Place of Birth', data.placeOfBirth2],
  ['Nationality', data.nationality2],
  ['Residence Country', data.residenceCountry2],
  ['Occupation', data.occupation2],
  ['BVN Number', data.BVNNumber2],
  ['Employers Name', data.employersName2],
  ['Phone Number', data.phoneNumber2],
  ['Address', data.address2],
  ['Email', data.email2], 
  ['Tax ID Number', data.taxIDNumber2],
  ['International Passport Number', data.intPassNo2],
  ['Passport Issued Country', data.passIssuedCountry2],
  ['ID Type', data.idType2],
  ['ID Number',data.idNumber2],
  ['Issuing Country', data.issuedBy2],
  ['Issued Date', data.issuedDate2],
  ['Expiry Date', data.expiryDate2],
  ['Source of Income', data.sourceOfIncome2],
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
        ['Local Bank Name', data.localBankName],
        ['Bank Branch', data.bankBranch],
        ['Current Account Number', data.currentAccountNumber],
        ['Bank Branch Name', data.bankBranchName],
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

const secondBeneficialOwnersTableColumn = ['Dollar Account', ''];
const secondBeneficialOwnersTableRows = [
  ['Foreign Bank Name', data.foreignBankName],
  ['Bank Branch Name', data.bankBranchName2],
  ['Domicilliary Account Number', data.domAccountNumber],
  ['Currency', data.currency],
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
              { label: 'Company Address', key: 'companyAddress' },
              { label: 'City', key: 'city' },
              { label: 'State', key: 'state' },
              { label: 'Country', key: 'country' },
              { label: 'Incorporation Number', key: 'incorporationNumber' },
              { label: 'Registration Number', key: 'registrationNumber' },
              { label: 'Incorporation State', key: 'incorporationNumber' },
      
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
    { label: 'Company Legal Form', key: 'companyLegalForm' },
    { label: 'Date of Incorporation Registration', key: 'dateOfIncorporationRegistration' },
    { label: 'Email Address', key: 'emailAddress' },
    { label: 'Website', key: 'website' },
    { label: 'Nature of Business', key: 'natureOfBusiness' },
    { label: 'Tax Identification Number', key: 'taxIdentificationNumber' },
    { label: 'Telephone Number', key: 'telephoneNumber' },
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

      {/* Director/Owner Information */}
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
    { label: 'Date of Birth', key: 'dob' },
    { label: 'Place of Birth', key: 'placeOfBirth' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Residence Country', key: 'residenceCountry' },
    { label: 'Occupation', key: 'occupation' },
    { label: 'BVN Number', key: 'BVNNumber' },
    { label: 'Employers Name', key: 'employersName' },
    { label: 'Phone Number', key: 'phoneNumber' },
    { label: 'Address', key: 'address' },
    { label: 'Email', key: 'email' },
    { label: 'Tax ID Number', key: 'taxIDNumber' },
    { label: 'International Passport Number', key: 'intPassNo' },
    { label: 'Passport Issued Country', key: 'passIssuedCountry' },
    { label: 'ID Type', key: 'idType' },
    { label: 'ID Number', key: 'idNumber' },
    { label: 'Issued By (issuing Country)', key: 'issuedBy' },
    { label: 'Issued Date', key: 'issuedDate' },
    { label: 'Expiry Date', key: 'expiryDate' },
    { label: 'Source of Income', key: 'sourceOfIncome' },
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
    { label: 'Date of Birth', key: 'dob2' },
    { label: 'Place of Birth', key: 'placeOfBirth2' },
    { label: 'Nationality', key: 'nationality2' },
    { label: 'Residence Country', key: 'residenceCountry2' },
    { label: 'Occupation', key: 'occupation2' },
  { label: 'BVN Number', key: 'BVNNumber2' },
    { label: 'Employers Name', key: 'employersName2' },
     { label: 'Phone Number', key: 'phoneNumber2' },
    { label: 'Address', key: 'address2' },
    { label: 'Email', key: 'email2' },
    { label: 'Tax ID Number', key: 'taxIDNumber2' },
    { label: 'International Passport Number', key: 'intPassNo2' },
    { label: 'Passport Issued Country', key: 'passIssuedCountry2' },
    { label: 'ID Type', key: 'idType2' },
    { label: 'ID Number', key: 'idNumber2' },
    { label: 'Issued By (issuing Country)', key: 'issuedBy2' },
    { label: 'Issued Date', key: 'issuedDate2' },
    { label: 'Expiry Date', key: 'expiryDate2' },
    { label: 'Source of Income', key: 'sourceOfIncome2' },
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
    { label: 'Local Bank Name', key: 'localBankName' },
    { label: 'Bank Branch', key: 'bankBranch' },
    { label: 'Current Account Number', key: 'currentAccountNumber' },
    { label: 'Bank Branch Name', key: 'bankBranchName' },
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
  <h1>Account Details (Dollars)</h1>
  {[
    { label: 'Foreign Bank Name', key: 'foreignBankName' },
    { label: 'Bank Branch Name', key: 'bankBranchName2' },
    { label: 'Domicilliary Account Number', key: 'domAccountNumber' },
    { label: 'Currency', key: 'currency' },
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
        <div className='documents'>
          <h1>Documents</h1>
          <div className='documents-content'>
            <a href={data.identification} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Identification <HiDownload style={style} />{' '}
              </button>
            </a>

            <a href={data.identification2} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Director 2's Identification <HiDownload style={style} />{' '}
              </button>
            </a>

            <a href={data.Incorporation} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Certificate of Incorporation <HiDownload style={style} />{' '}
              </button>
            </a>

            {/* <a href={data.formCO7} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Form CO7 <HiDownload style={style} />{' '}
              </button>
            </a> */}
            
            {/* <a href={data.VAT} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download VAT Registration Lisence <HiDownload style={style} />{' '}
              </button>
            </a> */}

            {/* <a href={data.tax} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Tax Clearance Certificate <HiDownload style={style} />{' '}
              </button>
            </a> */}

            <a href={data.NAICOMForm} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                NAICOM Lisence Certificate <HiDownload style={style} />{' '}
              </button>
            </a>
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

export default BrokersPage