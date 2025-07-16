import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminProfessionalIndemnityClaimsTable: React.FC = () => {
  console.log('AdminProfessionalIndemnityClaimsTable: Rendering Professional Indemnity Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="professional-indemnity-claims"
      title="Professional Indemnity Claims Management"
      isClaim={true}
    />
  );
};

export default AdminProfessionalIndemnityClaimsTable;