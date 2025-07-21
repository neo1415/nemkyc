import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminFireSpecialPerilsClaimsTable: React.FC = () => {
  console.log('AdminFireSpecialPerilsClaimsTable: Rendering Fire Special Perils Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="fire-special-perils-claims"
      title="Fire & Special Perils Claims Management"
      isClaim={true}
    />
  );
};

export default AdminFireSpecialPerilsClaimsTable;
