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
import { toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useFetchUserRole from '../../Components/checkUserRole';
import { useDispatch, useSelector } from 'react-redux';
import images from '../../Constants/images'
import { csrfProtectedPost } from '../../Components/CsrfUtils';

const IndividualSinglePage = () => {

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
    const response = await csrfProtectedPost(`${serverURL}/edit-individual-kyc-form/${data.id}`, {
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
      const docRef = doc(db, 'Individual-kyc-form', id);
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
      doc.setFontSize(15);
      doc.text('(For Individual Clients Only)', doc.internal.pageSize.getWidth() / 2, 125, { align: 'center' });
  
      // Add branch office and date
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Burgundy color
      doc.text(`NEM Branch Office: ${data.officeLocation}`, doc.internal.pageSize.getWidth() / 2, 145, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 165, { align: 'center' });
  
      // Add section 1 - Company Information
      const companyTableColumn = ['', ''];
      const companyTableRows = [
        // ['Office Location', data.officeLocation],
        ['Title', data.title],
        ['First Name', data.firstName],
        ['Middle Name', data.middleName],
        ['Last Name', data.lastName],
        ['COntact Address', data.contactAddress],
        ['Occupation', data.occupation],
        ['Gender', data.gender],
        ['Dater Of Birth', data.dateOfBirth],
        ['Mothers Maiden Name', data.mothersMaidenName],
        ['Employers Name', data.employersName],
        ['EMployers Telephone Number', data.employersTelephoneNumber],
        ['EMployers Address', data.employersAddress],
        ['Tax ID Number', data.taxIDNo],
        ['City', data.city],
        ['State', data.state],
        ['Country', data.country],
        ['Nationality', data.nationality],
        ['Residential Address', data.residentialAddress],
        ['GSM Number', data.GSMno],
        ['Email Address', data.emailAddress],
        ['Identification Type', data.identificationType],
        ['Identification Number', data.idNumber],
        ['Issued Date', data.issuedDate],
        ['Expiry Date', data.expiryDate],
        ['Source Of Income', data.sourceOfIncome],
        ['Annual Income Ramge', data.annualIncomeRange],
        ['Premium Payment Source', data.premiumPaymentSource],    
       ];
      const companyTableProps = {
          startY: 190, // Move the table down
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
      doc.text('Declaration:', 50, doc.autoTable.previous.finalY + 40);
  
      let yPosition = doc.autoTable.previous.finalY + 80; // Increase space after the header
  
      const declarations = [
          {
              text: `I/We ${data.signature1} hereby affirm that all the information provided in this Form/Document is true , accurate and complete to the best of my knowledge.`,
              signature: data.signature1
          },
         
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
    { label: 'Office Location', key: 'officeLocation' },
    { label: 'Title', key: 'title' },
    { label: 'First Name', key: 'firstName' },
    { label: 'Middle Name', key: 'middleName' },
    { label: 'Last Name', key: 'lastName' },
    { label: 'Contact Address', key: 'contactAddress' },
    { label: 'Occupation', key: 'occupation' },
    { label: 'Gender', key: 'gender' },
    { label: 'Date Of Birth', key: 'dateOfBirth' },
    { label: 'Tax Identification Number', key: 'taxIDNo' },
    { label: 'Mother\'s Maiden Name', key: 'mothersMaidenName' },
    { label: 'Employer\'s Name', key: 'employersName' },
    { label: 'Employer\'s Telephone Number', key: 'employersTelephoneNumber' },
    { label: 'Employer\'s Address', key: 'employersAddress' },

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
          { label: 'City', key: 'city' },
          { label: 'State', key: 'state' },
    { label: 'Country', key: 'country' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Residential Address', key: 'residentialAddress' },
    { label: 'GSM Number', key: 'GSMno' },
    { label: 'Email Address', key: 'emailAddress' },
    { label: 'Identification Type', key: 'identificationType' },
    { label: 'Identification Number', key: 'idNumber' },
    { label: 'Issued Date', key: 'issuedDate' },
    { label: 'Expiry Date', key: 'expiryDate' },
    { label: 'Source Of Income', key: 'sourceOfIncome' },
    { label: 'Annual Income Range', key: 'annualIncomeRange' },
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
              <p className='doc-p'>Identification</p>
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
    <div className='file-download'>
    <button className='form-button' onClick={downloadPDF}>Download Form <HiDownload style={style} /> </button>
    </div>
   
    </div>
    
  )
}

export default IndividualSinglePage
