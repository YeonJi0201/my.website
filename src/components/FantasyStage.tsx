import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import castle from '../assets/images/utopia_castle_night_1791347657904.jpg';

// 옛 메인 무대 레이아웃에서 사용하는 성 배경·장식 레이어와 자식 콘텐츠 래퍼다.
export function FantasyStage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, reduced ? 0 : 230]);
  return <section className={`castle-stage ${className}`}>
    <motion.img src={castle} alt="" className="castle-backdrop" style={{ y }} />
    <div className="castle-shade" /><div className="drifting-mist" aria-hidden="true" />
    <div className="stage-border" aria-hidden="true" />
    <svg className="stone-tracery" viewBox="0 0 1400 1000" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M65 1000V425Q65 175 350 40Q635 175 635 425V1000M765 1000V425Q765 175 1050 40Q1335 175 1335 425V1000" />
        <path d="M90 1000V430Q90 200 350 65Q610 200 610 430V1000M790 1000V430Q790 200 1050 65Q1310 200 1310 430V1000" />
        <path d="M350 65V390M1050 65V390M90 430Q220 300 350 390Q480 300 610 430M790 430Q920 300 1050 390Q1180 300 1310 430" />
      </g>
    </svg>
    <div className="candle-field" aria-hidden="true">{[0,1,2,3,4,5].map(i => <span key={i} className={`floating-candle candle-${i}`}><i /></span>)}</div>
    {children}
  </section>;
}
