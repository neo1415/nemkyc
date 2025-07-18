import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminIndividualCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="individual-kyc"
      title="Individual CDD Management"
      isClaim={false}
    />
  );
};

export default AdminIndividualCDDTable;