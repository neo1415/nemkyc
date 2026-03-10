// CORRECTED CSV EXPORT FOR AdminCorporateNFIUTable.tsx
// This matches the ACTUAL Corporate NFIU form structure
// Order: ID, Created At, Company Info, Directors, Account Details, Verification, Signature

const exportToCSV = () => {
  // CSV headers - matching actual form fields only
  const headers = [
    'ID', 'Created At',
    // Company Information
    'Company Name', 'Office Address', 'Ownership of Company', 'Website',
    'Incorporation Number', 'Incorporation State', 'Date of Incorporation',
    'Contact Person Mobile', 'Business Type', 'Tax ID Number', 'Email Address',
    'Premium Payment Source',
    // Director 1
    'Director 1 First Name', 'Director 1 Middle Name', 'Director 1 Last Name', 'Director 1 DOB',
    'Director 1 Place of Birth', 'Director 1 Nationality', 'Director 1 Country', 'Director 1 Occupation',
    'Director 1 Email', 'Director 1 Phone', 'Director 1 BVN', 'Director 1 NIN',
    'Director 1 Residential Address', 'Director 1 Tax ID', 'Director 1 ID Type', 'Director 1 ID Number',
    'Director 1 Issuing Body', 'Director 1 Issued Date', 'Director 1 Expiry Date', 'Director 1 Source of Income',
    // Director 2
    'Director 2 First Name', 'Director 2 Middle Name', 'Director 2 Last Name', 'Director 2 DOB',
    'Director 2 Place of Birth', 'Director 2 Nationality', 'Director 2 Country', 'Director 2 Occupation',
    'Director 2 Email', 'Director 2 Phone', 'Director 2 BVN', 'Director 2 NIN',
    'Director 2 Residential Address', 'Director 2 Tax ID', 'Director 2 ID Type', 'Director 2 ID Number',
    'Director 2 Issuing Body', 'Director 2 Issued Date', 'Director 2 Expiry Date', 'Director 2 Source of Income',
    // Account Details
    'Local Bank Name', 'Local Account Number', 'Local Bank Branch', 'Local Account Opening Date',
    'Foreign Bank Name', 'Foreign Account Number', 'Foreign Bank Branch', 'Foreign Account Opening Date',
    // Verification & Declaration
    'Verification Document', 'Signature'
  ];

  // CSV rows - all data matching actual form fields
  const rows = nfiuForms.map(form => {
    const getDir1 = (field: string) => getDirectorValue(form, 0, field);
    const getDir2 = (field: string) => getDirectorValue(form, 1, field);
    const getDir1Date = (field: string) => {
      if (form.directors && Array.isArray(form.directors) && form.directors[0]) {
        return formatDate(form.directors[0][field]);
      }
      return formatDate(form[field]);
    };
    const getDir2Date = (field: string) => {
      if (form.directors && Array.isArray(form.directors) && form.directors[1]) {
        return formatDate(form.directors[1][field]);
      }
      return formatDate(form[field + '2']);
    };
    const getDir1Income = () => {
      if (form.directors && Array.isArray(form.directors) && form.directors[0]) {
        const dir = form.directors[0];
        return dir.sourceOfIncome === 'Other' && dir.sourceOfIncomeOther ? dir.sourceOfIncomeOther : (dir.sourceOfIncome || 'N/A');
      }
      return form.sourceOfIncome === 'Other' && form.sourceOfIncomeOther ? form.sourceOfIncomeOther : (getValue(form, 'sourceOfIncome'));
    };
    const getDir2Income = () => {
      if (form.directors && Array.isArray(form.directors) && form.directors[1]) {
        const dir = form.directors[1];
        return dir.sourceOfIncome === 'Other' && dir.sourceOfIncomeOther ? dir.sourceOfIncomeOther : (dir.sourceOfIncome || 'N/A');
      }
      return form.sourceOfIncome2 === 'Other' && form.sourceOfIncomeOther2 ? form.sourceOfIncomeOther2 : (getValue(form, 'sourceOfIncome2'));
    };
    const getPremiumSource = () => {
      return form.premiumPaymentSource === 'Other' && form.premiumPaymentSourceOther
        ? getValue(form, 'premiumPaymentSourceOther')
        : getValue(form, 'premiumPaymentSource');
    };

    return [
      form.id || 'N/A',
      formatDate(form.submittedAt),
      // Company Information
      getValue(form, 'insured'), getValue(form, 'officeAddress'),
      getValue(form, 'ownershipOfCompany'), getValue(form, 'website'),
      getValue(form, 'incorporationNumber'), getValue(form, 'incorporationState'),
      formatDate(form.dateOfIncorporationRegistration),
      getValue(form, 'contactPersonNo'), getValue(form, 'businessTypeOccupation'),
      getValue(form, 'taxIDNo'), getValue(form, 'emailAddress'),
      getPremiumSource(),
      // Director 1
      getDir1('firstName'), getDir1('middleName'), getDir1('lastName'), getDir1Date('dob'),
      getDir1('placeOfBirth'), getDir1('nationality'), getDir1('country'), getDir1('occupation'),
      getDir1('email'), getDir1('phoneNumber'), getDir1('BVNNumber'), getDir1('NINNumber'),
      getDir1('residentialAddress'), getDir1('taxIDNumber'), getDir1('idType'), getDir1('idNumber'),
      getDir1('issuingBody'), getDir1Date('issuedDate'), getDir1Date('expiryDate'), getDir1Income(),
      // Director 2
      getDir2('firstName'), getDir2('middleName'), getDir2('lastName'), getDir2Date('dob'),
      getDir2('placeOfBirth'), getDir2('nationality'), getDir2('country'), getDir2('occupation'),
      getDir2('email'), getDir2('phoneNumber'), getDir2('BVNNumber'), getDir2('NINNumber'),
      getDir2('residentialAddress'), getDir2('taxIDNumber'), getDir2('idType'), getDir2('idNumber'),
      getDir2('issuingBody'), getDir2Date('issuedDate'), getDir2Date('expiryDate'), getDir2Income(),
      // Account Details
      getValue(form, 'localBankName'), getValue(form, 'localAccountNumber'),
      getValue(form, 'localBankBranch'), formatDate(form.localAccountOpeningDate),
      getValue(form, 'foreignBankName'), getValue(form, 'foreignAccountNumber'),
      getValue(form, 'foreignBankBranch'), formatDate(form.foreignAccountOpeningDate),
      // Verification & Declaration
      getValue(form, 'verificationDocUrl'), getValue(form, 'signature')
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `corporate-nfiu-forms-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  toast({
    title: 'Success',
    description: 'CSV exported successfully',
  });
};
