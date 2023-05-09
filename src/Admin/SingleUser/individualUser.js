import React,{useEffect, useState} from 'react'
// import './SingleUser.scss'
import { collection, getDocs, deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { list } from 'firebase/storage';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import './single.scss'
// import Status from '../Table/Status';
// import Basic from './../Table/Basic';

const IndividualUser = () => {

    const [data, setData] = useState([]);

    const {id} = useParams();

    const style={
        size:30,
        marginLeft:10,
        color:'white'
    }

    useEffect(
        ()=>{
            const docRef = doc(db, 'individuals', id);
            onSnapshot(docRef, (snapshot) =>{
                setData({...snapshot.data(), id:snapshot.id});
            })
        }
    )
      
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
        const companyTableRows = [    ['Company Name', data.companyName],
          ['Registered Company Address', data.registeredCompanyAddress],
          ['Contact Telephone Number', data.contactTelephoneNumber],
          ['Email Address', data.emailAddress],
          ['Website', data.website],
          ['Contact Person', data.contactPerson],
          ['Tax Identification Number', data.taxIdentificationNumber],
          ['VAT Registration Number', data.VATRegistrationNumber],
          ['Date of Incorporation Registration', data.dateOfIncorporationRegistration],
          ['Incorporation State', data.incorporationState],
          ['Company Type', data.companyType],
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
          ['Date of Birth', data.dob],
          ['First Name', data.firstName],
          ['Last Name', data.lastName],
          ['Residential Address', data.residentialAddress],
          ['Issuing Body', data.issuingBody],
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
    ['Date of Birth', data.dob2],
    ['First Name', data.firstName2],
    ['Last Name', data.lastName2],
    ['Residential Address', data.residentialAddress2],
    ['Issuing Body', data.issuingBody2],
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
['Acount Opening Date', data.accountOpeningDate],
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
    ['Acount Opening Date', data.accountOpeningDate2],
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
        <div className='form-contents'>
        <div className='flex-content'>
            <ul > 
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
                    <p>Contact Telephone Number</p>
                    <p className='info'>{data.contactTelephoneNumber}</p>
                </li>
                <li className='form-list'>
                    <p>Email Address</p>
                    <p className='info'>{data.emailAddress}</p>
                </li>
                <li className='form-list'>
                    <p>Website</p>
                    <p className='info'>{data.website}</p>
                </li>
                <li className='form-list'>
                    <p>Contact Person</p>
                    <p className='info'>{data.contactPerson}</p>
                </li>
                </ul>
                <ul className='form-ul'>
                <li className='form-list'>
                    <p>Tax Identification Number</p>
                    <p className='info'>{data.taxIdentificationNumber}</p>
                </li>
                <li className='form-list'>
                <p>VAT Registration Number</p>
                <p className='info'>{data.VATRegistrationNumber}</p>
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
                    <p>Company Type</p>
                    <p className='info'>{data.companyType}</p>
            </li>
            </ul>
            </div>
        </div>
        <div className='form-contents'>
            <div className='flex-content'>
            <ul>
            <h1>Directors Profile</h1>
            <li className='form-list'>
                    <p>Date Of Birth</p>
                    <p className='info'>{data.dob}</p>
            </li>
            <li className='form-list'>
                    <p>First Name</p>
                    <p className='info'>{data.firstName}</p>
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
                    <p>Issuing Body</p>
                    <p className='info'>{data.issuingBody}</p>
            </li>
            </ul>
            <ul>
            <h1>Directors Profile 2</h1>
            <li className='form-list'>
                    <p>Date Of Birth</p>
                    <p className='info'>{data.dob2}</p>
            </li>
            <li className='form-list'>
                    <p>First Name</p>
                    <p className='info'>{data.firstName2}</p>
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
                    <p>Issuing Body</p>
                    <p className='info'>{data.issuingBody2}</p>
            </li>
            </ul>
            </div>
        </div>
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
                    <p>Bank Branch Body</p>
                    <p className='info'>{data.bankBranch}</p>
            </li>
            <li className='form-list'>
                    <p>Account Opening Date</p>
                    <p className='info'>{data.accountOpeningDate}</p>
            </li>
            </ul>
            <ul>
            <h1>Account Details(Dollars)</h1>
            <li className='form-list'>
                    <p>Account Number</p>
                    <p className='info'>{data.accountNumber2}</p>
            </li>
            <li className='form-list'>
                    <p>Bank Name</p>
                    <p className='info'>{data.bankName2}</p>
            </li>
            <li className='form-list'>
                    <p>Bank Branch Body</p>
                    <p className='info'>{data.bankBranch2}</p>
            </li>
            <li className='form-list'>
                    <p>Account Opening Date</p>
                    <p className='info'>{data.accountOpeningDate2}</p>
            </li>
        </ul>
            </div>
        </div>
    </div>
    <div className='file-download'>
    <button className='form-button' onClick={downloadPDF}>Download Form <HiDownload style={style} /> </button>
    </div>
    </div>
    
  )
}

export default IndividualUser