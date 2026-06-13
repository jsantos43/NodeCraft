import React, { useState } from 'react'
import './InstanceNav.css'
import BoltIcon from '../../icons/BoltIcon/index.js'
import FolderIcon from '../../icons/FolderIcon/index.js'
import GroupIcon from '../../icons/GroupIcon/index.js'
import InfoIcon from '../../icons/InfoIcon/index.js'
import { Link } from 'react-router-dom'

export const InstanceNav = (props) => {

  return (
    <nav className="instanceNavbar" >
      <Link to={`/instance/${props.id}/`}>
        <BoltIcon />
      </Link>
      <Link to={`/instance/${props.id}/properties`}>
        <InfoIcon />
      </Link>
      <Link to={`/instance/${props.id}/player`}>
        <GroupIcon />
      </Link>
      <Link to={`/instance/${props.id}/file`}>
        <FolderIcon />
      </Link> 
    </nav>
  )
}
