import React from 'react';
import { useState, useEffect } from 'react';
import './Home.css'

import InstanceCard from '../../components/InstanceCard/index.js';

export const Home = () => {
  const [data, setData] = useState(null)

  const url = "http://localhost:3000/auth/login";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "email": "joao.santos.2007sp@gmail.com",
            "password": "123456"
          }),
          credentials: 'include',
        })
    
        const result = await res.json()

        readMyInstances()
        
        console.log(result)
      } catch (err) {
        console.error(err)
      }
  
    }

    const readMyInstances = async () => {
      try {
        const res = await fetch("http://localhost:3000/instance", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include',
        })
        const result = await res.json()

        setData(result.instances)

        console.log(result)
      } catch (err) {
        console.error(err)        
      }

    }
  
    fetchData()
  }, [url])

  console.log(data)

  return (
    <div className='home'>
      <h2 className='home-title'>Instances</h2>

      <ul className='home-instances'>
        {data && data.map((item) => <InstanceCard instance={item} />)}
      </ul>

      <button className='home-create'>
        Create +
      </button>
    </div>
  );
};
