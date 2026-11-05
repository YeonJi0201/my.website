// Hand-set linework for the home hero and header. Coordinates follow the approved comp (1672 × 941).

// 반복해서 쓰는 SVG 반짝임 도형과 장식 요소를 아래 그림 구성에서 공유한다.
const SPARK = 'M0-7C.55-1.05 1.05-.55 7 0 1.05.55.55 1.05 0 7-.55 1.05-1.05.55-7 0-1.05-.55-.55-1.05 0-7Z';

export function Sparkle({ className }: { className?: string }) {
  return <svg className={className} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false"><path d={SPARK} fill="currentColor" /></svg>;
}

function Glint({ x, y, size = 1, flare = 0 }: { x: number; y: number; size?: number; flare?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <g className="flourish-glint">
      <circle r="9" fill="url(#hero-glint-halo)" />
      {flare > 0 && <path d={`M${-flare} 0H${flare}`} stroke="url(#hero-glint-flare)" strokeWidth=".7" />}
      <path d={SPARK} fill="#fff3d8" />
    </g>
  </g>;
}

const ray = (length: number, width: number, angle: number, key: string) => <g key={key} transform={`rotate(${angle})`}>
  <path d={`M0 0-${width}-5 0-${length}Z`} fill="#f4e4c0" />
  <path d={`M0 0 ${width}-5 0-${length}Z`} fill="#b18c56" />
</g>;

export function HeroFlourish() {
  // 메인 타이틀 주위의 궤도, 나침반 별과 반짝임을 벡터로 그린다.
  return <svg className="hero-flourish" viewBox="80 220 600 290" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="hero-swirl" gradientUnits="userSpaceOnUse" x1="140" y1="450" x2="620" y2="270">
        <stop offset="0" stopColor="#ecd3a0" stopOpacity=".95" />
        <stop offset=".32" stopColor="#c9a96b" stopOpacity=".5" />
        <stop offset=".62" stopColor="#c9a96b" stopOpacity=".38" />
        <stop offset="1" stopColor="#f0d9a8" stopOpacity=".9" />
      </linearGradient>
      <linearGradient id="hero-glint-flare">
        <stop offset="0" stopColor="#f3dcae" stopOpacity="0" />
        <stop offset=".5" stopColor="#fff1d0" stopOpacity=".9" />
        <stop offset="1" stopColor="#f3dcae" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="hero-star-flare" gradientUnits="userSpaceOnUse" x1="296" y1="0" x2="514" y2="0">
        <stop offset="0" stopColor="#d8bd86" stopOpacity="0" />
        <stop offset=".5" stopColor="#f2dcac" stopOpacity=".75" />
        <stop offset="1" stopColor="#d8bd86" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="hero-star-rise" gradientUnits="userSpaceOnUse" x1="0" y1="-52" x2="0" y2="54">
        <stop offset="0" stopColor="#e4cb94" stopOpacity="0" />
        <stop offset=".5" stopColor="#f2dcac" stopOpacity=".8" />
        <stop offset="1" stopColor="#e4cb94" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="hero-glint-halo">
        <stop offset="0" stopColor="#ffe6b3" stopOpacity=".55" />
        <stop offset="1" stopColor="#ffe6b3" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse className="flourish-swirl" cx="372.6" cy="364.2" rx="227" ry="84" transform="rotate(-16.3 372.6 364.2)" fill="none" stroke="url(#hero-swirl)" strokeWidth="1.25" pathLength="1" />
    <path className="flourish-tail" d="M156 424C139 437 121 450 109 460 104 465 100 471 97 478" fill="none" stroke="#d9bd86" strokeOpacity=".7" strokeWidth=".9" pathLength="1" />
    <path d="M296 263.5H514" stroke="url(#hero-star-flare)" strokeWidth=".8" />
    <g transform="translate(405 264)">
      <g className="flourish-compass">
        <path d="M0-52V54" stroke="url(#hero-star-rise)" strokeWidth=".7" />
        <circle r="25" fill="none" stroke="#c9a96b" strokeOpacity=".3" strokeWidth=".7" />
        <circle r="10" fill="url(#hero-glint-halo)" opacity=".7" />
        {Array.from({ length: 16 }, (_, i) => <path key={i} d="M0-19.5V-22.5" transform={`rotate(${i * 22.5})`} stroke="#c9a96b" strokeOpacity={i % 2 ? .35 : .55} strokeWidth=".8" />)}
        {[45, 135, 225, 315].map(angle => ray(31, 1.7, angle, `d${angle}`))}
        {[0, 90, 180, 270].map(angle => ray(angle === 180 ? 37 : angle === 0 ? 30 : 31, 2.6, angle, `m${angle}`))}
        <circle r="2" fill="#fff4dc" />
      </g>
    </g>
    <Glint x={156} y={424} size={1.05} flare={16} />
    <Glint x={109} y={460} size={.8} />
    <Glint x={590} y={307} size={.9} flare={12} />
    <Glint x={500} y={258} size={.45} />
    <Glint x={186} y={455} size={.4} />
  </svg>;
}

export function TaglineDivider({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 166 14" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth=".9">
      <path d="M0 7H61M105 7H166" strokeOpacity=".55" />
      <circle cx="65.5" cy="7" r="2.5" />
      <circle cx="100.5" cy="7" r="2.5" />
      <path d="M69 7h5.5M91.5 7H97M75 4.2l2.6 2.8L75 9.8M91 4.2 88.4 7 91 9.8" />
    </g>
    <path d="M83 .8 85.6 7 83 13.2 80.4 7Z" fill="currentColor" />
  </svg>;
}

export function StarRule({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 186 14" aria-hidden="true" focusable="false">
    <path d="M2 7H82M104 7H180" stroke="currentColor" strokeOpacity=".55" strokeWidth=".9" />
    <circle cx="2" cy="7" r="1.2" fill="currentColor" fillOpacity=".7" />
    <path d="M180 4.6 184.5 7 180 9.4 175.5 7Z" fill="none" stroke="currentColor" strokeWidth=".8" />
    <path transform="translate(93 7)" d={SPARK} fill="currentColor" />
  </svg>;
}

export function ScrollCue() {
  return <svg className="hero-scroll-cue" viewBox="0 0 14 72" aria-hidden="true" focusable="false">
    <circle cx="7" cy="3" r="2" fill="none" stroke="currentColor" strokeWidth=".8" />
    <path d="M7 5.5V70" stroke="currentColor" strokeOpacity=".6" strokeWidth=".9" />
    <path className="scroll-cue-glint" d="M7 8V20" stroke="#fff0cd" strokeWidth="1.2" strokeLinecap="round" />
    <path transform="translate(7 45) scale(.95)" d={SPARK} fill="currentColor" />
  </svg>;
}

export function HeaderMark() {
  return <svg className="site-rule-mark" viewBox="0 0 70 20" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth=".9">
      <path d="M9 10 13.5 6.6 18 10 13.5 13.4ZM52 10 56.5 6.6 61 10 56.5 13.4Z" />
      <path d="M22 7.4 24.6 10 22 12.6M48 7.4 45.4 10 48 12.6M18 10h3.5M48.5 10H52" />
    </g>
    <path transform="translate(35 10) scale(1.3)" d={SPARK} fill="currentColor" />
    <path d="M35 8.4 36.2 10 35 11.6 33.8 10Z" fill="#141518" />
  </svg>;
}
