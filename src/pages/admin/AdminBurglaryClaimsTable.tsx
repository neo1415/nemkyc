import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminBurglaryClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="burglary-claims"
      title="Burglary Claims Management"
      isClaim={true}
    />
  );
};

export default AdminBurglaryClaimsTable;