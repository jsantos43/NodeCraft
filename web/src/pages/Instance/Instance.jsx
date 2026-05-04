import React, { useState, useEffect } from 'react'
import './Instance.css'
import { useParams } from 'react-router-dom'
import InstanceNav from '../../components/InstanceNav/index.js';

export const Instance = () => {
  const { id } = useParams();
  const [data, setData] = useState(null)

  const url = `http://localhost:3000/instance/${id}`;

  useEffect(() => {
    const readMyInstances = async () => {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include',
        })
        const result = await res.json()

        setData(result.instance)

        console.log(result)
      } catch (err) {
        console.error(err)        
      }

    }

    readMyInstances()
  }, [url])

  return (
    <section className='instance'>
      <InstanceNav id={id}/>

    </section>
  )
}
