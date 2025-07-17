import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminRentAssuranceClaimsTable: React.FC = () => {
  console.log('Admin Rent assurance Claims Table: Rendering Admin Rent Assurance Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="rent-assurance-claims"
      title="Rent Assurance Claims Management"
      isClaim={true}
    />
  );
};

export default AdminRentAssuranceClaimsTable
