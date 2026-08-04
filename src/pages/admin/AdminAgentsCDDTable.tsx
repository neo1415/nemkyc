import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminAgentsCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="agentsCDD"
      title="Agents CDD Management"
      isClaim={false}
    />
  );
};

export default AdminAgentsCDDTable;
