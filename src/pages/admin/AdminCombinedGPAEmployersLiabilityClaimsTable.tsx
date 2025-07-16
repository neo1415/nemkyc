import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminCombinedGPAEmployersLiabilityClaimsTable: React.FC = () => {
  console.log('AdminCombinedGPAEmployersLiabilityClaimsTable: Rendering Combined GPA Employers Liability Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="combined-gpa-employers-liability-claims"
      title="Combined GPA Employers Liability Claims Management"
      isClaim={true}
    />
  );
};

export default AdminCombinedGPAEmployersLiabilityClaimsTable;