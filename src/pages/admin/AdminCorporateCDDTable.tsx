import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminCorporateCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="corporate-kyc"
      title="Corporate CDD Management"
      isClaim={false}
    />
  );
};

export default AdminCorporateCDDTable;