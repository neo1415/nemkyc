import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminGoodsInTransitClaimsTable: React.FC = () => {
  return (
    <AdminUnifiedTable 
      collectionName="goodsInTransitClaims"
      title="Goods In Transit Claims Management"
      isClaim={true}
    />
  );
};

export default AdminGoodsInTransitClaimsTable;