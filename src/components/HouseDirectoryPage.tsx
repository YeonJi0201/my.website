import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowLeft, Search } from 'lucide-react';
import { HouseEmblem } from './HouseEmblem';
import { CharacterPortrait } from './CharacterPortrait';
import { Character, HouseType } from '../types/character';
import { HOUSES } from '../data/houseData';
import { sound } from '../utils/audio';

interface HouseDirectoryPageProps {
  characters: Character[];
  selectedHouse: HouseType | 'all';
  onSelectHouse: (house: HouseType | 'all') => void;
  onSelectCharacter: (characterId: string) => void;
  onBackToHome: () => void;
}

const houseOrder: HouseType[] = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];

export const HouseDirectoryPage: React.FC<HouseDirectoryPageProps> = ({
  characters,
  selectedHouse,
  onSelectHouse,
  onSelectCharacter,
  onBackToHome,
}) => {
  // 선택 기숙사·학년·검색어를 조합해 명부 항목을 필터링한다.
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'all' | 'other'>('all');
  const reduced = useReducedMotion();

  const query = searchTerm.trim().toLowerCase();
  const filteredCharacters = characters.filter((char) => {
    const matchesHouse = selectedHouse === 'all' || char.house === selectedHouse;
    const matchesYear = yearFilter === 'all' || (yearFilter === 'other' ? ![1, 4, 7].includes(char.year) : char.year === yearFilter);
    const matchesSearch =
      query === '' ||
      char.nameKo.toLowerCase().includes(query) ||
      char.nameEn.toLowerCase().includes(query) ||
      char.personality.some((p) => p.toLowerCase().includes(query)) ||
      char.specialty.toLowerCase().includes(query);
    return matchesHouse && matchesYear && matchesSearch;
  });

  const activeHouse = selectedHouse !== 'all' ? HOUSES[selectedHouse] : null;
  const chooseHouse = (house: HouseType | 'all') => {
    if (house === selectedHouse) return;
    sound.playChime(house === 'all' ? 'page' : 'sparkle');
    onSelectHouse(house);
  };
  const resetFilters = () => {
    setSearchTerm('');
    setYearFilter('all');
    chooseHouse('all');
  };

  // 기숙사 선택, 검색과 학년 필터, 결과 카드 및 빈 검색 결과를 렌더링한다.
  return (
    <div data-house={selectedHouse} className="roster">
      <button type="button" className="roster-back" onClick={() => { sound.playChime('page'); onBackToHome(); }}>
        <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
        메인으로
      </button>

      <div className="roster-head">
        <div className="roster-heading">
          <h1>{activeHouse ? `${activeHouse.nameKo} 명부` : '전체 기숙사 학생 명부'}</h1>
          <p>
            {activeHouse
              ? `${activeHouse.motto} — ${activeHouse.values.join(' · ')}의 가치를 품은 학생들입니다.`
              : '그리핀도르, 슬리데린, 래번클로, 후플푸프의 모든 학생 프로필을 열람하고 탐색할 수 있습니다.'}
          </p>
        </div>
        {activeHouse && <HouseEmblem house={activeHouse.id} className="roster-crest" />}
      </div>

      <div className="roster-controls">
        <div className="roster-houses" role="group" aria-label="기숙사로 보기">
          <button type="button" aria-pressed={selectedHouse === 'all'} onClick={() => chooseHouse('all')}>
            전체 <span className="roster-tally">{characters.length}</span>
          </button>
          {houseOrder.map((houseKey) => (
            <button key={houseKey} type="button" data-house={houseKey} aria-pressed={selectedHouse === houseKey} onClick={() => chooseHouse(houseKey)}>
              {HOUSES[houseKey].nameKo} <span className="roster-tally">{characters.filter((c) => c.house === houseKey).length}</span>
            </button>
          ))}
        </div>
        <div className="roster-finders">
          <label className="roster-search">
            <Search size={15} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">학생 찾기</span>
            <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="이름, 성격, 특기로 찾기" />
          </label>
          <label className="roster-year">
            <span>학년</span>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value === 'all' || e.target.value === 'other' ? e.target.value : Number(e.target.value))}>
              <option value="all">전체</option>
              {[1, 4, 7].map((yr) => <option key={yr} value={yr}>{yr}학년</option>)}
              <option value="other">그 외</option>
            </select>
          </label>
        </div>
      </div>

      <p className="roster-count" aria-live="polite">{filteredCharacters.length}명</p>

      {filteredCharacters.length === 0 ? (
        <div className="roster-empty">
          <p>조건에 맞는 학생이 없습니다.</p>
          <p>검색어나 학년, 기숙사 조건을 바꿔보세요.</p>
          <button type="button" onClick={resetFilters}>조건 초기화</button>
        </div>
      ) : (
        <motion.ul layout={!reduced} className="roster-grid">
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((char) => {
              const house = HOUSES[char.house];
              return (
                <motion.li
                  key={char.id}
                  layout={!reduced}
                  data-house={char.house}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.3 }}
                >
                  <button type="button" className="roster-entry" onClick={() => onSelectCharacter(char.id)}>
                    <span className="roster-portrait"><CharacterPortrait character={char} /></span>
                    <span className="roster-house"><HouseEmblem house={char.house} decorative />{house.nameKo} · {char.year}학년</span>
                    <span className="roster-name">{char.nameKo}</span>
                    <span className="roster-name-en" lang="en">{char.nameEn}</span>
                    <span className="roster-traits">{char.personality.slice(0, 3).join(' · ')}</span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
};
