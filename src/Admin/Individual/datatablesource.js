import moment from 'moment'


export const userColumns = [ 
  {
    field: "createdAt",
    headerName: "Date",
    width: 200,  
    dataType: 'date',  
    format: 'dd/MM/yyyy hh:mm'   
  },

  {
    field: "companyName",
    headerName: "Company Name",
    width: 180,
  },
  {
    field: "registeredCompanyAddress",
    headerName: "Registered Company Address",
    width: 180,
  },
  {
    field: "contactTelephoneNumber",
    headerName: "contact Telephone Number",
    width: 230,
  },
  {
    field: "emailAddress",
    headerName: "Email Address",
    width: 100,
  },
  {
    field: "website",
    headerName: "website",
    width: 80,
  },
  {
    field: " contactPerson",
    headerName: " contact Person",
    width: 230,
  },
  {
    field: " taxIdentificationNumber",
    headerName: "E tax Identification Number",
    width: 230,
  },

  {
    field: "VATRegistrationNumber",
    headerName: "VAT Registration Number",
    width: 85,     
  },
];