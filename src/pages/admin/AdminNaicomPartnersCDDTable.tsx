import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminNaicomPartnersCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="naicom-partners-cdd"
      title="NAICOM Partners CDD"
      isClaim={false}
    />
  );
};

export default AdminNaicomPartnersCDDTable;
