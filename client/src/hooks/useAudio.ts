import { useEffect } from 'react';
import { audio } from '../services/audio';

/**
 * Mounts a one-time listener that "primes" the audio context on the first
 * user gesture (browsers block AudioContext until then).
 */
export function useAudioBootstrap(): void {
  useEffect(() => {
    const prime = () => {
      audio.play('click');
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
    window.addEventListener('pointerdown', prime, { once: true });
    window.addEventListener('keydown', prime, { once: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, []);
}
