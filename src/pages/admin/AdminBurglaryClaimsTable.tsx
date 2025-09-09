import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminBurglaryClaimsTable: React.FC = () => {
  console.log('AdminBurglaryClaimsTable: Rendering Burglary Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="burglaryClaims"
      title="Burglary Claims Management"
      isClaim={true}
    />
  );
};

export default AdminBurglaryClaimsTable;
