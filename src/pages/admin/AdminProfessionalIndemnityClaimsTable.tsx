import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminProfessionalIndemnityClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="professional-indemnity-claims"
      title="Professional Indemnity Claims Management"
      isClaim={true}
    />
  );
};

export default AdminProfessionalIndemnityClaimsTable;