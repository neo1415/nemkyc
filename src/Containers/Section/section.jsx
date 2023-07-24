import React from 'react'
import { images } from '../../Constants';
import './Section.scss'
import { Link } from 'react-router-dom';
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