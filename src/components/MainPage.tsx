import { sound } from '../utils/audio';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight, BookOpen, Feather, ShieldCheck, CalendarDays } from 'lucide-react';
import { HOUSES } from '../data/houseData';
import type { HouseType } from '../types/character';
import type { HomeSection, ScrollRequest } from '../types/navigation';
import { FantasyStage } from './FantasyStage';
import { StorybookLogo } from './StorybookLogo';
import { HouseEmblem } from './HouseEmblem';
import castle from '../assets/images/utopia_castle_night_1791347657904.jpg';

type Props = { onNavigateToDirectory: (house?: HouseType) => void; scrollRequest: ScrollRequest; onSectionChange: (section: HomeSection) => void };
const places = [
  { name: '성의 회랑', subtitle: 'THE CASTLE CORRIDORS', text: '움직이는 계단과 비밀을 간직한 초상화. 낯선 복도를 지나며 마주친 이름 하나가, 당신의 다음 이야기가 됩니다.' },
  { name: '대연회장', subtitle: 'THE GREAT HALL', text: '수많은 촛불 아래, 네 기숙사의 하루가 만나는 곳. 함께 나눈 식사와 작은 대화들이 오래 기억될 장면으로 남습니다.' },
  { name: '네 기숙사', subtitle: 'A PLACE TO BELONG', text: '용기와 야망, 지혜와 성실. 서로 다른 마음들이 같은 성 아래 모여, 저마다의 방식으로 마법을 배워갑니다.' },
];

function WorldChapter() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [place, setPlace] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : -65, reduced ? 0 : 65]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 1.16, 1]);
  return <section id="world" className="world-chapter story-section" ref={ref} aria-labelledby="world-title">
    <div className="chapter-lead"><span className="chapter-index">I</span><div><span className="small-caps">THE WORLD · 세계관</span><h2 id="world-title">머글의 눈에 보이지 않는,<br /><em>또 하나의 세계.</em></h2></div></div>
    <div className="world-editorial">
      <div className="world-sticky"><div className="world-landscape"><motion.img src={castle} alt="호수와 숲 사이에 우뚝 선 호그와트의 밤" style={{ y: imageY, scale }} /><span className="landscape-caption">HOGWARTS · SCOTLAND</span><div className="landscape-cross" aria-hidden="true">✦</div></div><p className="image-footnote">오래된 성은, 아직 쓰이지 않은 이야기를 기다린다.</p></div>
      <div className="world-manuscript">
        <motion.p className="drop-cap" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: reduced ? 0 : .7 }}>스코틀랜드 고원, 안개 너머의 호그와트. 수백 년의 기억을 간직한 성곽 아래에서 네 기숙사의 마법사들이 함께 하루를 시작합니다.</motion.p>
        <motion.div initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: reduced ? 0 : .7 }}><h3>이 이야기를 살아가는 것은, 당신.</h3><p>Once Upon a time...은 해리포터 세계관을 기반으로 한 오리지널 캐릭터 커뮤니티입니다. 저마다의 신념을 지닌 학생들이 일상을 나누고, 서로를 알아가며 성장하는 이야기를 기록합니다.</p><p>원작의 마법 법칙을 존중하되, 그 안에서 피어나는 관계와 선택은 우리의 몫. 이름 없는 책갈피에 당신만의 한 장을 남겨보세요.</p></motion.div>
        <div className="world-location-book"><div className="location-tabs" role="tablist" aria-label="호그와트의 장소">{places.map((entry, i) => <button key={entry.name} role="tab" id={`place-tab-${i}`} aria-selected={place === i} aria-controls="place-description" tabIndex={place === i ? 0 : -1} onClick={() => { if (i !== place) sound.playChime('sparkle'); setPlace(i); }} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? places.length - 1 : (place + (event.key === 'ArrowRight' ? 1 : -1) + places.length) % places.length; sound.playChime('sparkle'); setPlace(next); document.getElementById(`place-tab-${next}`)?.focus(); } }}>{entry.name}</button>)}</div><div id="place-description" role="tabpanel" aria-labelledby={`place-tab-${place}`}><motion.div key={place} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }}><span className="small-caps">{places[place].subtitle}</span><p>{places[place].text}</p></motion.div></div></div>
      </div>
    </div>
  </section>;
}

