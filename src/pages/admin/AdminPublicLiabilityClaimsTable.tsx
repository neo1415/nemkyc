import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminPublicLiabilityClaimsTable: React.FC = () => {
  console.log('AdminPublicLiabilityClaimsTable: Rendering Public Liability Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="public-liability-claims"
      title="Public Liability Claims Management"
      isClaim={true}
    />
  );
};

export default AdminPublicLiabilityClaimsTable;