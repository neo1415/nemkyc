export const userColumns = [ 
  {
    field: "createdAt",
    headerName: "Date",
    width: 150,  
    dataType: 'date',  
    format: 'dd/MM/yyyy'   
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
    field: "companyName",
    headerName: "Company Name",
    width: 200,
  },

  {
    field: "companyAddress",
    headerName: "Company Address",
    width: 180,
  },

  {
    field: "city",
    headerName: "City",
    width: 200,
  },

  {
    field: "state",
    headerName: "State",
    width: 200,
  },

  {
    field: "country",
    headerName: "Country",
    width: 200,
  },

  {
    field: "incorporationNumber",
    headerName: "Incorporation Number",
    width: 180,
  },

  {
    field: "registrationNumber",
    headerName: "Registration Number",
    width: 180,
  },

  {
    field: "incorporationState",
    headerName: "Incorporation State",
    width: 125,     
  },

  {
    field: "companyLegalForm",
    headerName: "Company Type",
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
    field: "natureOfBusiness",
    headerName: "Nature of Business",
    width: 200,
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
    field: "title",
    headerName: "Title",
    width: 125,     
  },

  {
    field: "gender",
    headerName: "Gender",
    width: 125,     
  },

  {
    field: "firstName",
    headerName: "First Name",
    width: 125,     
  },

  {
    field: "middleName",
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
    field: "residenceCountry",
    headerName: "Residence Country",
    width: 125,     
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
    field: "address",
    headerName: "Address",
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
    headerName: "International Passport No.",
    width: 125,     
  },

  {
    field: "passIssuedCountry",
    headerName: "Passport Issued Country",
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
    field: "issuedBy",
    headerName: "Issuing Country",
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
    field: "title2",
    headerName: "Title",
    width: 125,     
  },

  {
    field: "gender2",
    headerName: "Gender",
    width: 125,     
  },

  {
    field: "firstName2",
    headerName: "First Name",
    width: 125,     
  },

  {
    field: "middleName2",
    headerName: "Middle Name",
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
    field: "residenceCountry2",
    headerName: "Residence Country",
    width: 125,     
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
    field: "address2",
    headerName: "Address",
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
    headerName: "International Passport No.",
    width: 125,     
  },

  {
    field: "passIssuedCountry2",
    headerName: "Passport Issued Country",
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
    field: "issuedBy2",
    headerName: "Issuing Country",
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
    field: "localBankName",
    headerName: "Local Bank Name",
    width: 125,     
  },

  {
    field: "bankBranch",
    headerName: "Bank Branch",
    width: 125,     
  },

  {
    field: "currentAccountNumber",
    headerName: "Current Account Number",
    width: 125,     
  },

  {
    field: "bankBranchName",
    headerName: "Bank Branch",
    width: 125,     
  },

  {
    field: "accountOpeningDate",
    headerName: "Account Opening Date",
    width: 125,     
  },

  {
    field: "domAccountNumber",
    headerName: "Domicilliary Account Number",
    width: 125,     
  },

  {
    field: "foreignBankName",
    headerName: "Foreign Bank Name",
    width: 125,     
  },

  {
    field: "bankBranchName2",
    headerName: "Foreign Bank Branch Name",
    width: 125,     
  },

  {
    field: "currency",
    headerName: "Currency",
    width: 125,     
  },

  {
    field: "accountOpeningDate2",
    headerName: "Foreign Account Opening Date",
    width: 125,     
  },

];