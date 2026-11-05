import { sound } from '../utils/audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { HOUSES } from '../data/houseData';
import type { HouseType } from '../types/character';
import type { HomeSection, ScrollRequest } from '../types/navigation';
import { HouseEmblem } from './HouseEmblem';
import { HeroScene } from './HeroScene';
import { HeroFlourish, ScrollCue, Sparkle, StarRule, TaglineDivider } from './HeroOrnaments';
import castle from '../assets/images/world-castle.webp';
import enterFrame from '../assets/images/enter-frame.webp';

type Props = { onNavigateToDirectory: (house?: HouseType) => void; scrollRequest: ScrollRequest; onSectionChange: (section: HomeSection) => void };

// 세계관의 장소 탭과 메인 스크롤 내비게이션에 표시할 콘텐츠를 정의한다.
const places = [
  { name: '호그스미드 역', text: '모든 시작의 첫 걸음, 세스트럴이 이끄는 마차를 타는 것은 호그와트로 향하는 첫 걸음이 됩니다.' },
  { name: '대연회장', text: '수많은 촛불 아래, 네 기숙사의 하루가 만나는 곳. 함께 나눈 식사와 작은 대화들이 오래 기억될 장면으로 남습니다.' },
  { name: '기숙사 휴게실', text: '용기와 야망, 지혜와 성실. 서로 다른 마음들이 같은 성 아래 모여, 저마다의 방식으로 마법을 배워갑니다.' },
  { name: '금지된 숲', text: '굉장히 크고 높은 나무들이 둘러싸고 있는 금지된 숲. 옛날 옛적부터 이 곳에서 무슨 일이 있었는지 우리는 알 턱이 없습니다.' },
];

const chapters = [
  { id: 'home', label: '처음으로' },
  { id: 'world', label: '세계관' },
  { id: 'houses', label: '네 기숙사' },
  { id: 'system', label: '시스템' },
  { id: 'timetable', label: '시간표 안내' },
] as const;
type ChapterId = typeof chapters[number]['id'];

// 현재 스크롤 장을 표시하고 클릭·키보드 이동을 제공하는 고정 목차다.
function ChapterRail({ current, onJump }: { current: ChapterId; onJump: (id: ChapterId) => void }) {
  return <nav className="chapter-rail" aria-label="메인 장 이동">
    <ol>{chapters.map(chapter => <li key={chapter.id}>
      <a href={`#${chapter.id}`} aria-current={current === chapter.id ? 'location' : undefined} onClick={event => { event.preventDefault(); onJump(chapter.id); }}>
        <span className="chapter-rail-mark" aria-hidden="true">{current === chapter.id ? <Sparkle /> : <i />}</span>
        <span className="chapter-rail-label">{chapter.label}</span>
      </a>
    </li>)}</ol>
  </nav>;
}

// 성 풍경과 설명, 접근 가능한 장소 탭으로 구성된 세계관 장이다.
function WorldChapter() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [place, setPlace] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : -65, reduced ? 0 : 65]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 1.16, 1]);
  return <section id="world" className="world-chapter story-section" ref={ref} aria-labelledby="world-title">
    <div className="chapter-lead"><h2 id="world-title">시간이 멈춘 듯한 고성,<br /><em>운명과 비밀이 교차하는 마법의 요람.</em></h2></div>
    <div className="world-editorial">
      <div className="world-sticky"><div className="world-landscape"><motion.img src={castle} alt="안개 낀 호숫가 절벽 위, 창마다 불이 켜진 성" style={{ y: imageY, scale }} /></div><p className="image-footnote">오래된 성은, 아직 쓰이지 않은 이야기를 기다린다.</p></div>
      <div className="world-manuscript">
        <motion.p className="world-opening" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: reduced ? 0 : .7 }}>이곳은 호그와트, 오랜 역사와 신비로운 마법이 살아 숨 쉬며 밝혀지지 않은 비밀이 끊임없이 쌓여 가는 곳입니다.</motion.p>
        <motion.div initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: reduced ? 0 : .7 }}><h3>마법 세계로부터의 초대.</h3><p>호그와트로부터 도착한 한 통의 입학통지서. 평범했던 일상에 마법의 세계가 모습을 드러내고, 새로운 배움과 만남이 기다리는 일곱 해의 여정이 시작됩니다.</p><p>마법을 처음 마주하는 순간부터 자신만의 길을 찾아가기까지. 오래된 성의 문턱을 넘어, 당신만의 호그와트를 펼쳐보세요.</p></motion.div>
        <div className="world-location-book"><div className="location-tabs" role="tablist" aria-label="호그와트의 장소">{places.map((entry, i) => <button key={entry.name} role="tab" id={`place-tab-${i}`} aria-selected={place === i} aria-controls="place-description" tabIndex={place === i ? 0 : -1} onClick={() => { if (i !== place) sound.playChime('sparkle'); setPlace(i); }} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? places.length - 1 : (place + (event.key === 'ArrowRight' ? 1 : -1) + places.length) % places.length; sound.playChime('sparkle'); setPlace(next); document.getElementById(`place-tab-${next}`)?.focus(); } }}>{entry.name}</button>)}</div><div id="place-description" role="tabpanel" aria-labelledby={`place-tab-${place}`}><motion.div key={place} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }}><p>{places[place].text}</p></motion.div></div></div>
      </div>
    </div>
  </section>;
}

