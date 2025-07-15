import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminCorporateKYCTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="cdd-forms"
      title="Corporate CDD Management"
      isClaim={false}
    />
  );
};

export default AdminCorporateKYCTable;