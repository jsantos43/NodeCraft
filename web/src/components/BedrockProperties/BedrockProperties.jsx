import React, { useState } from 'react'
import './BedrockProperties.css'
import Input from '../../components/Input/index.js';

export const BedrockProperties = ({ instance }) => {
  const properties = instance?.properties;

  const [serverName, setServerName] = useState(properties['server-name'] || null)
  const [gamemode, setGamemode] = useState(properties['gamemode'] || null)
  const [forceGamemode, setForceGamemode] = useState(properties['force-gamemode'] || null)
  const [difficulty, setDifficulty] = useState(properties['difficulty'] || null)
  const [allowCheats, setAllowCheats] = useState(properties['allow-cheats'] || null)
  const [maxPlayers, setMaxPlayers] = useState(properties['max-players'] || null)
  const [serverPort, setPort] = useState(properties['server-port'] || null)
  const [playerIdle, setPlayerIdle] = useState(properties['player-idle-timeout'] || null)
  const [viewDistance, setViewDistance] = useState(properties['view-distance'] || null)
  const [chatRestriction, setChatRestriction] = useState(properties['chat-restriction'] || null)

  return (
    <form className='instance-form'>
      <Input 
        type='text' 
        name='Name' 
        description='server-name' 
        value={serverName} 
        setValue = {setServerName}
      />
      <Input 
        type='select' 
        name='Mode' 
        description='gamemode' 
        value={gamemode} 
        setValue = {setGamemode}
        options = {[
          'survival',
          'creative',
          'adventure',
          'spectator'
        ]}
      />
      <Input 
        type='boolean' 
        name='Force Gamemode' 
        description='force-gamemode' 
        value={forceGamemode} 
        setValue = {setForceGamemode}
      />
      <Input 
        type='select' 
        name='Difficulty' 
        description='difficulty'
        value={difficulty}
        setValue = {setDifficulty}
        options = {[
          'peaceful',
          'easy',
          'normal',
          'hard',
        ]}
      />
      <Input 
        type='boolean' 
        name='Cheats' 
        description='allow-cheats'
        value={allowCheats}
        setValue = {setAllowCheats}
      />
      <Input
        type='number'
        name='Slots'
        description='max-players'
        value={maxPlayers}
        setValue = {setMaxPlayers}
      />
      <Input
        type='number'
        name='Port'
        description='server-port'
        value={serverPort}
        setValue = {setPort}
      />
      <Input
        type='number'
        name='Player Idle'
        description='player-idle-timeout'
        value={playerIdle}
        setValue = {setPlayerIdle}
      />
      <Input
        type='number'
        name='View Distance'
        description='view-distance'
        value={viewDistance}
        setValue = {setViewDistance}
      />
      <Input
        type='select'
        name='Chat Restriction'
        description='chat-restriction'
        value={chatRestriction}
        setValue = {setChatRestriction}
        options={[
          "None", 
          "Dropped", 
          "Disabled"
        ]}
      />
    </form>
  )
}
