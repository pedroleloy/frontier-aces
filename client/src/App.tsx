import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { MapScreen } from './screens/MapScreen';
import { CityScreen } from './screens/CityScreen';
import { PokerScreen } from './screens/PokerScreen';
import { PropertyScreen } from './screens/PropertyScreen';
import { BankScreen } from './screens/BankScreen';
import { useAudioBootstrap } from './hooks/useAudio';
import { useTravelAnimation } from './hooks/useTravel';
import { useMapStore } from './stores/useMapStore';
import { syncToCloud } from './services/persistence';

export type Screen =
  | { name: 'menu' }
  | { name: 'map' }
  | { name: 'city' }
  | { name: 'poker'; cityId: string; blindLevel: number; opponentIds: string[] }
  | { name: 'property' }
  | { name: 'bank' };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });

  useAudioBootstrap();
  useTravelAnimation(2200);

  // Auto-flip back to map when travel completes (UX nicety)
  const travel = useMapStore((s) => s.travel);
  useEffect(() => {
    if (travel === null && screen.name === 'city') {
      // entering a new city after travel
    }
  }, [travel, screen.name]);

  // Best-effort cloud sync every 30s when not on menu
  useEffect(() => {
    if (screen.name === 'menu') return;
    const id = setInterval(() => {
      void syncToCloud();
    }, 30_000);
    return () => clearInterval(id);
  }, [screen.name]);

  return (
    <div className="min-h-screen w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-screen"
        >
          {screen.name === 'menu' && (
            <MainMenuScreen onStart={() => setScreen({ name: 'map' })} />
          )}
          {screen.name === 'map' && (
            <MapScreen
              onMenu={() => setScreen({ name: 'menu' })}
              onEnterCity={() => setScreen({ name: 'city' })}
            />
          )}
          {screen.name === 'city' && (
            <CityScreen
              onMenu={() => setScreen({ name: 'menu' })}
              onMap={() => setScreen({ name: 'map' })}
              onPoker={(blindLevel, opponentIds) => {
                const cityId = useMapStore.getState().currentCityId;
                setScreen({ name: 'poker', cityId, blindLevel, opponentIds });
              }}
              onProperty={() => setScreen({ name: 'property' })}
              onBank={() => setScreen({ name: 'bank' })}
            />
          )}
          {screen.name === 'poker' && (
            <PokerScreen
              cityId={screen.cityId}
              blindLevel={screen.blindLevel}
              opponentIds={screen.opponentIds}
              onLeave={() => setScreen({ name: 'city' })}
            />
          )}
          {screen.name === 'property' && (
            <PropertyScreen onBack={() => setScreen({ name: 'city' })} />
          )}
          {screen.name === 'bank' && (
            <BankScreen onBack={() => setScreen({ name: 'city' })} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
