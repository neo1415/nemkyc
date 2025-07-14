import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminMotorClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="motor-claims"
      title="Motor Claims Management"
      isClaim={true}
    />
  );
};

export default AdminMotorClaimsTable;