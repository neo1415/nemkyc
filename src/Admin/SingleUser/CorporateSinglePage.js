import React,{useEffect} from 'react'
import { doc, onSnapshot } from "firebase/firestore";
import { db, storage } from '../../APi/index';
import { useParams } from 'react-router-dom';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import './single.scss'
import { UserAuth } from '../../Context/AuthContext';
import useAutoLogout from '../../Components/Timeout';
import { toast, } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useFetchUserRole from '../../Components/checkUserRole';
import { useDispatch, useSelector } from 'react-redux';
import images from '../../Constants/images'
import { ref,getDownloadURL } from "firebase/storage";
import { csrfProtectedPost } from '../../Components/CsrfUtils';

const CorporateSinglePage = () => {

  const dispatch = useDispatch();
  const { user } = UserAuth();
  const userRole = useFetchUserRole(user);
const data = useSelector(state => state.data);
const editData = useSelector(state => state.editData);
const editingKey = useSelector(state => state.editingKey);

const handleDownload = async (url, fileName) => {
  try {
   
    const fileRef = ref(storage, url);
    const downloadUrl = await getDownloadURL(fileRef);

    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'downloaded-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Optionally, revoke the blob URL after the download
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Failed to download document.');
  }
};


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
    const response = await csrfProtectedPost(`${serverURL}/edit-corporate-kyc-form/${data.id}`, {
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
      const docRef = doc(db, 'corporate-kyc-form', id);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
          dispatch({ type: 'SET_DATA', data: { ...snapshot.data(), id: snapshot.id } });
      });
  
      // Return a cleanup function to unsubscribe the listener when the component unmounts
      return () => unsubscribe();
    }, [id, dispatch]);

      
    const downloadPDF = () => {
      const doc = new jsPDF('p', 'pt', 'a4');
  
      // Add image (if you have one)
      const imgData = `${images.logo}/jpeg;base64,...`// replace with your image data
      doc.addImage(imgData, 'JPEG', 15, 15, 50, 50);
  
      // Add main header
      doc.setFontSize(23);
      doc.setTextColor(128, 0, 32); // Burgundy color
      doc.text('NEM Insurance PLC', doc.internal.pageSize.getWidth() / 2, 50, { align: 'center' });
  
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('199, IKORODU ROAD, OBANIKORO, LAGOS PO Box 654 Marina Tel:', doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });
      doc.text('01-448956-09; 01 4489570 Email: nem@nem-insurance.com; ', doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
      doc.text('Claims@nem-insurance.com ', doc.internal.pageSize.getWidth() / 2, 90, { align: 'center' });
  
      // Add subheaders
      doc.setFontSize(15);
      doc.text('Corporate Customer KYC Profile', doc.internal.pageSize.getWidth() / 2, 110, { align: 'center' });
      // doc.setFontSize(15);
      // doc.text('(For Individual Clients Only)', doc.internal.pageSize.getWidth() / 2, 110, { align: 'center' });
  
      // Add branch office and date
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Burgundy color
      doc.text(`NEM Branch Office: ${data.branchOffice}`, doc.internal.pageSize.getWidth() / 2, 130, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 150, { align: 'center' });
  
      // Add section 1 - Company Information
      const companyTableColumn = ['', ''];
      const companyTableRows = [
          // ['Branch Office', data.branchOffice],
          ['insured', data.insured],
          ['Office Address', data.officeAddress],
          ['Ownership Of Company', data.ownershipOfCompany],
          ['Contact Person', data.contactPerson],
          ['contact Person Number', data.contactPersonNo],
          ['Email Address', data.emailAddress],
          ['Nature Of Business', data.natureOfBusiness],
          ['Incorporation Number', data.incorporationNumber],
          ['Incorporation State', data.incorporationState],
['Date of Incorporation / Registration', data.dateOfIncorporationRegistration],
['Website', data.website],
['BVN Number', data.BVNNumber],
['Tax ID Number', data.taxIDNo],
          ['Estimated Turnover', data.estimatedTurnover],
          ['Premium Payment Source', data.premiumPaymentSource],
          ['Account Number', data.accountNumber],
          ['Bank Name', data.bankName],
          ['Bank Branch', data.bankBranch],
          ['Account Opening Date', data.accountOpeningDate],

      ];
  
      const companyTableProps = {
          startY: 170, // Move the table down
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
                  // fillColor: [255, 255, 255], // Burgundy color
                  textColor: [0, 0, 0], // White color
                  fontStyle: 'bold',
              },
              1: {
                  fillColor: [255, 255, 255],
                  textColor: [0, 0, 0],
              },
          },
          headStyles: {
              fillColor: [128, 0, 32], // Burgundy color
          },
      };
  
      doc.autoTable(companyTableColumn, companyTableRows, companyTableProps);

              // Add sub-section - Directors Information
              doc.setFontSize(18);
              doc.setTextColor(0, 0, 0);
              doc.text('Directors Information', 40, doc.lastAutoTable.finalY + 60);
      
            
              const directorsTableColumn = ['Director One', ''];
              const directorsTableRows = [
                      ['First Name', data.firstName],
                      ['Middle Name', data.middleName],
                      ['Last Name', data.lastName],
                      ['Date of Birth', data.dob],
                      // ['Position', data.position],
                      ['Place of Birth', data.placeOfBirth],
                      ['Nationality', data.nationality],
                      ['Country', data.country],
                      ['Occupation', data.occupation],
                      ['Email', data.email],
                      ['Phone Number', data.phoneNumber],
                      ['BVN Number', data.BVNNumber],
                      ['Employer\'s Name', data.employersName],
                      ['Enployers Phone Number', data.employersPhoneNumber],
                      ['Residential Address', data.residentialAddress],
                      ['Tax ID Number', data.taxIDNumber],
                      // ['International Passport Number', data.intPassNo],
                      // ['Passport Country', data.passCountry],
                      ['ID Type', data.idType],
                      ['ID Number', data.idNumber],
                      ['Issuing Body', data.issuingBody],
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

      // Add privacy declarations
      doc.setFontSize(14);
      // doc.setFontStyle('bold' , doc.internal.pageSize.getWidth() / 2, 150, { align: 'center' })
      doc.text('Declarations:', 50, doc.autoTable.previous.finalY + 40);
  
      let yPosition = doc.autoTable.previous.finalY + 80; // Increase space after the header
  
      const declarations = [
          {
              text: `I/We ${data.signature1} declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.`,
              signature: data.signature1
          },
          {
              text: `I/We ${data.signature2} agree to provide additional information to NEM Insurance, if required.`,
              signature: data.signature2
          },
          {
              text: `I/We ${data.signature3} agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.`,
              signature: data.signature3
          }
      ];
  
      declarations.forEach((declaration, index) => {
        const lines = doc.splitTextToSize(declaration.text, 500); // Adjust the width as needed
        doc.text(lines, 50, yPosition);
        // const textWidth = doc.getTextWidth(declaration.signature);
        // doc.line(80, yPosition + 5, 50 + textWidth, yPosition + 5); // Underline the signature
        yPosition += 24 * lines.length; // Adjust this value as needed to space out the declarations
    });
    
    // Add date under the declarations
    const dateText = `Date: ${new Date().toLocaleDateString()}`;
    doc.text(dateText, 50, yPosition + 20);
    // const dateWidth = doc.getTextWidth(dateText);
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
    <h1 className='content-h1'>Corporate KYC</h1>
    {[
      { label: 'Branch Office', key: 'branchOffice' },
      { label: 'Insured', key: 'insured' },
      { label: 'Office Address', key: 'officeAddress' },
      { label: 'Ownership Of Company', key: 'ownershipOfCompany' },
      { label: 'contactPerson', key: 'contactPerson' },
      { label: 'Website', key: 'website' },
      { label: 'Incorporation Number', key: 'incorporationNumber' },
      { label: 'Incorporation State', key: 'incorporationState' },
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
        { label: 'Date of Incorporation Registration', key: 'dateOfIncorporationRegistration' },
        { label: 'BVN Number', key: 'BVNNumber' },
        { label: 'Tax Identification Number', key: 'taxIDNo' },
      { label: 'Contact Person Number', key: 'contactPersonNo' },
      { label: 'emailAddress', key: 'emailAddress' },
      { label: 'Nature Of Business', key: 'natureOfBusiness' },
      { label: 'Estimated Turnover', key: 'estimatedTurnover' },
      { label: 'Premium Payment Source', key: 'premiumPaymentSource' },

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

      {/* Director/Owner Information */}
      <div className='form-contents'>
        <div className='flex-content'>
          <ul>
            <h1>Directors Profile</h1>
           {[
  { label: 'First Name', key: 'firstName' },
  { label: 'Middle Name', key: 'middleName' },
  { label: 'Last Name', key: 'lastName' },
  { label: 'Date of Birth', key: 'dob' },
  { label: 'Place of Birth', key: 'placeOfBirth' },
  { label: 'Nationality', key: 'nationality' },
  { label: 'Country', key: 'country' },
  { label: 'Occupation', key: 'occupation' },
  { label: 'Email', key: 'email' },
  { label: 'Phone Number', key: 'phoneNumber' },
  { label: 'BVN Number', key: 'BVNNumber' },

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
  <h1>Directors Profile 2</h1>
{[
  { label: 'Employer\'s Name', key: 'employersName' },
  { label: 'Employer\'s Phone Number', key: 'employersPhoneNumber' },
  { label: 'Residential Address', key: 'residentialAddress' },
  { label: 'Tax ID Number', key: 'taxIDNumber' },
  { label: 'ID Type', key: 'idType' },
  { label: 'ID Number', key: 'idNumber' },
  { label: 'Issuing Body', key: 'issuingBody' },
  { label: 'Issued Date', key: 'issuedDate' },
  { label: 'Expiry Date', key: 'expiryDate' },
  { label: 'Source Of Income', key: 'sourceOfIncome' },
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
            <h1>Account Details (Dollars)</h1>
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
        <ul className='doc-ul'>
            <h1>Documents</h1>
            <li className='form-list'>
              <p className='doc-p'>Verification Document</p>
              {data.verificationDoc ? (
                <a href={data.verificationDoc} target='__blank'>
                 <button
                  className='form-button'
                  onClick={() => handleDownload(data.verificationDoc, 'Verification_Document.pdf')}
                >
                    Download Document <HiDownload style={style} />
                  </button>
                </a>
              ) : (
                <p className='info'>Verification Document not available</p>
              )}
            </li>
            {/* <li className='form-list'>
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
            </li> */}
          </ul>
      </div>
    </div>
    <div className='file-download'>
    <button className='form-button' onClick={downloadPDF}>Download Form <HiDownload style={style} /> </button>
    </div>
   
    </div>
    
  )
}

export default CorporateSinglePage