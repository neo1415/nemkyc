import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminMoneyInsuranceClaimsTable: React.FC = () => {
  console.log('AdminMoneyInsuranceClaimsTable: Rendering Money Insurance Claims Table');
  
  return (
    <AdminUnifiedTable 
      collectionName="money-insurance-claims"
      title="Money Insurance Claims Management"
      isClaim={true}
    />
  );
};

export default AdminMoneyInsuranceClaimsTable;
