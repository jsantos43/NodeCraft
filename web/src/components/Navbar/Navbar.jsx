import React from 'react';
import './Navbar.css'
import { Link } from 'react-router-dom';
import ConfigIcon from '../../icons/ConfigIcon/index.js';
import ServerIcon from '../../icons/ServerIcon/index.js';

export const Navbar = () => {
  return(
    <nav className='navbar'>
      <div className='navbar-logo'>
        <h1>Nodecraft</h1>
      </div>
      <div className='navbar-links'>
        <Link to='/'>
          <ServerIcon size='56px' color='var(--light-color)' />
        </Link>
        
        <Link to='/settings'>
          <ConfigIcon size='56px' color='var(--light-color)' />
        </Link>
      </div>
    </nav>
  )
};
