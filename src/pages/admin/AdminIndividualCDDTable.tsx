import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminIndividualCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="cdd-forms"
      title="Individual CDD Management"
      isClaim={false}
    />
  );
};

export default AdminIndividualCDDTable;