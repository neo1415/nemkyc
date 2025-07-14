import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminEmployersLiabilityClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="employers-liability-claims"
      title="Employers Liability Claims Management"
      isClaim={true}
    />
  );
};

export default AdminEmployersLiabilityClaimsTable;