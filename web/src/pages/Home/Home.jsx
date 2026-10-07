import React from 'react';
import { useState, useEffect } from 'react';
import './Home.css'

import InstanceCard from '../../components/InstanceCard/index.js';
import { instancesApi } from '../../api/instances.js';

export const Home = () => {
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true;
    const readMyInstances = async () => {
      try {
        const result = await instancesApi.list();
        if (active) setData(result.instances);
      } catch (err) {
        if (active) setData([]);
      }
    };

    readMyInstances();
    return () => { active = false; };
  }, []);

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
