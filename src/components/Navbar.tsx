import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { NavigationTarget } from '../types/navigation';
import { sound } from '../utils/audio';
import crest from '../assets/images/crest-emblem.webp';
import { HeaderMark, Sparkle } from './HeroOrnaments';

interface NavbarProps {
  currentTab: NavigationTarget | 'profile';
  onNavigate: (tab: NavigationTarget) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  /** The home painting runs under the header until the reader scrolls past it. */
  overlay: boolean;
}
const links = [
  { id: 'world', label: 'World', korean: '세계관' },
  { id: 'directory', label: 'Character', korean: '기숙사별 명부' },
  { id: 'system', label: 'System', korean: '시스템' },
  { id: 'timetable', label: 'Timetable', korean: '시간표 안내' },
] as const;
export function Navbar({ currentTab, onNavigate, soundEnabled, onToggleSound, overlay }: NavbarProps) {
  const header = useRef<HTMLElement>(null);
  const [overHero, setOverHero] = useState(overlay);
  useEffect(() => {
    if (!overlay) { setOverHero(false); return; }
    const update = () => {
      const hero = document.getElementById('home');
      const limit = hero ? hero.offsetHeight - (header.current?.offsetHeight ?? 90) - 8 : 0;
      setOverHero(scrollY < limit);
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => { removeEventListener('scroll', update); removeEventListener('resize', update); };
  }, [overlay]);
  const navigate = (event: React.MouseEvent, target: NavigationTarget) => {
    event.preventDefault(); sound.playChime('page'); onNavigate(target);
  };
  return <header ref={header} className={`site-header${overlay ? ' is-overlay' : ''}${overlay && overHero ? ' is-over-hero' : ''}`}>
    <div className="site-header-inner">
      <a className="site-wordmark" href="#home" aria-label="Once Upon a time... 메인으로" onClick={event => navigate(event, 'home')}>
        <img className="brand-crest" src={crest} alt="" width={125} height={79} decoding="async" />
        <span lang="en">Once Upon a time...</span>
      </a>
      <nav aria-label="주 메뉴"><ul>{links.map((link, index) => {
        const active = currentTab === link.id || (link.id === 'directory' && currentTab === 'profile');
        return <li key={link.id}>
          {index > 0 && <Sparkle className="site-nav-star" />}
          <a href={`#${link.id}`} title={link.korean} onClick={event => navigate(event, link.id)} className={active ? 'is-active' : ''} aria-current={active ? 'location' : undefined}><span lang="en">{link.label}</span><span className="sr-only"> · {link.korean}</span></a>
        </li>;
      })}</ul></nav>
      <button className="site-sound" onClick={onToggleSound} aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={17} strokeWidth={1.4} /> : <VolumeX size={17} strokeWidth={1.4} />}</button>
    </div>
    <div className="site-rule" aria-hidden="true"><HeaderMark /></div>
  </header>;
}
