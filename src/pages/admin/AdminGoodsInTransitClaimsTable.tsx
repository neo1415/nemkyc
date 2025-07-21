import React from 'react';
import AdminUnifiedTable from './AdminUnifiedTable';

const AdminGoodsInTransitClaimsTable: React.FC = () => {
  console.log('AdminGoodsInTransitClaimsTable: Rendering Goods In Transit Claims table');
  
  return (
    <AdminUnifiedTable 
      collectionName="goods-in-transit-claims"
      title="Goods In Transit Claims Management"
      isClaim={true}
    />
  );
};

export default AdminGoodsInTransitClaimsTable;
