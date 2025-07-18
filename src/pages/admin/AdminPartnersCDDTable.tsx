import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminPartnersCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="partners-kyc"
      title="Partners CDD Management"
      isClaim={false}
    />
  );
};

export default AdminPartnersCDDTable;