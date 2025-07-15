import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminFidelityGuaranteeClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="fidelity-guarantee-claims"
      title="Fidelity Guarantee Claims Management"
      isClaim={true}
    />
  );
};

export default AdminFidelityGuaranteeClaimsTable;