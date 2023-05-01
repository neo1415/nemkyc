import React from 'react'
import { NavigationDots, SocialMedia } from '../Components'

const AppWrap = (Component, idName, className) => function HOC(){
  return (
    <div id={idName} className={`app__container ${className}`}>
        <div className='app__wrapper app__flex'>
            <Component />
        </div>
    </div>
  )
}

export default AppWrap