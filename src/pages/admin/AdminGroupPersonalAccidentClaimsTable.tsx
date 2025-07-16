import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminGroupPersonalAccidentClaimsTable: React.FC = () => {
  console.log('AdminGroupPersonalAccidentClaimsTable: Rendering Group Personal Accident Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="group-personal-accident-claims"
      title="Group Personal Accident Claims Management"
      isClaim={true}
    />
  );
};

export default AdminGroupPersonalAccidentClaimsTable;