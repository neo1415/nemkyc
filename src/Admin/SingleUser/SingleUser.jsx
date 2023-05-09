import React,{useEffect, useState} from 'react'
import './single.scss'
import { collection, getDocs, deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { list } from 'firebase/storage';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { HiDownload } from 'react-icons/hi';
import jsPDF from "jspdf";
import "jspdf-autotable";
// import Status from '../Table/Status';
// import Status from './../Table/Status';

const SingleUser = () => {

    const [data, setData] = useState([]);

    const {id} = useParams();

    const style={
        size:30,
        marginLeft:10,
        color:'white'
    }

    useEffect(
        ()=>{
            const docRef = doc(db, 'users', id);
            onSnapshot(docRef, (snapshot) =>{
                setData({...snapshot.data(), id:snapshot.id});
            })
         
        }
        
    )

    const downloadPDF = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
        const tableColumn = ['Field', 'Value'];
        const tableRows = [      ['Company Name', data.companyName],
          ['Registered Company Address', data.registeredCompanyAddress],
          ['Contact Telephone Number', data.contactTelephoneNumber],
          ['Email Address', data.emailAddress],
          ['Website', data.website],
          ['Contact Person', data.contactPerson],
          ['Tax Identification Number', data.taxIdentificationNumber],
          ['VAT Registration Number', data.VATRegistrationNumber],
          ['Date of Incorporation Registration', data.dateofIncorporationRegistration],
          ['Incorporation State', data.incorporationState],
          ['Company Type', data.companyType],
        ];
        doc.autoTable(tableColumn, tableRows, {
          startY: 60,
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
          headerStyles: {
            fillColor: [0, 102, 153],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          margin: { top: 50, left: 40, right: 40, bottom: 40 },
        });
        doc.save('user.pdf');
      };

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
                    <p className='info'>{data.dateofIncorporationRegistration}</p>
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
            <ul className='form-ul'>
            <h1>Directors Profile 2</h1>
            <li className='form-list'>
                    <p>Date Of Birth</p>
                    <p className='info'>{data?.dob2}</p>
            </li>
            <li className='form-list'>
                    <p>First Name</p>
                    <p className='info'>{data?.firstName2}</p>
            </li>
            <li className='form-list'>
                    <p>Last Name</p>
                    <p className='info'>{data?.lastName2}</p>
            </li>
            <li className='form-list'>
                    <p>Residential Address</p>
                    <p className='info'>{data?.residentialAddress2}</p>
            </li>
            <li className='form-list'>
                    <p>Issuing Body</p>
                    <p className='info'>{data?.issuingBody2}</p>
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
            </div>
        </div>
    </div>
    <div className='file-download'>
    <button onClick={downloadPDF}>Download Form <HiDownload style={style} /> </button>
    </div>
    </div>
    
  )
}

export default SingleUser