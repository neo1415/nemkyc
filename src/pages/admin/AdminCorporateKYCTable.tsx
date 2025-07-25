import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminCorporateKYCTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="corporate-kyc-form"
      title="Corporate KYC Management"
      isClaim={false}
    />
  );
};

export default AdminCorporateKYCTable;
