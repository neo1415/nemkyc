import React,{useEffect} from 'react'
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { useParams } from 'react-router-dom';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import './single.scss'
import { UserAuth } from '../../Context/AuthContext';
import useAutoLogout from '../../Components/Timeout';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useFetchUserRole from '../../Components/checkUserRole';
import { useDispatch, useSelector } from 'react-redux';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

const AgentsPage = () => {

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
        const response = await csrfProtectedPost(`${serverURL}edit-agents-form/${data.id}`, {
          [key]: editData[key]
        });
    
        const result = response.data;
    
        if (response.status !== 200) {
          console.error(result.error);
          // If the server returns an error, revert the changes in the UI
          dispatch({ type: 'SET_EDIT_DATA', data });
          toast.error('Update failed. Please try again.');
        } else {
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
          dispatch({ type: 'SET_DATA', data: { ...snapshot.data(), id: snapshot.id } });
      });
  
      // Return a cleanup function to unsubscribe the listener when the component unmounts
      return () => unsubscribe();
    }, [id, dispatch]);

      
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
          // ['Issuing Country', data.issuingCountry],
          ['Lisence Issued Date', data.lisenceIssuedDate],
          ['Lisence Expiry Date', data.lisenceExpiryDate],
          ['Email Address', data.agentsEmail],
          // ['Website', data.website],
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

  // Add privacy declarations
  doc.setFontSize(14);
  // doc.setFontStyle('bold' , doc.internal.pageSize.getWidth() / 2, 150, { align: 'center' })
  doc.text('Declaration:', 50, doc.autoTable.previous.finalY + 40);

  let yPosition = doc.autoTable.previous.finalY + 80; // Increase space after the header

  const declarations = [
      {
          text: `I/We ${data.signature} hereby affirm that all the information provided in this Form/Document is true , accurate and complete to the best of my knowledge..`,
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
      {[
        { label: 'First Name', key: 'firstName' },
        { label: 'Middle Name', key: 'middleName' },
        { label: 'Last Name', key: 'lastName' },
        { label: 'Residential Address', key: 'residentialAddress' },
        { label: 'Gender', key: 'gender' },
        { label: 'Position', key: 'position' },
        { label: 'Date of Birth', key: 'dateOfBirth' },
        { label: 'Place of Birth', key: 'placeOfBirth' },
        { label: 'Source Of Income', key: 'sourceOfIncome' },
        { label: 'Nationality', key: 'nationality' },
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
              {userRole === 'admin' && (
                <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
    <ul>
      {[
        { label: 'Mobile Number', key: 'GSMno' },
        { label: 'BVN Number', key: 'BVNNumber' },
        { label: 'Tax ID Number', key: 'taxIDNumber' },
        { label: 'Occupation', key: 'occupation' },
        { label: 'Email Address', key: 'emailAddress' },
        { label: 'ID Type', key: 'idType' },
        { label: 'ID Number', key: 'idNumber' },
        { label: 'Issuing Body', key: 'issuingBody'},
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
              {userRole === 'admin' && (
                <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
  <div className='flex-content'>
    <ul>
      <h1 className='content-h1'>Agents Profile</h1>
      {[
        { label: 'Agents Name', key: 'agentsName' },
        { label: 'Agents Address', key: 'agentsAddress' },
        { label: 'NAICOM Lisence Number', key: 'naicomNo' },
        { label: 'BVN Number', key: 'BVNNumber' },
        { label: 'Lisence Issued Date', key: 'lisenceIssuedDate' },
        { label: 'Lisence Expiry Date', key: 'lisenceExpiryDate' },
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
              {userRole === 'admin' && (
                <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
    <ul>
      {[
        { label: 'Email Address', key: 'agentsEmail' },
        { label: 'Website', key: 'website' },
        { label: 'Mobile Number', key: 'mobileNo' },
        { label: 'Tax Identification Number', key: 'taxIDNo' },
        { label: 'ARIAN Membership Number', key: 'arian' },
        { label: 'List of Agents Approved Principals (Insurer)', key: 'listOfAgents' },
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
              {userRole === 'admin' && (
                <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
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
              {userRole === 'admin' && (
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
              {userRole === 'admin' && (
                <button onClick={() => handleEditClick(key)} className='edit-button'>Edit</button>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
</div>


      <div className='form-contents'>
        <div className='flex-content'>
          <ul>
            <h1>Signature</h1>
            <li className='form-list'>
              <p>i {data.signature} acknowledge and 
                agree to the purpose set-out in this clause 
                and our data privacy policy. Thank you </p>
              {/* {data.signature ? (
                <a href={data.signature} target='__blank'>
                  <button className='form-button'>
                    Download Signature <HiDownload style={style} />
                  </button>
                </a>
              ) : (
                <p className='info'>Signature not available</p>
              )} */}
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