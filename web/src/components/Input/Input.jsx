import React from 'react'
import './Input.css'

export const Input = (props) => {
  const test = (event) => {
    // console.log(event)
    console.log(event.target)
    console.log(event.target.value)
  }
  return (
    <div className='Input'>
      <div className='Input__header'>
        <p>{props.name}</p>
        { props.type === 'number' && 
        <input 
          className='Input__number' 
          type="number" 
          min='0' 
          value={props.value}
          onChange={(event) => props.setValue(event.target.value)}
        />}

        {props.type === 'text' && 
        <input
          className='Input__text'
          value={props.value}
          onChange={(event) => props.setValue(event.target.value)}
        />}

        {props.type === 'boolean' && 
        <label className="Input__check">
          <input
            className='Input__check-input' 
            type="checkbox"
            checked={typeof(props.value) !== 'boolean' ? props.value == 'true' ? true : false : props.value}
            onChange={(event) => props.setValue(event.target.checked)}
          />
          <span className="Input__check-slider"></span>
        </label>}

        {props.type === 'select' && 
        <select 
          className='Input__select' 
          id={`select-${props.name}`}
          value={props.value} 
          onChange={(event) => props.setValue(event.target.value)}
        >
          {props.options && props.options.map((option, index) => (
            <option key={`option-${props.name}-${index}`} value={option}>{option}</option>
          ))}
        </select> }
      </div>
      <div className='Input__footer'>
        <span>{props.description}</span> = <span>{String(props.value)}</span>
      </div>
    </div>
  )
}
