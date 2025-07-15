import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminContractorsPlantMachineryClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="contractors-plant-machinery-claims"
      title="Contractors Plant Machinery Claims Management"
      isClaim={true}
    />
  );
};

export default AdminContractorsPlantMachineryClaimsTable;