import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Character, HouseType } from './types/character';
import { Navbar } from './components/Navbar';
import { MagicalBackground } from './components/MagicalBackground';
import { SmokeVeil } from './components/SmokeVeil';
import { MainPage } from './components/MainPage';
import { HouseDirectoryPage } from './components/HouseDirectoryPage';
import { CharacterProfilePage } from './components/CharacterProfilePage';
import type { NavigationTarget, HomeSection, ScrollRequest } from './types/navigation';
import { getCharacters } from './utils/api';
import { sound } from './utils/audio';
import { lazy, Suspense } from 'react';

const AdminPage = lazy(() => import('./components/AdminPage'));

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'directory' | 'profile'>(location.hash === '#directory' ? 'directory' : 'home');
  const [activeSection, setActiveSection] = useState<HomeSection>('home');
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest>({ section: (['world', 'system', 'timetable'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home') as HomeSection, sequence: 0 });
  const [selectedHouse, setSelectedHouse] = useState<HouseType | 'all'>('all');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const isAdminPath = /^\/admin\/?$/.test(window.location.pathname);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setCharacters(await getCharacters()); setLoadError(''); }
    catch { setLoadError('학생 기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.enabled = next; setSoundEnabled(next);
    if (next) sound.playChime('lumos');
  };
  const navigate = (target: NavigationTarget) => {
    history.replaceState(null, '', target === 'home' ? location.pathname : `#${target}`);
    if (target === 'directory') {
      setCurrentView('directory'); setSelectedHouse('all'); window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setCurrentView('home');
      setActiveSection(target);
      setScrollRequest({ section: target, sequence: Date.now() });
    }
  };
  const select = (id: string) => {
    sound.playChime('lumos');
    setSelectedCharacterId(id); setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const selected = characters.find(c => c.id === selectedCharacterId);
  return <div className="min-h-screen bg-[#07090e] text-[#e8e4dc] flex flex-col selection:bg-[#d4a33e]/30 selection:text-[#f5d064]">
    <MagicalBackground /><SmokeVeil />
    {isAdminPath ? <Suspense fallback={<p className="archive-loading" role="status">관리자 서고를 여는 중입니다…</p>}><AdminPage characters={characters} onCharactersChange={setCharacters} /></Suspense> : <>
      <Navbar currentTab={currentView === 'home' ? activeSection : currentView} onNavigate={navigate} soundEnabled={soundEnabled} onToggleSound={handleToggleSound} />
      {loadError && <div className="archive-error" role="alert">{loadError}<button onClick={() => void refresh()}>다시 불러오기</button></div>}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {currentView === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MainPage scrollRequest={scrollRequest} onSectionChange={setActiveSection} onNavigateToDirectory={house => { setSelectedHouse(house || 'all'); setCurrentView('directory'); history.replaceState(null, '', '#directory'); window.scrollTo({ top: 0, behavior: 'instant' }); }} /></motion.div>}
          {currentView === 'directory' && <motion.div key="directory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{loading ? <p className="archive-loading" role="status">학생 기록을 펼치는 중입니다…</p> : <HouseDirectoryPage characters={characters} selectedHouse={selectedHouse} onSelectHouse={setSelectedHouse} onSelectCharacter={select} onBackToHome={() => navigate('home')} />}</motion.div>}
          {currentView === 'profile' && selected && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><CharacterProfilePage character={selected} allCharacters={characters} onBackToDirectory={() => setCurrentView('directory')} onSelectCharacter={select} /></motion.div>}
        </AnimatePresence>
      </main>

    </>}
  </div>;
}
