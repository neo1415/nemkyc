import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminNEMHomeProtectionClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable
      collectionName="nem-home-protection-claims"
      title="NEM Home Protection Claims"
      description="View and manage all NEM Home Protection Policy insurance claims"
    />
  );
};

export default AdminNEMHomeProtectionClaimsTable;
