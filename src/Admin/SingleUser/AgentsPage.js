import React,{useEffect, useState} from 'react'
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { useParams } from 'react-router-dom';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import './single.scss'
import { UserAuth } from '../../Context/AuthContext';
import useAutoLogout from '../../Components/Timeout';

const AgentsPage = () => {

    const [data, setData] = useState([]);

    const { logout } = UserAuth(); // Replace UserAuth with your authentication context

    // Use the custom hookfor the automatic logout
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
      const docRef = doc(db, 'agents-kyc', id);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
          setData({...snapshot.data(), id: snapshot.id});
      });
  
      // Return a cleanup function to unsubscribe the listener when the component unmounts
      return () => unsubscribe();
  }, [id]);

      
    const downloadPDF = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
      
        // doc.setFontSize(24);
        // doc.setTextColor(128, 0, 32);
        // doc.text('NEM Insurance PLC', 50, 70);
      
        // Add header
        doc.setFontSize(24);
        doc.setTextColor(128, 0, 32);
        doc.text('Agents Onboarding KYC/Due Dilligence Form', 50, 70);
      
        // Add section 1 - Company Information
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(16);
        doc.text('Personal Information', 60, 120);
      
        const companyTableColumn = ['Personal Information', ''];
        const companyTableRows = [
            ['First Name', data.firstName],
            ['Middle Name', data.middleName],
            ['Last Name', data.lastName],
            ['Residential Address', data.residentialAddress],
            ['Gender', data.gender],
            ['Position', data.position],
            ['Date of Birth', data.dateOfBirth],
            ['Place of Birth', data.placeOfBirth],
            ['Source of Income', data.sourceOfIncome],
            ['Nationality', data.nationality],
            ['GSM Number', data.GSMno],
            ['BVN Number', data.BVNNumber],
            ['Tax ID Number', data.taxIDNumber],
            ['Occupation', data.occupation],
            ['Email Address', data.emailAddress],
            ['ID Type', data.idType],
            ['ID Number', data.idNumber],
            ['Issuing Body', data.issuingBody],
            ['Issued Date', data.issuedDate],
            ['Expiry Date', data.expiryDate],

          
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
      
       
        const agentsInfoTableColumn = ['Agents Profile', ''];
        const agentsInfoTableRows = [
          ['Agents Name', data.agentsName],      
          ['Agents Address', data.agentsAddress],
          ['NAICOM Lisence Number', data.naicomNo],
          ['Issuing Country', data.issuingCountry],
          ['Lisence Issued Date', data.lisenceIssuedDate],
          ['Lisence Expiry Date', data.lisenceExpiryDate],
          ['Email Address', data.agentsEmail],
          ['Website', data.website],
          ['Mobile Number', data.mobileNo],
          ['Tax Identification Number', data.taxIDNo],
          ['ARIAN Membership Number', data.arian],
          ['List of Agents Approved Principals (Insurer)', data.listOfAgents],
        ]

        const agentsInfoTableProps = {
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
          
          doc.autoTable(agentsInfoTableColumn, agentsInfoTableRows, agentsInfoTableProps);
        
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

// Save the PDF
doc.save('KYC Form.pdf');
    }


  return (
  <div className='singles'>
    <div className='form-content'>
    <div className='form-contents'>
  <div className='flex-content'>
    <ul>
      <h1 className='content-h1'>Personal Information</h1>

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
        <p>Gender</p>
        <p className='info'>{data.gender}</p>
      </li>
      <li className='form-list'>
        <p>Position</p>
        <p className='info'>{data.position}</p>
      </li>
      <li className='form-list'>
        <p>Date of Birth</p>
        <p className='info'>{data.dateOfBirth}</p>
      </li>
      <li className='form-list'>
        <p>Place of Birth</p>
        <p className='info'>{data.placeOfBirth}</p>
      </li>
      <li className='form-list'>
       <p>Source Of Income</p>
        <p className='info'>{data.sourceOfIncome}</p>
    </li>
     <li className='form-list'>
         <p>Nationality</p>
         <p className='info'>{data.nationality}</p>
      </li>

    </ul>
    <ul>
    <li className='form-list'>
        <p>Mobile Number</p>
        <p className='info'>{data.GSMno}</p>
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
        <p>Occupation</p>
        <p className='info'>{data.occupation}</p>
      </li>
      <li className='form-list'>
        <p>Email Address</p>
        <p className='info'>{data.emailAddress}</p>
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
  </div>
  {/* Agents Profile */}


        <div className='flex-content'>
    <ul>
    <h1 className='content-h1'>Agents Profile</h1>
    <li className='form-list'>
        <p>Agents Name</p>
        <p className='info'>{data.agentsName}</p>
      </li>

      <li className='form-list'>
        <p>Agents Address</p>
        <p className='info'>{data.agentsAddress}</p>
      </li>
      <li className='form-list'>
        <p>NAICOM Lisence Number</p>
        <p className='info'>{data.naicomNo}</p>
      </li>
      <li className='form-list'>
        <p>BVN Number</p>
        <p className='info'>{data.BVNNumber}</p>
      </li>

      <li className='form-list'>
        <p>Lisence Issued Date</p>
        <p className='info'>{data.lisenceIssuedDate}</p>
      </li>
      <li className='form-list'>
        <p>Lisence Expiry Date</p>
        <p className='info'>{data.lisenceExpiryDate}</p>
      </li>
          </ul>
          <ul>
          <li className='form-list'>
        <p>Email Address</p>
        <p className='info'>{data.agentsEmail}</p>
      </li>
      <li className='form-list'>
        <p>Website</p>
        <p className='info'>{data.website}</p>
      </li>
      <li className='form-list'>
        <p>Mobile Number</p>
        <p className='info'>{data.mobileNo}</p>
      </li>
      <li className='form-list'>
        <p>Tax Identification Number</p>
        <p className='info'>{data.taxIDNo}</p>
      </li>
      <li className='form-list'>
        <p>ARIAN Membership Number</p>
        <p className='info'>{data.arian}</p>
      </li>
      <li className='form-list'>
        <p>List of Agents Approved Principals (Insurer)</p>
        <p className='info'>{data.listOfAgents}</p>
      </li>

          </ul>
        </div>

    {/* Account Details */}
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
            <h1>Account Details (Foreign)</h1>
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
  
</div>

      <div className='form-contents'>
        <div className='flex-content'>
          <ul>
            <h1>Documents</h1>
            <li className='form-list'>
              <p>Signature</p>
              {data.signature ? (
                <a href={data.signature} target='__blank'>
                  <button className='form-button'>
                    Download Signature <HiDownload style={style} />
                  </button>
                </a>
              ) : (
                <p className='info'>Signature not available</p>
              )}
            </li>
            <li className='form-list'>
              <p>Identification</p>
              {data.identification ? (
                <a href={data.identification} target='__blank'>
                  <button className='form-button'>
                    Download Identification <HiDownload style={style} />
                  </button>
                </a>
              ) : (
                <p className='info'>Identification not available</p>
              )}
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

export default AgentsPage