export function MainPage({ onNavigateToDirectory, scrollRequest, onSectionChange }: Props) {
  // 히어로 등장·패럴랙스·진행 표시와 현재 장 추적을 위한 스크롤 상태를 구성한다.
  const reduced = useReducedMotion();
  const hero = useRef<HTMLElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [heroReady, setHeroReady] = useState(false);
  const [chapter, setChapter] = useState<ChapterId>('home');
  const { scrollYProgress } = useScroll({ target: page, offset: ['start start', 'end end'] });
  const { scrollYProgress: heroProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const copyY = useTransform(heroProgress, [0, 1], [0, reduced ? 0 : -70]);
  const copyOpacity = useTransform(heroProgress, [0, .55], [1, reduced ? 1 : 0]);
  const markReady = useCallback(() => setHeroReady(true), []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById(scrollRequest.section)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [scrollRequest, reduced]);
  useEffect(() => {
    // The arrival motion waits for the painting, but the words never wait longer than this.
    const timer = window.setTimeout(markReady, 2600);
    return () => window.clearTimeout(timer);
  }, [markReady]);
  useEffect(() => {
    const update = () => {
      const marker = innerHeight * .35;
      let current: HomeSection = 'home';
      let currentChapter: ChapterId = 'home';
      for (const { id } of chapters) {
        const section = document.getElementById(id);
        if (!section || section.getBoundingClientRect().top > marker) continue;
        currentChapter = id;
        if (id !== 'houses') current = id;
      }
      onSectionChange(current);
      setChapter(currentChapter);
    };
    let frame = 0;
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true }); update();
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [onSectionChange]);
  const jumpTo = (id: ChapterId) => {
    sound.playChime('page');
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  };
  const reveal = { initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 35 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .2 }, transition: { duration: reduced ? 0 : .8 } };

  // 도입부, 세계관, 기숙사, 시스템, 시간표 순서로 긴 이야기형 메인 페이지를 그린다.
  return <div className="wizard-home scroll-story nocturne-home" ref={page}>
    <motion.div className="story-reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    <ChapterRail current={chapter} onJump={jumpTo} />
    <section id="home" ref={hero} className="story-opening moonlit-hero" data-ready={heroReady ? 'true' : 'false'} aria-labelledby="hero-title">
      <HeroScene onReady={markReady} />
      <div className="moonlit-shade" aria-hidden="true" />
      <motion.div className="moonlit-copy" lang="en" style={{ y: copyY, opacity: copyOpacity }}>
        <div className="moonlit-title-wrap">
          <HeroFlourish />
          <h1 id="hero-title" className="moonlit-title"><span className="moonlit-title-line">Once Upon</span> <span className="moonlit-title-line moonlit-title-tail"><em>a</em> time.</span></h1>
        </div>
        <p className="moonlit-tagline"><span className="moonlit-tagline-first">A new story begins</span> <span>in Hogwarts</span></p>
        <TaglineDivider className="moonlit-divider" />
        <button type="button" className="moonlit-enter" onClick={() => { sound.playChime('lumos'); onNavigateToDirectory(); }}>
          <img className="moonlit-enter-frame" src={enterFrame} alt="" width={299} height={66} decoding="async" />
          <span>Enter the World</span>
          <ChevronRight aria-hidden="true" strokeWidth={1.4} />
        </button>
      </motion.div>
      <figure className="moonlit-epigraph">
        <StarRule className="moonlit-epigraph-rule" />
        <blockquote lang="en"><p>Magic is everywhere,<br />if you only believe.</p></blockquote>
      </figure>
      <a className="moonlit-scroll" href="#world" lang="en" onClick={event => { event.preventDefault(); jumpTo('world'); }}>
        <span>Scroll Down</span>
        <ScrollCue />
      </a>
    </section>
    <WorldChapter />
    <section id="houses" className="house-chapter story-section" aria-labelledby="houses-title">
      <motion.div {...reveal}><h2 id="houses-title">네 갈래의 영광</h2><p>서로 다른 이름, 하나의 전통. 네 기숙사의 시간이 호그와트에서 교차합니다.</p></motion.div>
      <div className="house-banners">{Object.values(HOUSES).map((house, i) => <motion.button key={house.id} data-house={house.id} className={`house-banner banner-${house.id}`} onClick={() => { sound.playChime('lumos'); onNavigateToDirectory(house.id); }} {...reveal} transition={{ duration: reduced ? 0 : .7, delay: reduced ? 0 : i * .1 }}><HouseEmblem house={house.id} className="banner-emblem" /><h3>{house.nameEn}</h3><span>{house.nameKo}</span><p>{house.values.join(' · ')}</p></motion.button>)}</div>
    </section>
    <section id="system" className="system-chapter story-section" aria-labelledby="system-title">
      <motion.div className="chapter-lead" {...reveal}><div><h2 id="system-title">함께 이야기를<br /><em>써 내려가는 방법.</em></h2><p>서로의 세계를 존중하며, 한 장씩 우리의 기록을 쌓아갑니다.</p></div></motion.div>
      <div className="system-ledger">{[
        { title: '한방의 교정', text: '야간 통행 금지 시간, 학교를 몰래 빠져나가 돌아다닐 수 있는 기회가 주어집니다. 충분한 과제를 통해 통행 허가증을 획득하거나 상점을 통해 구입할 수 있습니다.' },
        { title: '학생의 의무와 봉사', text: '주어지는 과제와 봉사 활동을 통해 학교생활에 참여해 보세요. 하루 최대 두 번, 지정된 일과 시간에 맞춰 활동 로그를 작성할 수 있습니다.' },
        { title: '호그와트의 시간표', text: '기상부터 수업, 자유 시간과 통금까지. 정해진 일과 시간표를 따르며 호그와트에서의 하루를 보내보세요.' },
        { title: '마법 생물과의 인연', text: '마법 생물 분양소를 통해 새로운 인연을 만들고, 다양한 반려동물 육성 기회를 제공합니다.' },
        { title: '호그스미드 통신 판매', text: '호그스미드에 위치 해 있는 상점과의 통신 판매를 통해 다양한 아이템을 구입할 수 있습니다. 상점은 정기적으로 새로운 상품을 업데이트합니다.' },
      ].map(entry => <motion.article key={entry.title} {...reveal}><h3>{entry.title}</h3><p>{entry.text}</p></motion.article>)}</div>
    </section>
    <section id="timetable" className="timetable-chapter story-section" aria-labelledby="timetable-title">
      <motion.div {...reveal}><h2 id="timetable-title">성의 시계가,<br />다음 이야기를 알릴 때.</h2><p className="schedule-intro">수업과 행사, 함께할 시간의 안내를 이곳에 기록합니다.</p><div className="schedule-notice"><span className="schedule-status">시간표 준비 중</span><h3>아직 펼쳐지지 않은 학사 일정</h3><p>수업 시간과 커뮤니티 행사 일정은 확정되는 대로 안내됩니다.<br />새로운 이야기가 시작될 시간을 조금만 기다려주세요.</p></div><button className="ink-link" onClick={() => { sound.playChime('lumos'); onNavigateToDirectory(); }}>기다리는 동안, 학생들의 이야기 만나기 <ArrowRight size={15} /></button></motion.div>
    </section>
    <footer className="archive-footer"><a href="#home" className="footer-wordmark">Once Upon a time...</a><p>Once upon a time, in a land far, far away...</p><span>Harry Potter original character community</span></footer>
  </div>;
}
