import moment from 'moment'
import { HiDownload } from 'react-icons/hi';


export const UserColumns = [ 
  {
    field: "createdAt",
    headerName: "Date",
    width: 200,  
    dataType: 'date',  
    format: 'dd/MM/yyyy hh:mm'   
  },

  {
    field: "insured",
    headerName: "Full Name",
    width: 180,
  },

  {
    field: "contactAddress",
    headerName: "Contact Address",
    width: 180,
  },

  {
    field: "gender",
    headerName: "Gender",
    width: 80,
  },

  {
    field: "dateOfBirth",
    headerName: "Date Of Birth",
    width: 230,
  },

  {
    field: "placeOfBirth",
    headerName: "Place Of Birth",
    width: 230,
  },

  {
    field: "occupation",
    headerName: "occupation",
    width: 100,
  },

  {
    field: "premiumPaymentSource",
    headerName: "premiumPaymentSource",
    width: 85,     
  },

  {
    field: "GSMno",
    headerName: "GSM Number",
    width: 85,     
  },

  {
    field: "residentialAddress",
    headerName: "Residential Address",
    width: 85,     
  },

  {
    field: "emailAddress",
    headerName: "Email Address",
    width: 85,     
  },

  // {
  //   field: "contactTelephoneNumber",
  //   headerName: "contact Telephone Number",
  //   width: 230,
  // },

  
  {
    field: "identificationNumber",
    headerName: "Identification Number",
    width: 230,
  },

  
  {
    field: "BVNNumber",
    headerName: "BVN Number",
    width: 230,
  },

  {
    field: "identificationType",
    headerName: "Identification Type",
    width: 85,     
  },

  {
    field: "issuingCountry",
    headerName: "Issuing Country",
    width: 85,     
  },

  {
    field: "issuedDate",
    headerName: "Issued Date",
    width: 85,     
  },

  {
    field: "expiryDate",
    headerName: "Expiry Date",
    width: 85,     
  },

  {
    field: "intPassNo",
    headerName: "International Passport Number",
    width: 85,     
  },

  {
    field: "passCountry",
    headerName: "Pass Country",
    width: 85,     
  },


  {
    field: "employersName",
    headerName: "Employers Name",
    width: 85,     
  },

  {
    field: "employersAddress",
    headerName: "Employers Address",
    width: 85,     
  },

  {
    field: "employersTelephoneNumber",
    headerName: "Employers Telephone Number",
    width: 85,     
  },

  {
    field: "employersEmail",
    headerName: "Employers Email",
    width: 85,     
  },

  {
    field: "businessType",
    headerName: "Business Type",
    width: 85,     
  },

  // {
  //   field: "city",
  //   headerName: "City",
  //   width: 85,     
  // },

  // {
  //   field: "state",
  //   headerName: "State",
  //   width: 85,     
  // },

  // {
  //   field: "country",
  //   headerName: "Country",
  //   width: 85,     
  // },

  // {
  //   field: "nationality",
  //   headerName: "Nationality",
  //   width: 85,     
  // },

  // {
  //   field: "officeAddress",
  //   headerName: "Office Address",
  //   width: 85,     
  // },

  {
    field: "annualIncomeRange",
    headerName: "Annual Income Range",
    width: 85,     
  },

  {
    field: "date",
    headerName: "Date",
    width: 85,     
  },

  // {
  //   field: "signature",
  //   headerName: "signature",
  //   width: 85,
  //   type: 'link',
  //   link: 'a',
  //   renderCell: (cellValues) => {
  //     return <a href={`${cellValues.row.signature}` } download target='blank'><HiDownload /></a>;
  //   }     
  // },
];