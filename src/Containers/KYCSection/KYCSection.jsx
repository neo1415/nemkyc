import React from 'react'
import './Section.scss'
import CorporateWrapper from '../Modals/sectionModal';
import IndividualWrapper from '../Modals/IndividualSection';
import PartnersWrapper from '../Modals/PartnersModal';
import BrokersWrapper from '../Modals/BrokersModal';
import AgentsWrapper from '../Modals/AgentsModal';
import CorporateKYCWrapper from '../Modals/CorporateKYCSection';
import IndividualKYCWrapper from '../Modals/IndividualKYCSection copy';

const KYCSection = () => {
  return (
<section id='section'>

    <CorporateKYCWrapper />

    <IndividualKYCWrapper />

</section>

  )
}

export default KYCSection