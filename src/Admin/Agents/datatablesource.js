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
    field: "firstName",
    headerName: "First Name",
    width: 180,
  },

  {
    field: "middleName",
    headerName: "Middle Name",
    width: 125,     
  },

  {
    field: "lastName",
    headerName: "Last Name",
    width: 180,
  },

  {
    field: "residentialAddress",
    headerName: "Residential Address",
    width: 85,     
  },

  {
    field: "gender",
    headerName: "Gender",
    width: 80,
  },

  {
    field: "position",
    headerName: "Position",
    width: 125,     
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
    field: "sourceOfIncome",
    headerName: "Source Of Income",
    width: 125,     
  },

  {
    field: "nationality",
    headerName: "Nationality",
    width: 180,
  },

  {
    field: "GSMno",
    headerName: "GSM Number",
    width: 85,     
  },

  {
    field: "BVNNumber",
    headerName: "BVN Number",
    width: 125,     
  },
  
  {
    field: "taxIDNumber",
    headerName: "tax Number",
    width: 125,     
  },


  {
    field: "occupation",
    headerName: "occupation",
    width: 100,
  },

  {
    field: "emailAddress",
    headerName: "Email Address",
    width: 85,     
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
    field: "agentsName",
    headerName: "Agents Name",
    width: 85,     
  },

  {
    field: "agentsAddress",
    headerName: "Agents Address",
    width: 85,     
  },

  {
    field: "naicomNo",
    headerName: "NAICOM Lisence Number",
    width: 85,     
  },

  {
    field: "lisenceIssuedDate",
    headerName: "Lisence Issued Date",
    width: 85,     
  },

  {
    field: "lisenceExpiryDate",
    headerName: "Lisence Expiry Date",
    width: 85,     
  },

  {
    field: "agentsEmail",
    headerName: "Email Address",
    width: 85,     
  },

  {
    field: "website",
    headerName: "Website",
    width: 80,
  },


  {
    field: "taxIDNo",
    headerName: "Tax ID Number (TIN)",
    width: 85,     
  },

  {
    field: "arian",
    headerName: "ARIAN Membership Number",
    width: 85,     
  },

  {
    field: "listOfAgrnts",
    headerName: "list of Agents Approves Principals (Insurers)",
    width: 85,     
  },

];