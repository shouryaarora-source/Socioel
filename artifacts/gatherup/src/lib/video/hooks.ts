import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const durationsRef = useRef(Object.values(durations));
  const hasFinishedFirstPass = useRef(false);

  useEffect(() => {
    // Start recording on mount
    window.startRecording?.();

    let timeoutId: NodeJS.Timeout;
    const playScene = (index: number) => {
      setCurrentScene(index);
      const currentDuration = durationsRef.current[index];

      timeoutId = setTimeout(() => {
        const nextScene = index + 1;
        if (nextScene >= durationsRef.current.length) {
          if (!hasFinishedFirstPass.current) {
            hasFinishedFirstPass.current = true;
            window.stopRecording?.();
          }
          // Loop back to start
          playScene(0);
        } else {
          playScene(nextScene);
        }
      }, currentDuration);
    };

    playScene(0);

    return () => clearTimeout(timeoutId);
  }, []);

  return { currentScene };
}
