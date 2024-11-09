import { useEffect, useRef } from 'react';

export default function useSound(isMuted: boolean) {
  const eatSound = useRef<HTMLAudioElement>();
  const gameOverSound = useRef<HTMLAudioElement>();
  const backgroundMusic = useRef<HTMLAudioElement>();

  useEffect(() => {
    eatSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    gameOverSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
    backgroundMusic.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3');
    
    if (backgroundMusic.current) {
      backgroundMusic.current.loop = true;
      backgroundMusic.current.volume = 0.3;
    }

    return () => {
      if (backgroundMusic.current) {
        backgroundMusic.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.muted = isMuted;
    }
    if (eatSound.current) {
      eatSound.current.muted = isMuted;
    }
    if (gameOverSound.current) {
      gameOverSound.current.muted = isMuted;
    }
  }, [isMuted]);

  const playEat = () => {
    if (eatSound.current) {
      eatSound.current.currentTime = 0;
      eatSound.current.play();
    }
  };

  const playGameOver = () => {
    if (gameOverSound.current) {
      gameOverSound.current.currentTime = 0;
      gameOverSound.current.play();
    }
  };

  const playMusic = () => {
    if (backgroundMusic.current) {
      backgroundMusic.current.play();
    }
  };

  return { playEat, playGameOver, playMusic };
}