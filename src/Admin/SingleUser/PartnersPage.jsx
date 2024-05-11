import React,{useEffect, useState} from 'react'
import './single.scss'
import {doc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { useParams } from 'react-router-dom';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import useAutoLogout from '../../Components/Timeout';
import { UserAuth } from '../../Context/AuthContext';

const PartnersPage = () => {

    const [data, setData] = useState([]);

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
      const docRef = doc(db, 'corporate-kyc', id);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
          setData({...snapshot.data(), id: snapshot.id});
      });
  
      // Return a cleanup function to unsubscribe the listener when the component unmounts
      return () => unsubscribe();
  }, [id]);

    const downloadPDF = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
      
        // Add header
        doc.setFontSize(24);
        doc.setTextColor(128, 0, 32);
        doc.text('NEM Insurance Corporate KYC Form', 50, 70);
      
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
                ['International Passport Number', data.intPassNumber],
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
  ['International Passport Number', data.intPassNumber2],
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

const secondBeneficialOwnersTableColumn = ['Dollar Account', ''];
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
            <li className='form-list'>
              <p>Company Name</p>
              <p className='info'>{data.companyName}</p>
            </li>

            <li className='form-list'>
              <p>Registered Company Address</p>
              <p className='info'>{data.registeredCompanyAddress}</p>
            </li>
            <li className='form-list'>
              <p>City</p>
              <p className='info'>{data.city}</p>
            </li>
            <li className='form-list'>
              <p>State</p>
              <p className='info'>{data.state}</p>
            </li>
            <li className='form-list'>
              <p>Country</p>
              <p className='info'>{data.country}</p>
            </li>
            <li className='form-list'>
              <p>Contact Telephone Number</p>
              <p className='info'>{data.telephoneNumber}</p>
            </li>

            </ul>
        <ul>
            <li className='form-list'>
              <p>Email Address</p>
              <p className='info'>{data.emailAddress}</p>
            </li>
            <li className='form-list'>
              <p>Website</p>
              <p className='info'>{data.website}</p>
            </li>
            <li className='form-list'>
              <p>Contact Person Number</p>
              <p className='info'>{data.contactPersonNo}</p>
            </li>
            <li className='form-list'>
              <p>Contact Person Name</p>
              <p className='info'>{data.contactPerson}</p>
            </li>
            <li className='form-list'>
              <p>Tax Identification Number</p>
              <p className='info'>{data.taxIdentificationNumber}</p>
            </li>
            <li className='form-list'>
              <p>VAT Registration Number</p>
              <p className='info'>{data.VATRegistrationNumber}</p>
            </li>
            <li className='form-list'>
              <p>Incorporation Number</p>
              <p className='info'>{data.incorporationNumber}</p>
            </li>
            <li className='form-list'>
              <p>Date of Incorporation Registration</p>
              <p className='info'>{data.dateOfIncorporationRegistration}</p>
            </li>
            <li className='form-list'>
              <p>Incorporation State</p>
              <p className='info'>{data.incorporationState}</p>
            </li>
            <li className='form-list'>
              <p>Nature of Business</p>
              <p className='info'>{data.natureOfBusiness}</p>
            </li>
            <li className='form-list'>
              <p>BVN Number</p>
              <p className='info'>{data.BVNNo}</p>
            </li>
            <li className='form-list'>
              <p>NAICOM Lisence Issuing Date</p>
              <p className='info'>{data.NAICOMLisenceIssuingDate}</p>
            </li>
            <li className='form-list'>
              <p>NAICOM Lisence Expiry Date</p>
              <p className='info'>{data.NAICOMLisenceExpiryDate}</p>
            </li>

          </ul>
        </div>
      </div>

      {/* Director/Owner Information */}
      <div className='form-contents'>
        <div className='flex-content'>
          <ul>
            <h1>Directors Profile</h1>
            <li className='form-list'>
              <p>Title</p>
              <p className='info'>{data.title}</p>
            </li>
            <li className='form-list'>
              <p>Gender</p>
              <p className='info'>{data.gender}</p>
            </li>
            <li className='form-list'>
              <p>First Name</p>
              <p className='info'>{data.firstName}</p>
            </li>
            <li className='form-list'>
              <p>Middle Name</p>
              <p className='info'>{data.middleName}</p>
            </li>
            <li className='form-list'>
              <p>Last Name</p>
              <p className='info'>{data.lastName}</p>
            </li>
            <li className='form-list'>
              <p>Residential Address</p>
              <p className='info'>{data.residentialAddress}</p>
            </li>
            <li className='form-list'>
              <p>Position</p>
              <p className='info'>{data.position}</p>
            </li>
            <li className='form-list'>
              <p>Date of Birth</p>
              <p className='info'>{data.dob}</p>
            </li>
            <li className='form-list'>
              <p>Place of Birth</p>
              <p className='info'>{data.placeOfBirth}</p>
            </li>
            <li className='form-list'>
              <p>Occupation</p>
              <p className='info'>{data.occupation}</p>
            </li>
            <li className='form-list'>
              <p>BVN Number</p>
              <p className='info'>{data.BVNNumber}</p>
            </li>
            <li className='form-list'>
              <p>Tax ID Number</p>
              <p className='info'>{data.taxIDNumber}</p>
            </li>
            <li className='form-list'>
              <p>International Passport Number</p>
              <p className='info'>{data.intPassNumber}</p>
            </li>
            <li className='form-list'>
              <p>Passport Issued Country</p>
              <p className='info'>{data.passIssuedCountry}</p>
            </li>
            <li className='form-list'>
              <p>Source Of Income</p>
              <p className='info'>{data.sourceOfIncome}</p>
            </li>
            <li className='form-list'>
              <p>Nationality</p>
              <p className='info'>{data.nationality}</p>
            </li>
            <li className='form-list'>
              <p>Phone Number</p>
              <p className='info'>{data.phoneNumber}</p>
            </li>
            <li className='form-list'>
              <p>Email</p>
              <p className='info'>{data.email}</p>
            </li>
            <li className='form-list'>
              <p>ID Type</p>
              <p className='info'>{data.idType}</p>
            </li>
            <li className='form-list'>
              <p>ID Number</p>
              <p className='info'>{data.idNumber}</p>
            </li>
            <li className='form-list'>
              <p>Issuing Body</p>
              <p className='info'>{data.issuingBody}</p>
            </li>
            <li className='form-list'>
              <p>Issued Date</p>
              <p className='info'>{data.issuedDate}</p>
            </li>
            <li className='form-list'>
              <p>Expiry Date</p>
              <p className='info'>{data.expiryDate}</p>
            </li>

          </ul>
          <ul>
            <h1>Directors Profile 2</h1>
            <li className='form-list'>
              <p>Title</p>
              <p className='info'>{data.title2}</p>
            </li>
            <li className='form-list'>
              <p>Gender</p>
              <p className='info'>{data.gender2}</p>
            </li>
            <li className='form-list'>
              <p>First Name</p>
              <p className='info'>{data.firstName2}</p>
            </li>
            <li className='form-list'>
              <p>Middle Name</p>
              <p className='info'>{data.middleName2}</p>
            </li>
            <li className='form-list'>
              <p>Last Name</p>
              <p className='info'>{data.lastName2}</p>
            </li>
            <li className='form-list'>
              <p>Residential Address</p>
              <p className='info'>{data.residentialAddress2}</p>
            </li>
            <li className='form-list'>
              <p>Position</p>
              <p className='info'>{data.position2}</p>
            </li>
            <li className='form-list'>
              <p>Date of Birth</p>
              <p className='info'>{data.dob2}</p>
            </li>
            <li className='form-list'>
              <p>Place of Birth</p>
              <p className='info'>{data.placeOfBirth2}</p>
            </li>
            <li className='form-list'>
              <p>Occupation</p>
              <p className='info'>{data.occupation2}</p>
            </li>
            <li className='form-list'>
              <p>BVN Number</p>
              <p className='info'>{data.BVNNumber2}</p>
            </li>
            <li className='form-list'>
              <p>Tax ID Number</p>
              <p className='info'>{data.taxIDNumber2}</p>
            </li>
            <li className='form-list'>
              <p>International Passport Number</p>
              <p className='info'>{data.intPassNumber2}</p>
            </li>
            <li className='form-list'>
              <p>Passport Issued Country</p>
              <p className='info'>{data.passIssuedCountry2}</p>
            </li>
            <li className='form-list'>
              <p>Source Of Income</p>
              <p className='info'>{data.sourceOfIncome2}</p>
            </li>
            <li className='form-list'>
              <p>Nationality</p>
              <p className='info'>{data.nationality2}</p>
            </li>
            <li className='form-list'>
              <p>Phone Number</p>
              <p className='info'>{data.phoneNumber2}</p>
            </li>
            <li className='form-list'>
              <p>Email</p>
              <p className='info'>{data.email2}</p>
            </li>
            <li className='form-list'>
              <p>ID Type</p>
              <p className='info'>{data.idType2}</p>
            </li>
            <li className='form-list'>
              <p>ID Number</p>
              <p className='info'>{data.idNumber2}</p>
            </li>
            <li className='form-list'>
              <p>Issuing Body</p>
              <p className='info'>{data.issuingBody2}</p>
            </li>
            <li className='form-list'>
              <p>Issued Date</p>
              <p className='info'>{data.issuedDate2}</p>
            </li>
            <li className='form-list'>
              <p>Expiry Date</p>
              <p className='info'>{data.expiryDate2}</p>
            </li>

          </ul>

        </div>
      </div>

      {/* Account Details */}
      <div className='form-contents'>
        <div className='flex-content'>
          <ul>
            <h1>Account Details</h1>
            <li className='form-list'>
              <p>Account Number</p>
              <p className='info'>{data.accountNumber}</p>
            </li>
            <li className='form-list'>
              <p>Bank Name</p>
              <p className='info'>{data.bankName}</p>
            </li>
            <li className='form-list'>
              <p>Bank Branch</p>
              <p className='info'>{data.bankBranch}</p>
            </li>
            <li className='form-list'>
              <p>Account Opening Date</p>
              <p className='info'>{data.accountOpeningDate}</p>
            </li>
          </ul>
          <ul>
            <h1>Account Details (Dollars)</h1>
            <li className='form-list'>
              <p>Account Number</p>
              <p className='info'>{data.accountNumber2}</p>
            </li>
            <li className='form-list'>
              <p>Bank Name</p>
              <p className='info'>{data.bankName2}</p>
            </li>
            <li className='form-list'>
              <p>Bank Branch</p>
              <p className='info'>{data.bankBranch2}</p>
            </li>
            <li className='form-list'>
              <p>Account Opening Date</p>
              <p className='info'>{data.accountOpeningDate2}</p>
            </li>
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

            <a href={data.incorporation} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Certificate of Incorporation <HiDownload style={style} />{' '}
              </button>
            </a>

            <a href={data.formCO7} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Form CO7 <HiDownload style={style} />{' '}
              </button>
            </a>
            
            <a href={data.VAT} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download VAT Registration Lisence <HiDownload style={style} />{' '}
              </button>
            </a>

            <a href={data.tax} target='_blank' rel='noreferrer'>
              {' '}
              <button className='form-button'>
                Download Tax Clearance Certificate <HiDownload style={style} />{' '}
              </button>
            </a>

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

export default PartnersPage