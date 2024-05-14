import React from 'react'
import './Section.scss'
import CorporateWrapper from '../Modals/sectionModal';
import IndividualWrapper from '../Modals/IndividualSection';
import PartnersWrapper from '../Modals/PartnersModal';
import BrokersWrapper from '../Modals/BrokersModal';
import AgentsWrapper from '../Modals/AgentsModal';

const Section = () => {
  return (
<section id='section'>

    <CorporateWrapper />

    <IndividualWrapper />

    <PartnersWrapper />

    <BrokersWrapper />

    <AgentsWrapper />

</section>

  )
}

export default Section