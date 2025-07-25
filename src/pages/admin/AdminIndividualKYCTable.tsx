import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminIndividualKYCTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="Individual-kyc-form"
      title="Individual KYC Management"
      isClaim={false}
    />
  );
};

export default AdminIndividualKYCTable;
