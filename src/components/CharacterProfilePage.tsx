import { HouseEmblem } from './HouseEmblem';
import { CharacterPortrait } from './CharacterPortrait';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, X, Maximize2 } from 'lucide-react';
import { Character } from '../types/character';
import { HOUSES } from '../data/houseData';
import { resolvePortrait } from '../utils/portraits';

interface CharacterProfilePageProps {
  character: Character;
  onBackToDirectory: () => void;
}
export const CharacterProfilePage: React.FC<CharacterProfilePageProps> = ({ character, onBackToDirectory }) => {
  // 확대 이미지 모달의 스크롤 잠금과 키보드 포커스 복귀를 관리한다.
  const [zoom, setZoom] = useState(false);
  const zoomTrigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const house = HOUSES[character.house];
  useEffect(() => {
    if (!zoom) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; zoomTrigger.current?.focus(); };
  }, [zoom]);
  return <div className="wizard-home character-chronicle parchment-profile" data-house={character.house}>
    {/* 기숙사 이동, 기본 인적 사항, 초상화, 성격과 상세 기록 */}
    <section className="dossier-stage" aria-label="학생 인물 기록">
      <div className="profile-toolbar">
        <button onClick={onBackToDirectory}><ArrowLeft size={15} /> 기숙사 명부</button>
      </div>
      <div className="dossier-composition">
        <motion.aside key={`identity-${character.id}`} className="profile-identity" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .7 }}>
          <div className="profile-house-heading"><HouseEmblem house={character.house} decorative /><span>{house.nameKo} · {character.year}학년</span></div>
          <h1>{character.nameKo}</h1><p className="identity-english">{character.nameEn}</p>
          <div className="identity-rule" />
          <dl className="identity-facts">
            <div><dt>Height</dt><dd>{character.height ? `${character.height} cm` : '?'}</dd></div>
            <div><dt>Age</dt><dd>{character.age} years old</dd></div>
            <div><dt>Weight</dt><dd>{character.weight ? `${character.weight} kg` : '?'}</dd></div>
            <div><dt>Blood</dt><dd>{character.bloodStatus}</dd></div>
          </dl>
          <p className="identity-addendum">{character.gender} · {character.birthday}<br />{character.positionOrClub}</p>
        </motion.aside>
        <motion.div key={`portrait-${character.id}`} className="center-portrait profile-center" initial={{ opacity: 0, x: reducedMotion ? 0 : 35 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .8, ease: [0.16, 1, 0.3, 1] }}>
          <button ref={zoomTrigger} className="enchanted-frame" onClick={() => setZoom(true)} aria-label={`${character.nameKo} 이미지 확대`}>
            <CharacterPortrait character={character} />
            <span className="portrait-invitation"><Maximize2 size={13} /> 초상화 확대</span>
          </button>
        </motion.div>
        <motion.aside key={`personality-${character.id}`} className="profile-personality" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .7, delay: reducedMotion ? 0 : .1 }}>
          <h2>그 마음의 결</h2>
          <p className="personality-keywords">{character.personality.join(' · ')}</p>
          <p className="personality-prose">{character.personalityDetail || '아직 기록되지 않은 이야기입니다.'}</p>
          <blockquote>{character.quote}</blockquote>
        </motion.aside>
      </div>
    </section>
    <section className="character-notes" aria-label="캐릭터 상세 기록">
      <div className="notes-heading"><h2>책갈피 사이의 기록</h2></div>
      <div className="notes-columns">
        <article>
          <h3>지팡이</h3>
          <dl>
            <dt>목재</dt><dd>{character.wand.wood}</dd>
            <dt>심</dt><dd>{character.wand.core}</dd>
            <dt>길이</dt><dd>{character.wand.length}</dd>
            <dt>유연함</dt><dd>{character.wand.flexibility}</dd>
          </dl>
        </article>
        <article><h3>지나온 이야기</h3><p>{character.background || '아직 기록되지 않았습니다.'}</p><h3>외형</h3><p>{character.appearanceDetail}</p></article>
        <article><h3>작은 비밀들</h3><ul>{character.trivia.map((item, i) => <li key={i}>{item}</li>)}</ul></article>
      </div>
    </section>
    <footer className="dossier-colophon"><button onClick={onBackToDirectory}><ArrowLeft size={14} /> 명부로 돌아가기</button></footer>
    {/* 초상화 확대 보기와 Escape·Tab 키보드 조작 */}
    <AnimatePresence>{zoom && <motion.div className="portrait-lightbox" role="dialog" aria-modal="true" aria-label="캐릭터 초상화" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(false)} onKeyDown={e => { if (e.key === 'Escape') setZoom(false); if (e.key === 'Tab') { e.preventDefault(); closeButton.current?.focus(); } }}><button ref={closeButton} onClick={() => setZoom(false)} aria-label="닫기"><X /></button><img src={resolvePortrait(character.image)} alt={character.nameKo} /></motion.div>}</AnimatePresence>
  </div>;
};
