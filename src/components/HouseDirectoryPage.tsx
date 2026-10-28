import { HouseEmblem } from './HouseEmblem';
import { CharacterPortrait } from './CharacterPortrait';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Shield, Sparkles, Filter, ArrowLeft } from 'lucide-react';
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

export const HouseDirectoryPage: React.FC<HouseDirectoryPageProps> = ({
  characters,
  selectedHouse,
  onSelectHouse,
  onSelectCharacter,
  onBackToHome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  // Filter characters
  const filteredCharacters = characters.filter((char) => {
    const matchesHouse = selectedHouse === 'all' || char.house === selectedHouse;
    const matchesYear = yearFilter === 'all' || char.year === yearFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      char.nameKo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.personality.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
      char.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesHouse && matchesYear && matchesSearch;
  });

  const activeHouseConfig = selectedHouse !== 'all' ? HOUSES[selectedHouse] : null;

  return (
    <div data-house={selectedHouse} className="house-directory relative min-h-[calc(100vh-4rem)] pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & House Selector */}
      <div className="pt-8 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => {
              sound.playChime('page');
              onBackToHome();
            }}
            className="flex items-center gap-2 text-sm text-[#a19d94] hover:text-[#f5d064] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>메인으로 돌아가기</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-[#8c887e]">
            <span>호그와트 재적 명부</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#d4a33e] font-semibold">{filteredCharacters.length}명의 학생 등록됨</span>
          </div>
        </div>

        {/* Directory Title with House Aura */}
        <motion.div
          key={selectedHouse}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="directory-heading text-center sm:text-left mb-8"
        >
          {activeHouseConfig && <HouseEmblem house={activeHouseConfig.id} className="directory-crest" />}<div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#d4a33e]" />
            <span className="font-cinzel text-xs tracking-widest text-[#d4a33e] uppercase">
              {activeHouseConfig ? activeHouseConfig.nameEn : 'All Hogwarts Houses'}
            </span>
          </div>

          <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f5f2eb]">
            {activeHouseConfig ? `${activeHouseConfig.nameKo} 명부` : '전체 기숙사 학생 명부'}
          </h2>

          <p className="mt-2 text-sm sm:text-base text-[#cfc9bc] font-garamond max-w-2xl">
            {activeHouseConfig
              ? `${activeHouseConfig.motto} — ${activeHouseConfig.values.join(' · ')}의 가치를 품은 학생들입니다.`
              : '그리핀도르, 슬리데린, 래번클로, 후플푸프의 모든 학생 프로필을 열람하고 탐색할 수 있습니다.'}
          </p>
        </motion.div>

        {/* House Navigation Tabs (Segmented Control conforming to skill guidelines) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#0a0f1a]/90 border border-[#d4a33e]/25 rounded-xl backdrop-blur-md overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              sound.playChime('page');
              onSelectHouse('all');
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedHouse === 'all'
                ? 'bg-gradient-to-r from-[#d4a33e]/30 to-[#f5d064]/20 text-[#f5d064] border border-[#d4a33e]/40 shadow-sm'
                : 'text-[#a19d94] hover:text-[#e8e4dc] hover:bg-[#141d2f]/50'
            }`}
          >
            전체 ({characters.length})
          </button>

          {(['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'] as HouseType[]).map((houseKey) => {
            const h = HOUSES[houseKey];
            const count = characters.filter((c) => c.house === houseKey).length;
            const isActive = selectedHouse === houseKey;

            return (
              <button
                key={houseKey}
                onClick={() => {
                  sound.playChime('sparkle');
                  onSelectHouse(houseKey);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border shadow-md'
                    : 'text-[#a19d94] hover:text-[#e8e4dc] hover:bg-[#141d2f]/50'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${h.colors.primary}44`,
                        borderColor: h.colors.accent,
                        color: h.colors.accent,
                        boxShadow: `0 0 15px ${h.colors.bgGlow}`,
                      }
                    : {}
                }
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{h.nameKo}</span>
                <span className="opacity-70 text-xs">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c887e]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 성격, 특기 검색..."
              className="w-full pl-9 pr-4 py-2 bg-[#0c121e]/80 border border-[#d4a33e]/20 rounded-lg text-sm text-[#e8e4dc] placeholder-[#666] focus:outline-none focus:border-[#d4a33e] focus:ring-1 focus:ring-[#d4a33e] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Year Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#a19d94]">
              <Filter className="w-3.5 h-3.5 text-[#d4a33e]" />
              <span>학년:</span>
              <select
                value={yearFilter}
                onChange={(e) =>
                  setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-[#0c121e] border border-[#d4a33e]/20 rounded px-2.5 py-1.5 text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
              >
                <option value="all">전체 학년</option>
                {[1, 2, 3, 4, 5, 6, 7].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}학년
                  </option>
                ))}
              </select>
            </div>


          </div>
        </div>
      </div>

      {/* Characters Gallery Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[#d4a33e]/20 rounded-2xl bg-[#0a0f1a]/40 backdrop-blur-sm">
          <Sparkles className="w-10 h-10 text-[#d4a33e]/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#e8e4dc] mb-1">조건에 맞는 캐릭터가 없습니다</h3>
          <p className="text-sm text-[#8c887e] mb-4">
            검색어나 학년, 기숙사 조건을 바꿔보세요.
          </p>

        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((char) => {
              const houseConfig = HOUSES[char.house];

              return (
                <motion.div
                  key={char.id}
                  data-house={char.house}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                  whileHover={{ y: -6 }}
                  onClick={() => {
                    onSelectCharacter(char.id);
                  }}
                  className="house-student-card group relative bg-[#0a0f1a]/90 rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col justify-between"
                  style={{
                    borderColor: `${houseConfig.colors.accent}40`,
                    boxShadow: `0 8px 30px rgba(0, 0, 0, 0.6)`,
                  }}
                >
                  {/* House Aura Accent on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at top right, ${houseConfig.colors.bgGlow}, transparent 70%)`,
                    }}
                  />

                  {/* Character Portrait View (PNG / Image) */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#07090e]">
                    <CharacterPortrait character={char} />
                    {/* Gradient scrim for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/30 to-transparent" />

                    {/* House Crest Corner Watermark */}
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-cinzel font-bold tracking-wider backdrop-blur-md shadow"
                      style={{
                        backgroundColor: `${houseConfig.colors.primary}cc`,
                        color: '#fff',
                        border: `1px solid ${houseConfig.colors.accent}55`,
                      }}
                    >
                      <HouseEmblem house={char.house} />{houseConfig.nameEn}
                    </div>

                    {/* Bottom overlay with quick quote */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-xs text-[#cfc9bc] italic font-garamond line-clamp-1 drop-shadow">
                        {char.quote}
                      </p>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
                      <div className="flex items-center gap-2 text-xs text-[#a19d94] mb-1 font-garamond">
                        <span>{char.year}학년</span>
                        <span aria-hidden="true">·</span>
                        <span>{char.gender}</span>
                        <span aria-hidden="true">·</span>
                        <span>{char.bloodStatus}</span>
                      </div>

                      {/* Character Name */}
                      <h3 className="text-xl font-bold text-[#f5f2eb] group-hover:text-[#f5d064] transition-colors flex items-baseline gap-2">
                        <span>{char.nameKo}</span>
                        <span className="font-cinzel text-xs font-normal text-[#8c887e]">
                          {char.nameEn}
                        </span>
                      </h3>

                      {/* Personality keywords (clean unboxed with separators) */}
                      <div className="mt-2.5 text-xs text-[#d4a33e]/90 font-medium">
                        {char.personality.slice(0, 3).join(' · ')}
                      </div>

                      {/* Specialty / Club */}
                      <p className="mt-2 text-xs text-[#9a968d] line-clamp-2 leading-relaxed">
                        {char.appearanceSummary}
                      </p>
                    </div>

                    {/* Card Footer / Click Affordance */}
                    <div className="mt-4 pt-3 border-t border-[#d4a33e]/15 flex items-center justify-between text-xs text-[#a19d94] group-hover:text-[#f5d064] transition-colors">
                      <span className="font-garamond">
                        지팡이: {char.wand.wood}
                      </span>
                      <span className="font-semibold flex items-center gap-1">
                        프로필 보기 →
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
