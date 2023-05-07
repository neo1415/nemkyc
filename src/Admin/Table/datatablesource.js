import moment from 'moment'


export const userColumns = [ 
  {
    field: "createdAt",
    headerName: "Date",
    width: 150,  
    dataType: 'date',  
    format: 'dd/MM/yyyy hh:mm'   
  },

  {
    field: "companyName",
    headerName: "Company Name",
    width: 200,
  },
  {
    field: "registeredCompanyAddress",
    headerName: "Registered Company Address",
    width: 180,
  },
  {
    field: "contactTelephoneNumber",
    headerName: "contact Telephone Number",
    width: 120,
  },
  {
    field: "emailAddress",
    headerName: "Email Address",
    width: 180,
  },
  {
    field: "website",
    headerName: "Website",
    width: 80,
  },
  {
    field: "contactPerson",
    headerName: "Contact Person",
    width: 180,
  },
  {
    field: "taxIdentificationNumber",
    headerName: "Tax Identification Number",
    width: 160,
  },

  {
    field: "VATRegistrationNumber",
    headerName: "VAT Registration Number",
    width: 125,     
  },

  {
    field: "dateOfIncorporationRegistration",
    headerName: "Date Of Incorporation Registration",
    width: 125,     
  },

  {
    field: "incorporationState",
    headerName: "Incorporation State",
    width: 125,     
  },

  // {
  //   field: "VATRegistrationNumber",
  //   headerName: "VAT Registration Number",
  //   width: 125,     
  // },

  {
    field: "companyType",
    headerName: "Company Type",
    width: 125,     
  },

  {
    field: "firstName",
    headerName: "First Name",
    width: 125,     
  },

  {
    field: "lastName",
    headerName: "Last Name",
    width: 125,     
  },

  {
    field: "residentialAddress",
    headerName: "Residential Address",
    width: 125,     
  },

  {
    field: "issuingBody",
    headerName: "Issuing Body",
    width: 125,     
  },

  {
    field: "accountNumber",
    headerName: "Account Number",
    width: 125,     
  },

  {
    field: "bankName",
    headerName: "Bank Name",
    width: 125,     
  },

  {
    field: "bankBranch",
    headerName: "Bank Branch",
    width: 125,     
  },

  {
    field: "accountOpeningDate",
    headerName: "Account Opening Date",
    width: 125,     
  },
  {
    field: "$accountNumber",
    headerName: "Dollar Account Number",
    width: 125,     
  },

  {
    field: "$bankName",
    headerName: "Dollar Bank Name",
    width: 125,     
  },

  {
    field: "$bankBranch",
    headerName: "Dollar Bank Branch",
    width: 125,     
  },

  {
    field: "$DollaraccountOpeningDate",
    headerName: "Account Opening Date",
    width: 125,     
  },
];