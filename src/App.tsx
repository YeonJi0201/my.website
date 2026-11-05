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

// 관리자 화면은 공개 방문자의 초기 번들에서 분리해 필요할 때만 불러온다.
const AdminPage = lazy(() => import('./components/AdminPage'));

export default function App() {
  // 페이지 전환, API에서 받은 캐릭터, 검색 조건과 스크롤 목적지를 앱 단위로 보관한다.
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

  // 공개 명부를 서버에서 불러오고, 실패 시 화면에서 재시도할 수 있도록 상태를 갱신한다.
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

  // 해시와 화면 상태를 함께 바꾸어 메인 섹션·명부·인물 소개 사이를 이동한다.
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

  // 공통 배경 위에 관리자 또는 공개 내비게이션과 현재 화면을 분기해 렌더링한다.
  return <div className="min-h-screen bg-[#07090e] text-[#e8e4dc] flex flex-col selection:bg-[#d4a33e]/30 selection:text-[#f5d064]">
    <MagicalBackground /><SmokeVeil />
    {isAdminPath ? <Suspense fallback={<p className="archive-loading" role="status">관리자 서고를 여는 중입니다…</p>}><AdminPage characters={characters} onCharactersChange={setCharacters} /></Suspense> : <>
      <Navbar currentTab={currentView === 'home' ? activeSection : currentView} onNavigate={navigate} soundEnabled={soundEnabled} onToggleSound={handleToggleSound} overlay={currentView === 'home'} />
      {loadError && <div className="archive-error" role="alert">{loadError}<button onClick={() => void refresh()}>다시 불러오기</button></div>}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {currentView === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MainPage scrollRequest={scrollRequest} onSectionChange={setActiveSection} onNavigateToDirectory={house => { setSelectedHouse(house || 'all'); setCurrentView('directory'); history.replaceState(null, '', '#directory'); window.scrollTo({ top: 0, behavior: 'instant' }); }} /></motion.div>}
          {currentView === 'directory' && <motion.div key="directory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{loading ? <p className="archive-loading" role="status">학생 기록을 펼치는 중입니다…</p> : <HouseDirectoryPage characters={characters} selectedHouse={selectedHouse} onSelectHouse={setSelectedHouse} onSelectCharacter={select} onBackToHome={() => navigate('home')} />}</motion.div>}
          {currentView === 'profile' && selected && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><CharacterProfilePage character={selected} onBackToDirectory={() => setCurrentView('directory')} /></motion.div>}
        </AnimatePresence>
      </main>

    </>}
  </div>;
}
