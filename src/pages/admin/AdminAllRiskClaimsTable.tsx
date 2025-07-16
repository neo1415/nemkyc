import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminAllRiskClaimsTable: React.FC = () => {
  console.log('AdminAllRiskClaimsTable: Rendering All Risk Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="all-risk-claims"
      title="All Risk Claims Management"
      isClaim={true}
    />
  );
};

export default AdminAllRiskClaimsTable;