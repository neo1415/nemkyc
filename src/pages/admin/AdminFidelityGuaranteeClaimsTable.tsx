import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminFidelityGuaranteeClaimsTable: React.FC = () => {
  console.log('AdminFidelityGuaranteeClaimsTable: Rendering Fidelity Guarantee Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="fidelityGuaranteeClaims"
      title="Fidelity Guarantee Claims Management"
      isClaim={true}
    />
  );
};

export default AdminFidelityGuaranteeClaimsTable;
