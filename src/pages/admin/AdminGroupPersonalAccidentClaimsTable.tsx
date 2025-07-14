import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminGroupPersonalAccidentClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="groupPersonalAccidentClaims"
      title="Group Personal Accident Claims Management"
      isClaim={true}
    />
  );
};

export default AdminGroupPersonalAccidentClaimsTable;