export function MainPage({ onNavigateToDirectory, scrollRequest, onSectionChange }: Props) {
  const reduced = useReducedMotion();
  const hero = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: page, offset: ['start start', 'end end'] });
  const { scrollYProgress: heroProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const logoY = useTransform(heroProgress, [0, 1], [0, reduced ? 0 : 130]);
  const logoOpacity = useTransform(heroProgress, [0, .8], [1, reduced ? 1 : .15]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById(scrollRequest.section)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [scrollRequest, reduced]);
  useEffect(() => {
    const update = () => {
      const marker = innerHeight * .35;
      let current: HomeSection = 'home';
      for (const id of ['home', 'world', 'system', 'timetable'] as HomeSection[]) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= marker) current = id;
      }
      onSectionChange(current);
    };
    let frame = 0;
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true }); update();
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [onSectionChange]);
  const reveal = { initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 35 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .2 }, transition: { duration: reduced ? 0 : .8 } };
  return <div className="wizard-home scroll-story" ref={page}>
    <motion.div className="story-reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    <div id="home" ref={hero} className="story-opening"><FantasyStage className="story-home-stage">
      <div className="chapter-heading"><span className="small-caps">호그와트 마법학교 · 비공식 창작 커뮤니티</span></div>
      <div className="portrait-composition home-composition">
        <motion.aside className="stage-note note-left" {...reveal}><span className="small-caps">PROLOGUE · 서문</span><h2>오래된 성벽 너머,<br />우리의 이야기가 열린다.</h2><p>촛불이 밝힌 복도와 비밀을 간직한 초상화.<br />수백 년을 이어온 성의 기억 속에<br />당신의 이름을 새겨보세요.</p><a className="ink-link" href="#world" onClick={() => sound.playChime('page')}>세계의 첫 장을 펼치다 <ArrowRight size={15} /></a></motion.aside>
        <motion.div className="home-logo-center" style={{ y: logoY, opacity: logoOpacity }}><h1 className="sr-only">Once Upon a time...</h1><StorybookLogo /></motion.div>
        <motion.aside className="stage-note note-right" {...reveal}><span className="small-caps">AN UNWRITTEN STORY</span><span className="note-rule" /><h2>서로 다른 마법,<br />함께 써 내려갈 한 권의 책.</h2><p>아직 끝나지 않은 그들의 이야기를<br />지금 펼쳐보세요.</p><button className="ink-link" onClick={() => { sound.playChime('lumos'); onNavigateToDirectory(); }}>학생 명부 둘러보기 <ArrowRight size={15} /></button></motion.aside>
      </div>
      <a className="scroll-invitation" href="#world" onClick={() => sound.playChime('page')}><span>스크롤하여 첫 장을 펼쳐보세요</span><ArrowDown size={15} /></a>
    </FantasyStage></div>
    <div className="chronicle-ribbon" aria-hidden="true"><div>{[0, 1].map(i => <span key={i}>DRACO DORMIENS NUNQUAM TITILLANDUS <b>✦</b> EVERY NAME BEGINS A STORY <b>✦</b> ONCE UPON A TIME… <b>✦</b> </span>)}</div></div>
    <WorldChapter />
    <section id="houses" className="house-chapter story-section" aria-labelledby="houses-title">
      <motion.div {...reveal}><span className="small-caps">II · THE FOUR HOUSES</span><h2 id="houses-title">당신의 마음이 향하는 곳</h2><p>네 가지 빛, 네 가지 신념. 같은 성 아래에서 서로 다른 이야기가 시작됩니다.</p></motion.div>
      <div className="house-banners">{Object.values(HOUSES).map((house, i) => <motion.button key={house.id} data-house={house.id} className={`house-banner banner-${house.id}`} onClick={() => { sound.playChime('lumos'); onNavigateToDirectory(house.id); }} {...reveal} transition={{ duration: reduced ? 0 : .7, delay: reduced ? 0 : i * .1 }}><span className="banner-number">0{i + 1}</span><HouseEmblem house={house.id} className="banner-emblem" /><h3>{house.nameEn}</h3><span>{house.nameKo}</span><p>{house.values.join(' · ')}</p><ArrowRight size={17} /></motion.button>)}</div>
    </section>
    <section id="system" className="system-chapter story-section" aria-labelledby="system-title">
      <motion.div className="chapter-lead" {...reveal}><span className="chapter-index">III</span><div><span className="small-caps">THE SYSTEM · 시스템</span><h2 id="system-title">함께 이야기를<br /><em>써 내려가는 방법.</em></h2><p>서로의 세계를 존중하며, 한 장씩 우리의 기록을 쌓아갑니다.</p></div></motion.div>
      <div className="system-ledger">{[
        { icon: BookOpen, title: '나만의 마법사', en: 'CHARACTER', text: '원작의 마법 법칙과 설정을 바탕으로 자신만의 인물을 만들어갑니다. 인물 기록은 관리자가 등록하고 갱신합니다.' },
        { icon: Feather, title: '함께 잇는 서사', en: 'RELATIONSHIP', text: '서로 다른 기숙사의 학생들과 일상을 나누고 관계를 쌓아갑니다. 다른 캐릭터의 설정과 이야기를 존중해주세요.' },
        { icon: ShieldCheck, title: '우리의 기록', en: 'ARCHIVE', text: '기숙사별 명부에서 학생들을 만나보세요. 프로필에서는 성격과 배경, 지팡이와 마법에 관한 기록을 열람할 수 있습니다.' },
      ].map((entry, i) => <motion.article key={entry.en} {...reveal}><span className="ledger-number">0{i + 1}</span><entry.icon size={24} strokeWidth={1} /><div><span className="small-caps">{entry.en}</span><h3>{entry.title}</h3><p>{entry.text}</p></div></motion.article>)}</div>
    </section>
    <section id="timetable" className="timetable-chapter story-section" aria-labelledby="timetable-title">
      <motion.div {...reveal}><CalendarDays className="schedule-seal" size={34} strokeWidth={1} /><span className="small-caps">IV · THE SCHOOL CALENDAR</span><h2 id="timetable-title">성의 시계가,<br />다음 이야기를 알릴 때.</h2><p className="schedule-intro">수업과 행사, 함께할 시간의 안내를 이곳에 기록합니다.</p><div className="schedule-notice"><span className="schedule-status">시간표 준비 중</span><h3>아직 펼쳐지지 않은 학사 일정</h3><p>수업 시간과 커뮤니티 행사 일정은 확정되는 대로 안내됩니다.<br />새로운 이야기가 시작될 시간을 조금만 기다려주세요.</p></div><button className="ink-link" onClick={() => { sound.playChime('lumos'); onNavigateToDirectory(); }}>기다리는 동안, 학생들의 이야기 만나기 <ArrowRight size={15} /></button></motion.div>
    </section>
    <footer className="archive-footer"><a href="#home" className="footer-wordmark">Once Upon a time...</a><p>책장이 덮여도, 우리의 마법은 계속된다.</p><span>Harry Potter original character community</span></footer>
  </div>;
}
