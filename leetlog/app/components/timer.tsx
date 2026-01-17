// app/components/timer.tsx
'use client';

import { useState, useEffect } from "react";

export default function Timer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const timeString = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;

  // Update document title with timer
  useEffect(() => {
    document.title = `LeetLog - ${timeString}`;
  }, [timeString]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-3 mt-32">
    
        <div className="bg-gray-700 rounded-lg p-8 flex items-center justify-center min-w-[240px]">
            <span className="text-9xl md:text-[12rem] font-mono font-light text-gray-300 tracking-tight">
                {formatTime(hours)}
            </span>
        </div>
        
        <span className="text-8xl md:text-[10rem] text-gray-400 font-light">:</span>
        

        <div className="bg-gray-700 rounded-lg p-8 flex items-center justify-center min-w-[240px]">
            <span className="text-9xl md:text-[12rem] font-mono font-light text-gray-300 tracking-tight">
                {formatTime(minutes)}
            </span>
        </div>
        
        <span className="text-8xl md:text-[10rem] text-gray-400 font-light">:</span>
        

        <div className="bg-gray-700 rounded-lg p-8 flex items-center justify-center min-w-[240px]">
            <span className="text-9xl md:text-[12rem] font-mono font-light text-gray-300 tracking-tight">
                {formatTime(seconds)}
            </span>
        </div>
    </div>
      
      <div className="flex justify-center gap-4 mt-12">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-4 py-4 bg-white text-black  hover:bg-gray-200 transition-colors font-semibold"
        >
          {isRunning ? (
            <img src="/pause.svg" alt="Pause" className="w-8 h-8 inline" />
          ) : (
            <img src="/play.svg" alt="Play" className="w-8 h-8 inline" />
          )}
        </button>
        <button
          onClick={() => {
            setTime(0);
            setIsRunning(false);
          }}
          className="px-4 py-4 border-2 border-white transition-colors"
        >
          <img src="/reset-left-fill.svg" alt="Reset" className="w-8 h-8 inline dark:invert" />
        </button>
      </div>
    </div>
  );
}