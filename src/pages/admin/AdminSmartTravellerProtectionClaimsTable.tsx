import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminSmartTravellerProtectionClaimsTable: React.FC = () => {
  console.log('AdminSmartTravellerProtectionClaimsTable: Rendering Smart Traveller Protection Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="smart-traveller-protection-claims"
      title="Smart Traveller Protection Claims"
    />
  );
};

export default AdminSmartTravellerProtectionClaimsTable;