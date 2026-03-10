// CORRECTED COLUMNS FOR AdminCorporateNFIUTable.tsx
// This matches the ACTUAL Corporate NFIU form structure
// Order: Actions → Created At → Company Info → Directors → Account Details → Verification → Signature

const columns: GridColDef[] = [
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    type: 'actions',
    getActions: (params) => [
      <GridActionsCellItem
        key="view"
        icon={<Visibility />}
        label="View"
        onClick={async () => {
          await auditService.logAdminAction({
            adminUserId: user?.uid || 'unknown',
            adminRole: user?.role,
            adminEmail: user?.email,
            formType: 'nfiu',
            formVariant: 'corporate',
            submissionId: params.row.id as string,
            action: 'view'
          });
          const sourceCollection = params.row._sourceCollection || 'corporate-nfiu-form';
          navigate(`/admin/form/${sourceCollection}/${params.row.id}`);
        }}
      />,
      <GridActionsCellItem
        key="delete"
        icon={<Delete />}
        label="Delete"
        onClick={() => setDeleteDialog({ open: true, id: params.row.id as string })}
      />,
    ],
  },
  {
    field: 'submittedAt',
    headerName: 'Created At',
    width: 130,
    renderCell: (params: any) => formatDate(params.row.submittedAt),
  },
  
  // ===== COMPANY INFORMATION =====
  {
    field: 'insured',
    headerName: 'Company Name',
    width: 180,
    renderCell: (params: any) => getValue(params.row, 'insured'),
  },
  {
    field: 'officeAddress',
    headerName: 'Office Address',
    width: 200,
    renderCell: (params: any) => getValue(params.row, 'officeAddress'),
  },
  {
    field: 'ownershipOfCompany',
    headerName: 'Ownership of Company',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'ownershipOfCompany'),
  },
  {
    field: 'website',
    headerName: 'Website',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'website'),
  },
  {
    field: 'incorporationNumber',
    headerName: 'Incorporation Number',
    width: 160,
    renderCell: (params: any) => getValue(params.row, 'incorporationNumber'),
  },
  {
    field: 'incorporationState',
    headerName: 'Incorporation State',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'incorporationState'),
  },
  {
    field: 'dateOfIncorporationRegistration',
    headerName: 'Date of Incorporation',
    width: 150,
    renderCell: (params: any) => formatDate(params.row.dateOfIncorporationRegistration),
  },
  {
    field: 'contactPersonNo',
    headerName: 'Contact Person Mobile',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'contactPersonNo'),
  },
  {
    field: 'businessTypeOccupation',
    headerName: 'Business Type',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'businessTypeOccupation'),
  },
  {
    field: 'taxIDNo',
    headerName: 'Tax ID Number',
    width: 130,
    renderCell: (params: any) => getValue(params.row, 'taxIDNo'),
  },
  {
    field: 'emailAddress',
    headerName: 'Email Address',
    width: 200,
    renderCell: (params: any) => getValue(params.row, 'emailAddress'),
  },
  {
    field: 'premiumPaymentSource',
    headerName: 'Premium Payment Source',
    width: 180,
    renderCell: (params: any) => {
      const form = params.row;
      if (form.premiumPaymentSource === 'Other' && form.premiumPaymentSourceOther) {
        return getValue(form, 'premiumPaymentSourceOther');
      }
      return getValue(form, 'premiumPaymentSource');
    },
  },
  
  // ===== DIRECTORS INFORMATION - DIRECTOR 1 =====
  {
    field: 'director1FirstName',
    headerName: 'Director 1 First Name',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'firstName'),
  },
  {
    field: 'director1MiddleName',
    headerName: 'Director 1 Middle Name',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'middleName'),
  },
  {
    field: 'director1LastName',
    headerName: 'Director 1 Last Name',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'lastName'),
  },
  {
    field: 'director1DOB',
    headerName: 'Director 1 Date of Birth',
    width: 150,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
        return formatDate(params.row.directors[0].dob);
      }
      return formatDate(params.row.dob);
    },
  },
  {
    field: 'director1PlaceOfBirth',
    headerName: 'Director 1 Place of Birth',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'placeOfBirth'),
  },
  {
    field: 'director1Nationality',
    headerName: 'Director 1 Nationality',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'nationality'),
  },
  {
    field: 'director1Country',
    headerName: 'Director 1 Country',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'country'),
  },
  {
    field: 'director1Occupation',
    headerName: 'Director 1 Occupation',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'occupation'),
  },
  {
    field: 'director1Email',
    headerName: 'Director 1 Email',
    width: 200,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'email'),
  },
  {
    field: 'director1PhoneNumber',
    headerName: 'Director 1 Phone Number',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'phoneNumber'),
  },
  {
    field: 'director1BVN',
    headerName: 'Director 1 BVN',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'BVNNumber'),
  },
  {
    field: 'director1NIN',
    headerName: 'Director 1 NIN',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'NINNumber'),
  },
  {
    field: 'director1ResidentialAddress',
    headerName: 'Director 1 Residential Address',
    width: 200,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'residentialAddress'),
  },
  {
    field: 'director1TaxID',
    headerName: 'Director 1 Tax ID',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'taxIDNumber'),
  },
  {
    field: 'director1IDType',
    headerName: 'Director 1 ID Type',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'idType'),
  },
  {
    field: 'director1IDNumber',
    headerName: 'Director 1 ID Number',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'idNumber'),
  },
  {
    field: 'director1IssuingBody',
    headerName: 'Director 1 Issuing Body',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 0, 'issuingBody'),
  },
  {
    field: 'director1IssuedDate',
    headerName: 'Director 1 Issued Date',
    width: 150,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
        return formatDate(params.row.directors[0].issuedDate);
      }
      return formatDate(params.row.issuedDate);
    },
  },
  {
    field: 'director1ExpiryDate',
    headerName: 'Director 1 Expiry Date',
    width: 150,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
        return formatDate(params.row.directors[0].expiryDate);
      }
      return formatDate(params.row.expiryDate);
    },
  },
  {
    field: 'director1SourceOfIncome',
    headerName: 'Director 1 Source of Income',
    width: 180,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
        const director = params.row.directors[0];
        if (director.sourceOfIncome === 'Other' && director.sourceOfIncomeOther) {
          return director.sourceOfIncomeOther;
        }
        return director.sourceOfIncome || 'N/A';
      }
      if (params.row.sourceOfIncome === 'Other' && params.row.sourceOfIncomeOther) {
        return params.row.sourceOfIncomeOther;
      }
      return getValue(params.row, 'sourceOfIncome');
    },
  },
  
  // ===== DIRECTORS INFORMATION - DIRECTOR 2 =====
  {
    field: 'director2FirstName',
    headerName: 'Director 2 First Name',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'firstName'),
  },
  {
    field: 'director2MiddleName',
    headerName: 'Director 2 Middle Name',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'middleName'),
  },
  {
    field: 'director2LastName',
    headerName: 'Director 2 Last Name',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'lastName'),
  },
  {
    field: 'director2DOB',
    headerName: 'Director 2 Date of Birth',
    width: 150,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
        return formatDate(params.row.directors[1].dob);
      }
      return formatDate(params.row.dob2);
    },
  },
  {
    field: 'director2PlaceOfBirth',
    headerName: 'Director 2 Place of Birth',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'placeOfBirth'),
  },
  {
    field: 'director2Nationality',
    headerName: 'Director 2 Nationality',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'nationality'),
  },
  {
    field: 'director2Country',
    headerName: 'Director 2 Country',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'country'),
  },
  {
    field: 'director2Occupation',
    headerName: 'Director 2 Occupation',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'occupation'),
  },
  {
    field: 'director2Email',
    headerName: 'Director 2 Email',
    width: 200,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'email'),
  },
  {
    field: 'director2PhoneNumber',
    headerName: 'Director 2 Phone Number',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'phoneNumber'),
  },
  {
    field: 'director2BVN',
    headerName: 'Director 2 BVN',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'BVNNumber'),
  },
  {
    field: 'director2NIN',
    headerName: 'Director 2 NIN',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'NINNumber'),
  },
  {
    field: 'director2ResidentialAddress',
    headerName: 'Director 2 Residential Address',
    width: 200,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'residentialAddress'),
  },
  {
    field: 'director2TaxID',
    headerName: 'Director 2 Tax ID',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'taxIDNumber'),
  },
  {
    field: 'director2IDType',
    headerName: 'Director 2 ID Type',
    width: 130,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'idType'),
  },
  {
    field: 'director2IDNumber',
    headerName: 'Director 2 ID Number',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'idNumber'),
  },
  {
    field: 'director2IssuingBody',
    headerName: 'Director 2 Issuing Body',
    width: 150,
    renderCell: (params: any) => getDirectorValue(params.row, 1, 'issuingBody'),
  },
  {
    field: 'director2IssuedDate',
    headerName: 'Director 2 Issued Date',
    width: 150,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
        return formatDate(params.row.directors[1].issuedDate);
      }
      return formatDate(params.row.issuedDate2);
    },
  },
  {
    field: 'director2ExpiryDate',
    headerName: 'Director 2 Expiry Date',
    width: 150,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
        return formatDate(params.row.directors[1].expiryDate);
      }
      return formatDate(params.row.expiryDate2);
    },
  },
  {
    field: 'director2SourceOfIncome',
    headerName: 'Director 2 Source of Income',
    width: 180,
    renderCell: (params: any) => {
      if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
        const director = params.row.directors[1];
        if (director.sourceOfIncome === 'Other' && director.sourceOfIncomeOther) {
          return director.sourceOfIncomeOther;
        }
        return director.sourceOfIncome || 'N/A';
      }
      if (params.row.sourceOfIncome2 === 'Other' && params.row.sourceOfIncomeOther2) {
        return params.row.sourceOfIncomeOther2;
      }
      return getValue(params.row, 'sourceOfIncome2');
    },
  },
  
  // ===== ACCOUNT DETAILS - LOCAL/NAIRA =====
  {
    field: 'localBankName',
    headerName: 'Local Bank Name',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'localBankName'),
  },
  {
    field: 'localAccountNumber',
    headerName: 'Local Account Number',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'localAccountNumber'),
  },
  {
    field: 'localBankBranch',
    headerName: 'Local Bank Branch',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'localBankBranch'),
  },
  {
    field: 'localAccountOpeningDate',
    headerName: 'Local Account Opening Date',
    width: 180,
    renderCell: (params: any) => formatDate(params.row.localAccountOpeningDate),
  },
  
  // ===== ACCOUNT DETAILS - FOREIGN/DOMICILIARY =====
  {
    field: 'foreignBankName',
    headerName: 'Foreign Bank Name',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'foreignBankName'),
  },
  {
    field: 'foreignAccountNumber',
    headerName: 'Foreign Account Number',
    width: 180,
    renderCell: (params: any) => getValue(params.row, 'foreignAccountNumber'),
  },
  {
    field: 'foreignBankBranch',
    headerName: 'Foreign Bank Branch',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'foreignBankBranch'),
  },
  {
    field: 'foreignAccountOpeningDate',
    headerName: 'Foreign Account Opening Date',
    width: 200,
    renderCell: (params: any) => formatDate(params.row.foreignAccountOpeningDate),
  },
  
  // ===== VERIFICATION & DECLARATION =====
  {
    field: 'verificationDocUrl',
    headerName: 'Verification Document',
    width: 200,
    renderCell: (params: any) => getValue(params.row, 'verificationDocUrl'),
  },
  {
    field: 'signature',
    headerName: 'Signature',
    width: 150,
    renderCell: (params: any) => getValue(params.row, 'signature'),
  }
];
