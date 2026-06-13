import React from 'react'

export const ServerIcon = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || '24px'}
      height={props.size || '24px'} 
      viewBox="0 0 24 24" 
      fill='none'
      stroke={props.color || 'currentColor'}  
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="feather feather-server"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  )
}
