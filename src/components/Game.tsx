import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import useSwipe from '../hooks/useSwipe';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 2;

type Position = { x: number; y: number };

export default function Game() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<string>('right');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => 
    parseInt(localStorage.getItem('snakeHighScore') || '0')
  );
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipe: (dir) => {
      if (!gameOver && !isPaused) {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (direction !== opposites[dir as keyof typeof opposites]) {
          setDirection(dir);
        }
      }
    }
  });

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      const keyMap: { [key: string]: string } = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };

      if (keyMap[e.key]) {
        const newDirection = keyMap[e.key];
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (direction !== opposites[newDirection as keyof typeof opposites]) {
          setDirection(newDirection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        
        switch (direction) {
          case 'up': head.y -= 1; break;
          case 'down': head.y += 1; break;
          case 'left': head.x -= 1; break;
          case 'right': head.x += 1; break;
        }

        // Check collision with walls or self
        if (
          head.x < 0 || head.x >= GRID_SIZE ||
          head.y < 0 || head.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        
        // Check if food is eaten
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 1); // Updated to increment by 1 instead of 100
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameSpeed = Math.max(INITIAL_SPEED - (score * SPEED_INCREASE), 50); // Updated speed calculation
    const gameLoop = setInterval(moveSnake, gameSpeed);
    return () => clearInterval(gameLoop);
  }, [direction, gameOver, isPaused, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw food with pulsing glow
    const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
    ctx.shadowBlur = 15 + pulse * 5;
    ctx.shadowColor = '#ff0066';
    ctx.fillStyle = '#ff0066';
    ctx.beginPath();
    ctx.arc(
      (food.x + 0.5) * (canvas.width / GRID_SIZE),
      (food.y + 0.5) * (canvas.height / GRID_SIZE),
      (canvas.width / GRID_SIZE) * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw snake with gradient and glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#4a00e0';
    
    snake.forEach((segment, index) => {
      const gradient = ctx.createLinearGradient(
        segment.x * (canvas.width / GRID_SIZE),
        segment.y * (canvas.height / GRID_SIZE),
        (segment.x + 1) * (canvas.width / GRID_SIZE),
        (segment.y + 1) * (canvas.height / GRID_SIZE)
      );
      
      if (index === 0) {
        gradient.addColorStop(0, '#8a2be2');
        gradient.addColorStop(1, '#4a00e0');
      } else {
        gradient.addColorStop(0, '#4a00e0');
        gradient.addColorStop(1, '#3300cc');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        segment.x * (canvas.width / GRID_SIZE),
        segment.y * (canvas.height / GRID_SIZE),
        canvas.width / GRID_SIZE - 1,
        canvas.height / GRID_SIZE - 1
      );
    });

    // Draw grid lines
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (canvas.width / GRID_SIZE), 0);
      ctx.lineTo(i * (canvas.width / GRID_SIZE), canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * (canvas.height / GRID_SIZE));
      ctx.lineTo(canvas.width, i * (canvas.height / GRID_SIZE));
      ctx.stroke();
    }

    const animationFrame = requestAnimationFrame(() => {});
    return () => cancelAnimationFrame(animationFrame);
  }, [snake, food, gameOver]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 5, y: 5 });
    setDirection('right');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="max-w-lg w-full space-y-4">
        <div className="flex justify-between items-center text-cyan-300 mb-4">
          <div className="text-xl font-bold">Score: {score}</div>
          <div className="text-xl font-bold">High Score: {highScore}</div>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full aspect-square bg-black/30 backdrop-blur-sm rounded-lg border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          />
          
          {(gameOver || isPaused) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg backdrop-blur-sm">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-cyan-300">
                  {gameOver ? 'Game Over!' : 'Paused'}
                </h2>
                {gameOver && (
                  <p className="text-purple-300">Final Score: {score}</p>
                )}
                <button
                  onClick={gameOver ? resetGame : () => setIsPaused(false)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transform hover:scale-105 transition-all duration-200 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                >
                  {gameOver ? 'Play Again' : 'Resume'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 rounded-full bg-purple-900/50 hover:bg-purple-800/50 transition-colors text-cyan-300"
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
        </div>

        <div className="text-center text-cyan-300/70 text-sm">
          Use arrow keys or swipe to control the snake
        </div>
      </div>
    </div>
  );
}