import { Volume2, VolumeX } from 'lucide-react';
import type { NavigationTarget } from '../types/navigation';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentTab: NavigationTarget | 'profile';
  onNavigate: (tab: NavigationTarget) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}
const links = [
  { id: 'world', label: '세계관' },
  { id: 'directory', label: '기숙사별 명부' },
  { id: 'system', label: '시스템' },
  { id: 'timetable', label: '시간표 안내' },
] as const;
export function Navbar({ currentTab, onNavigate, soundEnabled, onToggleSound }: NavbarProps) {
  const navigate = (event: React.MouseEvent, target: NavigationTarget) => {
    event.preventDefault(); sound.playChime('page'); onNavigate(target);
  };
  return <header className="site-header">
    <div className="site-header-inner">
      <a className="site-wordmark" href="#home" aria-label="Once Upon a time... 메인으로" onClick={event => navigate(event, 'home')}>Once Upon a time...</a>
      <nav aria-label="주 메뉴">{links.map(link => {
        const active = currentTab === link.id || (link.id === 'directory' && currentTab === 'profile');
        return <a key={link.id} href={`#${link.id}`} onClick={event => navigate(event, link.id)} className={active ? 'is-active' : ''} aria-current={active ? 'location' : undefined}>{link.label}</a>;
      })}</nav>
      <button className="site-sound" onClick={onToggleSound} aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
    </div>
  </header>;
}
