import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminAgentsCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="cdd-forms"
      title="Agents CDD Management"
      isClaim={false}
    />
  );
};

export default AdminAgentsCDDTable;
