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
    field: "officeLocation",
    headerName: "Office Location",
    width: 180,
  },

  {
    field: "insured",
    headerName: "Insured",
    width: 180,
  },

  {
    field: "contactAddress",
    headerName: "Contact Address",
    width: 180,
  },

  {
    field: "occupation",
    headerName: "Occupation",
    width: 180,
  },

  {
    field: "gender",
    headerName: "Gender",
    width: 80,
  },

  {
    field: "dateOfBirth",
    headerName: "Date of Birth",
    width: 230,
  },

  {
    field: "mothersMaidenName",
    headerName: "Mothers Maiden Name",
    width: 100,
  },

  {
    field: "employersName",
    headerName: "Employers Name",
    width: 100,
  },

  {
    field: "employersTelephoneNumber",
    headerName: "Employers Telephone Number",
    width: 100,
  },

  {
    field: "employersAddress",
    headerName: "Employers Address",
    width: 100,
  },

  {
    field: "city",
    headerName: "City",
    width: 100,
  },

  {
    field: "state",
    headerName: "State",
    width: 100,
  },

  {
    field: "country",
    headerName: "Country",
    width: 100,
  },

  {
    field: "nationality",
    headerName: "Nationality",
    width: 100,
  },

  {
    field: "residentialAddress",
    headerName: "Residential Address",
    width: 100,
  },

  {
    field: "GSMno",
    headerName: "GSM Number",
    width: 100,
  },

  {
    field: "emailAddress",
    headerName: "Email Address",
    width: 230,
  },

  {
    field: "identificationType",
    headerName: "Identification Type",
    width: 100,
  },

  {
    field: "idNumber",
    headerName: "Identification Type",
    width: 100,
  },

  {
    field: "issuedDate",
    headerName: "Issued Date",
    width: 100,
  },


  {
    field: "expiryDate",
    headerName: "Expiry Date",
    width: 85,     
  },

  {
    field: "sourceOfIncome",
    headerName: "Source Of Income",
    width: 85,     
  },

  {
    field: "annualIncomeRange",
    headerName: "Annual Income Ramge",
    width: 85,     
  },


  {
    field: "premiumPaymentSource",
    headerName: "Premium Payment Source",
    width: 85,     
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