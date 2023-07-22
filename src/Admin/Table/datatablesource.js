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

  // {
  //   field: "commercialName",
  //   headerName: "Commercial Name",
  //   width: 200,
  // },

  // {
  //   field: "city",
  //   headerName: "City",
  //   width: 200,
  // },

  // {
  //   field: "state",
  //   headerName: "State",
  //   width: 200,
  // },

  // {
  //   field: "companyCountry",
  //   headerName: "Country",
  //   width: 200,
  // },

  {
    field: "registeredCompanyAddress",
    headerName: "Registered Company Address",
    width: 180,
  },

  {
    field: "incorporationNumber",
    headerName: "Incorporation Number",
    width: 180,
  },

  {
    field: "incorporationState",
    headerName: "Incorporation State",
    width: 125,     
  },

  {
    field: "companyLegalForm",
    headerName: "Company Legal Form",
    width: 180,
  },

  {
    field: "dateOfIncorporationRegistration",
    headerName: "Date Of Incorporation Registration",
    width: 125,     
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
    field: "companyType",
    headerName: "Company Type",
    width: 125,     
  },

  {
    field: "taxIdentificationNumber",
    headerName: "Tax Identification Number",
    width: 160,
  },

  {
    field: "telephoneNumber",
    headerName: "Telephone Number",
    width: 120,
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
    field: "dob",
    headerName: "Date Of Birth",
    width: 125,     
  },

  {
    field: "placeOfBirth",
    headerName: "Place of Birth",
    width: 125,     
  },

  {
    field: "nationality",
    headerName: "Nationality",
    width: 180,
  },
  {
    field: "country",
    headerName: "Country",
    width: 180,
  },

  {
    field: "occupation",
    headerName: "Occupation",
    width: 125,     
  },

  {
    field: "BVNNumber",
    headerName: "BVN Number",
    width: 125,     
  },

  {
    field: "employersName",
    headerName: "Employers Name",
    width: 125,     
  },

  {
    field: "phoneNumber",
    headerName: "Phone Number",
    width: 125,     
  },

  {
    field: "residentialAddress",
    headerName: "Residential Address",
    width: 125,     
  },

    {
    field: "email",
    headerName: "Email",
    width: 125,     
  },

  {
    field: "taxIDNumber",
    headerName: "tax ID Number",
    width: 125,     
  },

  {
    field: "intPassNo",
    headerName: "International Passport Number",
    width: 125,     
  },

  {
    field: "passCountry",
    headerName: "Passport Country",
    width: 125,     
  },

  {
    field: "idType",
    headerName: "ID Type",
    width: 125,     
  },

  {
    field: "idNumber",
    headerName: "ID Number",
    width: 125,     
  },

  {
    field: "issuingBody",
    headerName: "Issuing Body",
    width: 125,     
  },

  {
    field: "issuedDate",
    headerName: "Issued Date",
    width: 125,     
  },

  {
    field: "expiryDate",
    headerName: "Expiry Date",
    width: 125,     
  },

  {
    field: "sourceOfIncome",
    headerName: "Source Of Income",
    width: 125,     
  },

  {
    field: "firstName2",
    headerName: "First Name",
    width: 125,     
  },

  {
    field: "lastName2",
    headerName: "Last Name",
    width: 125,     
  },

  {
    field: "dob2",
    headerName: "Date Of Birth",
    width: 125,     
  },

  {
    field: "placeOfBirth2",
    headerName: "Place of Birth",
    width: 125,     
  },

  {
    field: "nationality2",
    headerName: "Nationality",
    width: 180,
  },
  {
    field: "country2",
    headerName: "Country",
    width: 180,
  },

  {
    field: "occupation2",
    headerName: "Occupation",
    width: 125,     
  },

  {
    field: "BVNNumber2",
    headerName: "BVN Number",
    width: 125,     
  },

  {
    field: "employersName2",
    headerName: "Employers Name",
    width: 125,     
  },

  {
    field: "phoneNumber2",
    headerName: "Phone Number",
    width: 125,     
  },

  {
    field: "residentialAddress2",
    headerName: "Residential Address",
    width: 125,     
  },

    {
    field: "email2",
    headerName: "Email",
    width: 125,     
  },

  {
    field: "taxIDNumber2",
    headerName: "tax ID Number",
    width: 125,     
  },

  {
    field: "intPassNo2",
    headerName: "International Passport Number",
    width: 125,     
  },

  {
    field: "passCountry2",
    headerName: "Passport Country",
    width: 125,     
  },

  {
    field: "idType2",
    headerName: "ID Type",
    width: 125,     
  },

  {
    field: "idNumber2",
    headerName: "ID Number",
    width: 125,     
  },

  {
    field: "issuingBody2",
    headerName: "Issuing Body",
    width: 125,     
  },

  {
    field: "issuedDate2",
    headerName: "Issued Date",
    width: 125,     
  },

  {
    field: "expiryDate2",
    headerName: "Expiry Date",
    width: 125,     
  },

  {
    field: "sourceOfIncome2",
    headerName: "Source Of Income",
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
    field: "accountNumber2",
    headerName: "Dollar Account Number",
    width: 125,     
  },

  {
    field: "bankName2",
    headerName: "Dollar Bank Name",
    width: 125,     
  },

  {
    field: "bankBranch2",
    headerName: "Dollar Bank Branch",
    width: 125,     
  },

];