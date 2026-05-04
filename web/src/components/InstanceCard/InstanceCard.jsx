import React from 'react'
import './InstanceCard.css'
import CreeperIcon from '../../icons/CreeperIcon/index.js';
import { useNavigate } from 'react-router-dom';

export const InstanceCard = ({ instance }) => {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate(`/instance/${instance.id}`)
  }

  return (
    <div key={instance.id} className='instanceCard' onClick={handleClick}>
      <div className='instanceCard__header'>
        <CreeperIcon size='48px' color={instance.run ? '#00ba14' : '#000'}/>

        <h3 className='instanceCard__name'>{instance.name}</h3>

      </div>

      <div className='instanceCard__main'>
        <div className='instanceCard__info'>
          <p>{instance.type === 'java' && instance.software ? instance.software : instance.type}</p>
          <p>{instance.version}</p>
        </div>
      </div>
    </div>
  )
}
