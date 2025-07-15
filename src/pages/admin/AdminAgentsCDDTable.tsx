import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminAgentsCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="agents-kyc"
      title="Agents CDD Management"
      isClaim={true}
    />
  );
};

export default AdminAgentsCDDTable;
