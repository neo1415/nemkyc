
import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminBrokersCDDTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="brokers-kyc"
      title="Brokers CDD Management"
      isClaim={false}
    />
  );
};

export default AdminBrokersCDDTable;
