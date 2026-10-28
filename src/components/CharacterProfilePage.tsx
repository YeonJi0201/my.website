import { HouseEmblem } from './HouseEmblem';
import { CharacterPortrait } from './CharacterPortrait';
import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, X, Maximize2 } from 'lucide-react';
import { Character } from '../types/character';
import { HOUSES } from '../data/houseData';
import { resolvePortrait } from '../utils/portraits';
import { FantasyStage } from './FantasyStage';

interface CharacterProfilePageProps {
  character: Character;
  allCharacters: Character[];
  onBackToDirectory: () => void;
  onSelectCharacter: (id: string) => void;
}
export const CharacterProfilePage: React.FC<CharacterProfilePageProps> = ({ character, allCharacters, onBackToDirectory, onSelectCharacter }) => {
  const [zoom, setZoom] = useState(false);
  const reducedMotion = useReducedMotion();
  const house = HOUSES[character.house];
  return <div className="wizard-home character-chronicle" data-house={character.house}>
    <FantasyStage className="profile-stage cinematic-profile">
      <div className="profile-toolbar">
        <button onClick={onBackToDirectory}><ArrowLeft size={15} /> 기숙사 명부</button>
        <span className="small-caps">Once Upon a time... · 인물 기록</span>

      </div>
      <div className="cinematic-house-name" aria-hidden="true">{house.nameEn}</div>
      <nav className="house-selection-rail" aria-label="소개할 기숙사 선택">
        {Object.values(HOUSES).map(h => {
          const first = allCharacters.find(c => c.house === h.id);
          return <button key={h.id} data-house={h.id} className={character.house === h.id ? 'is-current' : ''} aria-current={character.house === h.id ? 'true' : undefined} disabled={!first} onClick={() => first && onSelectCharacter(first.id)}><HouseEmblem house={h.id} /><span>{h.nameKo}</span></button>;
        })}
      </nav>
      <div className="portrait-composition profile-composition">
        <motion.aside key={`identity-${character.id}`} className="profile-identity" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .7 }}>
          <div className="profile-house-heading"><HouseEmblem house={character.house} /><span className="small-caps">{house.nameEn}<br />{house.values.slice(0, 2).join(' · ')} · {character.year}학년</span></div>
          <h1>{character.nameKo}</h1><p className="identity-english">{character.nameEn}</p>
          <div className="identity-rule" />
          <dl className="identity-facts">
            <div><dt>키</dt><dd>{character.height ? `${character.height} cm` : '미등록'}</dd></div>
            <div><dt>나이</dt><dd>{character.age}세</dd></div>
            <div><dt>몸무게</dt><dd>{character.weight ? `${character.weight} kg` : '미등록'}</dd></div>
            <div><dt>혈통</dt><dd>{character.bloodStatus}</dd></div>
          </dl>
          <p className="identity-addendum">{character.gender} · {character.birthday}<br />{character.positionOrClub}</p>
        </motion.aside>
        <motion.div key={`portrait-${character.id}`} className="center-portrait profile-center" initial={{ opacity: 0, x: reducedMotion ? 0 : 35 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .8, ease: [0.16, 1, 0.3, 1] }}>
          <div className="portrait-halo" aria-hidden="true" /><HouseEmblem house={character.house} className="profile-crest-watermark" />
          <button className="enchanted-frame" onClick={() => setZoom(true)} aria-label={`${character.nameKo} 이미지 확대`}>
            <CharacterPortrait character={character} />
            <span className="portrait-invitation"><Maximize2 size={13} /> 초상화 확대</span>
          </button>
          
        </motion.div>
        <motion.aside key={`personality-${character.id}`} className="profile-personality" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .7, delay: reducedMotion ? 0 : .1 }}>
          <span className="small-caps">PERSONALITY · 성격</span><h2>그 마음의 결</h2>
          <p className="personality-keywords">{character.personality.join(' · ')}</p>
          <p className="personality-prose">{character.personalityDetail || '아직 기록되지 않은 이야기입니다.'}</p>
          <blockquote>{character.quote}</blockquote>
        </motion.aside>
      </div>
    </FantasyStage>
    <section className="character-notes" aria-label="캐릭터 상세 기록">
      <div className="notes-heading"><span className="small-caps">BEYOND THE PORTRAIT</span><h2>책갈피 사이의 기록</h2></div>
      <div className="notes-columns">
        <article><h3>지팡이와 마법</h3><dl><dt>지팡이</dt><dd>{character.wand.wood} · {character.wand.core}<br />{character.wand.length} · {character.wand.flexibility}</dd><dt>특기</dt><dd>{character.specialty}</dd><dt>패트로누스</dt><dd>{character.patronus}</dd><dt>보가트</dt><dd>{character.boggart}</dd></dl></article>
        <article><h3>지나온 이야기</h3><p>{character.background || '아직 기록되지 않았습니다.'}</p><h3>외형</h3><p>{character.appearanceDetail}</p></article>
        <article><h3>작은 비밀들</h3><ul>{character.trivia.map((item, i) => <li key={i}>{item}</li>)}</ul></article>
      </div>
    </section>
    <AnimatePresence>{zoom && <motion.div className="portrait-lightbox" role="dialog" aria-modal="true" aria-label="캐릭터 초상화" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(false)} onKeyDown={e => { if (e.key === 'Escape') setZoom(false); }}><button autoFocus onClick={() => setZoom(false)} aria-label="닫기"><X /></button><img src={resolvePortrait(character.image)} alt={character.nameKo} /></motion.div>}</AnimatePresence>
  </div>;
};
