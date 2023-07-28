import React,{useEffect, useState} from 'react'
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { useParams } from 'react-router-dom';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
import './single.scss'

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
        doc.text('NEM Insurance Individual KYC Form', 50, 70);
      
        // Add section 1 - Company Information
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(16);
        doc.text('Personal Information', 60, 120);
      
        const companyTableColumn = ['Personal Information', ''];
        const companyTableRows = [
            ['Insured', data.title],
            ['Insured', data.firstName],
            ['Insured', data.lastName],
            ['Contact Address', data.contactAddress],
            ['Gender', data.gender],
            ['Nationality', data.nationality],
            ['Country', data.country],
            ['Date of Birth', data.dateOfBirth],
            ['Place of Birth', data.placeOfBirth],
            ['Occupation', data.occupation],
            ['Position', data.position],
            ['Premium Payment Source', data.premiumPaymentSource],
            ['GSM Number', data.GSMno],
            ['Residential Address', data.residentialAddress],
            ['Email Address', data.emailAddress],
            ['Tax ID Number', data.taxIDNumber],
            ['BVN Number', data.BVNNumber],
            ['Identification Type', data.identificationType],
            ['Identification Number', data.identificationNumber],
            ['Issuing Country', data.issuingCountry],
            ['Issued Date', data.issuedDate],
            ['Expiry Date', data.expiryDate],
            // ['International Passport Number', data.intPassNo],
            // ['Passport Country', data.passCountry],
            ['Business Type', data.businessType],
            ['Employer\'s Name', data.employersName],
            ['Employer\'s Address', data.employersAddress],
            ['Employer\'s Telephone Number', data.employersTelephoneNumber],
            ['Employer\'s Email', data.employersEmail],
            // ['Mother\'s Maiden Name', data.mothersMaidenName],
            // ['City', data.city],
            // ['State', data.state],
            // ['Office Address', data.officeAddress],
            ['Annual Income Range', data.annualIncomeRange],
            // ['Date', data.date],
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
        <p>Title</p>
        <p className='info'>{data.title}</p>
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
        <p>Contact Address</p>
        <p className='info'>{data.contactAddress}</p>
      </li>
      <li className='form-list'>
        <p>Gender</p>
        <p className='info'>{data.gender}</p>
      </li>
      <li className='form-list'>
        <p>Nationality</p>
        <p className='info'>{data.nationality}</p>
      </li>
      <li className='form-list'>
        <p>Country</p>
        <p className='info'>{data.country}</p>
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
        <p>Occupation</p>
        <p className='info'>{data.occupation}</p>
      </li>
      <li className='form-list'>
        <p>Position</p>
        <p className='info'>{data.position}</p>
      </li>
      <li className='form-list'>
        <p>Premium Payment Source</p>
        <p className='info'>{data.premiumPaymentSource}</p>
      </li>
      <li className='form-list'>
        <p>Mobile Number</p>
        <p className='info'>{data.GSMno}</p>
      </li>
      <li className='form-list'>
        <p>Residential Address</p>
        <p className='info'>{data.residentialAddress}</p>
      </li>
      <li className='form-list'>
        <p>Email Address</p>
        <p className='info'>{data.emailAddress}</p>
      </li>
    </ul>
    <ul>
      <li className='form-list'>
        <p>Identification Number</p>
        <p className='info'>{data.identificationNumber}</p>
      </li>
      <li className='form-list'>
        <p>BVN Number</p>
        <p className='info'>{data.BVNNumber}</p>
      </li>
      <li className='form-list'>
        <p>Identification Type</p>
        <p className='info'>{data.identificationType}</p>
      </li>
      <li className='form-list'>
        <p>Issuing Country</p>
        <p className='info'>{data.issuingCountry}</p>
      </li>
      <li className='form-list'>
        <p>Issued Date</p>
        <p className='info'>{data.issuedDate}</p>
      </li>
      <li className='form-list'>
        <p>Expiry Date</p>
        <p className='info'>{data.expiryDate}</p>
      </li>
      {/* <li className='form-list'>
        <p>International Passport Number</p>
        <p className='info'>{data.intPassNo}</p>
      </li>
      <li className='form-list'>
        <p>Passport Country</p>
        <p className='info'>{data.passCountry}</p>
      </li> */}
      <li className='form-list'>
        <p>Employer's Name</p>
        <p className='info'>{data.employersName}</p>
      </li>
      <li className='form-list'>
        <p>Employer's Address</p>
        <p className='info'>{data.employersAddress}</p>
      </li>
      <li className='form-list'>
        <p>Employer's Telephone Number</p>
        <p className='info'>{data.employersTelephoneNumber}</p>
      </li>
      <li className='form-list'>
        <p>Employer's Email</p>
        <p className='info'>{data.employersEmail}</p>
      </li>
      <li className='form-list'>
        <p>Business Type</p>
        <p className='info'>{data.businessType}</p>
      </li>
      <li className='form-list'>
        <p>Annual Income Range</p>
        <p className='info'>{data.annualIncomeRange}</p>
      </li>
      {/* <li className='form-list'>
        <p>Date</p>
        <p className='info'>{data.date}</p>
      </li> */}
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

export default IndividualUser