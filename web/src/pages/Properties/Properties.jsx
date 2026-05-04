import React, { useState, useEffect } from 'react';
import './Properties.css';
import { useParams } from 'react-router-dom';
import InstanceNav from '../../components/InstanceNav/index.js';
import { BedrockProperties } from '../../components/BedrockProperties/BedrockProperties.jsx';

export const Properties = () => {
  const { id } = useParams();
  const [instance, setInstance] = useState(null);

  const url = `http://localhost:3000/instance/${id}`;

  useEffect(() => {
    const readMyInstances = async () => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const result = await res.json();

        const { instance } = result;

        setInstance(instance);

        console.log(Object.keys(instance.properties));

        console.log(result);
      } catch (err) {
        console.error(err);
      }
    };

    readMyInstances();
  }, [url]);

  return (
    <section className='instance'>
      <InstanceNav id={id} />

      {instance && instance.type === 'bedrock' ? <BedrockProperties instance={instance}/> : ''}

    </section>
  );
};
