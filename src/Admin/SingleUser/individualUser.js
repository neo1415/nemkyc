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
        doc.text('NEM Insurance Individual KYC Form', 50, 70);
      
        // Add section 1 - Company Information
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(16);
        doc.text('Personal Information', 60, 120);
      
        const companyTableColumn = ['Personal Information', ''];
        const companyTableRows = [    ['Insured', data.insured],
          ['Contact  Address', data.contactAddress],
          ['Contacts Telephone Number', data.contactTelephoneNumber],
          ['Occupation', data.occupation],
          ['Gender', data.gender],
          ['Date of Birth', data.dateOfBirth],
          ['Mothers Naiden Name', data.mothersMaidenName],
          ['Employers Name', data.employersName],
          ['Employers Telephone Number', data.employersTelephoneNumber],
          ['EMployers Address', data.employersAddress],
          ['City', data.city],
          ['State', data.state],
          ['Country', data.country],
          ['Nationality', data.nationality],
          ['Residential Address', data.residentialAddress],
          ['Office Adress', data.officeAddress],
          ['GSM Number', data.GSMno],
          ['Email Address', data.emailAddress],
          ['Identification Type', data.identificationType],
          ['Identification Number', data.identificationNumber],
          ['Issued Date', data.issuedDate],
          ['Expiry Date', data.expiryDate],
          ['Annual Income Range', data.officeAddress],
          ['Premium Payment Source', data.premiumPaymentSource],
          ['Date', data.date],
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
            <ul > 
            <h1 className='content-h1'>Personal Information</h1>
                <li className='form-list'>
                    <p>Insured</p>
                    <p className='info'>{data.insured}</p>
                </li>
                <li className='form-list'>
                    <p>Contact Address</p>
                    <p className='info'>{data.contactAddress}</p>
                </li>
                <li className='form-list'>
                    <p>Contact Telephone Number</p>
                    <p className='info'>{data.contactTelephoneNumber}</p>
                </li>
                <li className='form-list'>
                    <p>Occupation</p>
                    <p className='info'>{data.occupation}</p>
                </li>
                <li className='form-list'>
                    <p>Gender</p>
                    <p className='info'>{data.gender}</p>
                </li>
                <li className='form-list'>
                    <p>Date of Birth</p>
                    <p className='info'>{data.dateOfBirth}</p>
                </li>
                </ul>
                <ul className='form-ul'>
                <li className='form-list'>
                    <p>Mothers Maiden Name</p>
                    <p className='info'>{data.mothersMaidenName}</p>
                </li>
                <li className='form-list'>
                <p>Employers Name</p>
                <p className='info'>{data.employersName}</p>
            </li>
            <li className='form-list'>
                    <p>Employer's Telephone Number</p>
                    <p className='info'>{data.employersTelephoneNumber}</p>
            </li>
            <li className='form-list'>
                <p>City</p>
                <p className='info'>{data.city}</p>
            </li>
            <li className='form-list'>
                    <p>State</p>
                    <p className='info'>{data.state}</p>
            </li>
            </ul>
            </div>
        </div>
        <div className='form-contents'>
            <div className='flex-content'>
            <ul>
            <h1>More Information</h1>
            <li className='form-list'>
                    <p>Country</p>
                    <p className='info'>{data.country}</p>
            </li>
            <li className='form-list'>
                    <p>Nationality</p>
                    <p className='info'>{data.nationality}</p>
            </li>
            <li className='form-list'>
                    <p>Residential Address</p>
                    <p className='info'>{data.residentialAddress}</p>
            </li>
            <li className='form-list'>
                    <p>Office Address</p>
                    <p className='info'>{data.officeAddress}</p>
            </li>
            <li className='form-list'>
                    <p>GSM Number</p>
                    <p className='info'>{data.GSMno}</p>
            </li>
            </ul>
            <ul>
            <li className='form-list'>
                    <p>Email Address</p>
                    <p className='info'>{data.emailAddress}</p>
            </li>
            <li className='form-list'>
                    <p>Identification Type</p>
                    <p className='info'>{data.identificationType}</p>
            </li>
            <li className='form-list'>
                    <p>Identification Number</p>
                    <p className='info'>{data.identificationNumber}</p>
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
        </div>
        <div className='form-contents'>
            <ul>
            <h1>Income Information</h1>
            <li className='form-list'>
                    <p>Annual Income Range</p>
                    <p className='info'>{data.annualIncomeRange}</p>
            </li>
            <li className='form-list'>
                    <p>Premium Payment Source</p>
                    <p className='info'>{data.premiumPaymentSource}</p>
            </li>
            <li className='form-list'>
                    <p>Date</p>
                    <p className='info'>{data.date}</p>
            </li>
        </ul>
        
            </div>
            <div className='documents'>
              <h1>Documents</h1>
              <div className='documents-content'>
              <a href={data.signature} target='__blank'> <button className='form-button'>Download Signature <HiDownload style={style} />  </button></a>
              <a href={data.identification} target='__blank'> <button className='form-button'>Download Identification <HiDownload style={style} />  </button></a>
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