import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminContractorsPlantMachineryClaimsTable: React.FC = () => {
  console.log('AdminContractorsPlantMachineryClaimsTable: Rendering Contractors Plant Machinery Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="contractors-claims"
      title="Contractors Plant Machinery Claims Management"
      isClaim={true}
    />
  );
};

export default AdminContractorsPlantMachineryClaimsTable;