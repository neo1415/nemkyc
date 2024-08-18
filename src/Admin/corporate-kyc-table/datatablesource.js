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