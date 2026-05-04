import React, { useState, useEffect, useRef } from 'react';

export const MusicPlayer = ({ playlist, musicStarted }) => {
  // Função para gerar um índice aleatório
  const getRandomIndex = () => {
    return Math.floor(Math.random() * playlist.length);
  };

  const [currentIndex, setCurrentIndex] = useState(getRandomIndex());
  const audioRef = useRef(null);

  const handleNext = () => {
    setCurrentIndex(getRandomIndex()); // Escolher uma nova música aleatória
  };

  useEffect(() => {
    if (audioRef.current && musicStarted) {
      audioRef.current.play(); // Começa a música automaticamente
    }
  }, [musicStarted]); // Inicia a música automaticamente quando o componente for montado

  useEffect(() => {
    if (audioRef.current && musicStarted) {
      audioRef.current.load(); // Recarrega a música quando o índice mudar
      audioRef.current.play(); // Toca a nova música automaticamente
    }
  }, [currentIndex]); // Sempre que a música mudar, tocar a nova música

  return (
    <div>
      {/* Player de música */}
      <audio
        ref={audioRef}
        src={`/music/${playlist[currentIndex]}`}
        onEnded={handleNext} // Ao terminar, escolhe uma nova música aleatória
        allow="autoplay"
        preload="auto"
      />
    </div>
  );
};