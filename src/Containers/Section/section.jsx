import React from 'react'
import './Section.scss'
import CorporateWrapper from '../Modals/sectionModal';
import IndividualWrapper from '../Modals/IndividualSection';

const Section = () => {
  return (
<section id='section'>

    <CorporateWrapper />

    <IndividualWrapper />

</section>

  )
}

export default Section