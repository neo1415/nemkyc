export const UserColumns = [ 
  {
    field: "createdAt",
    headerName: "Date",
    width: 200,  
    dataType: 'date',  
    format: 'dd/MM/yyyy hh:mm'   
  },

  {
    field: "status",
    headerName: "Status",
    width: 150,
    renderCell: (params) => {
      const status = params.row.status;
      let color;
      if (status === 'processing') {
        color = 'lightyellow';
      } else if (status === 'completed') {
        color = 'lightgreen';
      }
      return (
        <div style={{ backgroundColor: color, padding: '5px', borderRadius: '5px' }}>
          {status}
        </div>
      );
    }
  },
  
  {
    field: "branchOffice",
    headerName: "Branch Office",
    width: 180,
  },

  {
    field: "insured",
    headerName: "Insured",
    width: 180,
  },

  {
    field: "officeAddress",
    headerName: "Office Address",
    width: 180,
  },

  {
    field: "ownershipOfCompany",
    headerName: "Ownership Of Company",
    width: 180,
  },

  {
    field: "contactPerson",
    headerName: "Contact Person",
    width: 80,
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
    field: "dateOfIncorporationRegistration",
    headerName: "Date Of Incorporation Registration",
    width: 125,     
  },
 {
    field: "website",
    headerName: "Website",
    width: 80,
  },
  {

    field: "BVNNumber",
    headerName: "BVN Number",
    width: 125,     
  },

  {
    field: "contactPersonNo",
    headerName: "Contact Person Number",
    width: 230,
  },

  {
    field: "emailAddress",
    headerName: "Email Address",
    width: 230,
  },

  {
    field: "natureOfBusiness",
    headerName: "Nature of Business",
    width: 100,
  },
  {
    field: "taxIDNo",
    headerName: "tax ID Number",
    width: 125,     
  },

  {
    field: "estimatedTurnover",
    headerName: "Estimated Turnover",
    width: 85,     
  },

  {
    field: "premiumPaymentSource",
    headerName: "Premium Payment Source",
    width: 85,     
  },

  {
    field: "firstName",
    headerName: "First Name",
    width: 125,     
  },

  {
    field: "middleName2",
    headerName: "Middle Name",
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
    field: "email",
    headerName: "Email",
    width: 125,     
  },

  {
    field: "phoneNumber",
    headerName: "Phone Number",
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
    field: " employersPhoneNumber",
    headerName: "Employers Phone Number",
    width: 125,     
  },

  {
    field: "residentialAddress",
    headerName: "Residential Address",
    width: 125,     
  },

  {
    field: "taxIDNumber",
    headerName: "tax ID Number",
    width: 125,     
  },

  // {
  //   field: "intPassNo",
  //   headerName: "International Passport Number",
  //   width: 125,     
  // },

  // {
  //   field: "passCountry",
  //   headerName: "Passport Country",
  //   width: 125,     
  // },

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