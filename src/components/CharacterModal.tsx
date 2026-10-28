import { CharacterPortrait } from './CharacterPortrait';
import { resolvePortrait } from '../utils/portraits';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Sparkles, Wand2, Shield, Image as ImageIcon } from 'lucide-react';
import { Character, HouseType } from '../types/character';
import { HOUSES } from '../data/houseData';
import { sound } from '../utils/audio';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterData: Character) => Promise<void>;
  initialCharacter?: Character | null;
  defaultHouse?: HouseType;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCharacter,
  defaultHouse = 'gryffindor',
}) => {
  const [nameKo, setNameKo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [house, setHouse] = useState<HouseType>(defaultHouse);
  const [gender, setGender] = useState('여성');
  const [age, setAge] = useState(16);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [year, setYear] = useState(6);
  const [birthday, setBirthday] = useState('10월 24일');
  const [bloodStatus, setBloodStatus] = useState<'순수혈통' | '혼혈' | '머글태생'>('혼혈');

  // Wand
  const [wandWood, setWandWood] = useState('마가목');
  const [wandCore, setWandCore] = useState('불사조 깃털');
  const [wandLength, setWandLength] = useState('11.5인치');
  const [wandFlex, setWandFlex] = useState('유연함');

  const [patronus, setPatronus] = useState('붉은 여우');
  const [boggart, setBoggart] = useState('소중한 이들의 상실');
  const [image, setImage] = useState('');
  const [portraitCrop, setPortraitCrop] = useState({ zoom: 1, x: 0, y: 0 });

  const [appearanceSummary, setAppearanceSummary] = useState('');
  const [appearanceDetail, setAppearanceDetail] = useState('');

  const [personalityInput, setPersonalityInput] = useState('용기, 정의로움, 온화함');
  const [personalityDetail, setPersonalityDetail] = useState('');

  const [background, setBackground] = useState('');
  const [quote, setQuote] = useState('');
  const [specialty, setSpecialty] = useState('어둠의 마법 방어술');
  const [positionOrClub, setPositionOrClub] = useState('');
  const [triviaInput, setTriviaInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Populate state when editing or opening
  useEffect(() => {
    setSaveError('');
    if (initialCharacter) {
      setNameKo(initialCharacter.nameKo);
      setNameEn(initialCharacter.nameEn);
      setHouse(initialCharacter.house);
      setGender(initialCharacter.gender);
      setAge(initialCharacter.age);
      setHeight(initialCharacter.height?.toString() || '');
      setWeight(initialCharacter.weight?.toString() || '');
      setYear(initialCharacter.year);
      setBirthday(initialCharacter.birthday);
      setBloodStatus(initialCharacter.bloodStatus);
      setWandWood(initialCharacter.wand.wood);
      setWandCore(initialCharacter.wand.core);
      setWandLength(initialCharacter.wand.length);
      setWandFlex(initialCharacter.wand.flexibility);
      setPatronus(initialCharacter.patronus);
      setBoggart(initialCharacter.boggart);
      setImage(initialCharacter.image);
      setPortraitCrop(initialCharacter.portraitCrop || { zoom: 1, x: 0, y: 0 });
      setAppearanceSummary(initialCharacter.appearanceSummary);
      setAppearanceDetail(initialCharacter.appearanceDetail);
      setPersonalityInput(initialCharacter.personality.join(', '));
      setPersonalityDetail(initialCharacter.personalityDetail);
      setBackground(initialCharacter.background);
      setQuote(initialCharacter.quote);
      setSpecialty(initialCharacter.specialty);
      setPositionOrClub(initialCharacter.positionOrClub || '');
      setTriviaInput((initialCharacter.trivia || []).join('\n'));
    } else {
      // Default placeholder
      setNameKo('');
      setNameEn('');
      setHouse(defaultHouse);
      setGender('여성');
      setAge(16);
      setHeight('');
      setWeight('');
      setYear(6);
      setBirthday('1월 1일');
      setBloodStatus('혼혈');
      setWandWood('주목');
      setWandCore('용의 심장줄');
      setWandLength('11.5인치');
      setWandFlex('단단함');
      setPatronus('은빛 매');
      setBoggart('어둠의 실패');
      setImage('/src/assets/images/portrait_gryffindor_oc_1791347670977.jpg');
      setPortraitCrop({ zoom: 1, x: 0, y: 0 });
      setAppearanceSummary('');
      setAppearanceDetail('');
      setPersonalityInput('용맹함, 따뜻한 마음, 직관적');
      setPersonalityDetail('');
      setBackground('');
      setQuote('');
      setSpecialty('어둠의 마법 방어술');
      setPositionOrClub('');
      setTriviaInput('');
    }
  }, [initialCharacter, defaultHouse, isOpen]);

  // Handle PNG Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImage(dataUrl);
        setPortraitCrop({ zoom: 1, x: 0, y: 0 });
        sound.playChime('sparkle');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!nameKo.trim()) {
      alert('캐릭터 한글 이름을 입력해주세요.');
      return;
    }

    const personalityArray = personalityInput
      .split(/[,/·]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const triviaArray = triviaInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const characterData: Character = {
      id: initialCharacter ? initialCharacter.id : `char-${Date.now()}`,
      nameKo: nameKo.trim(),
      nameEn: nameEn.trim() || nameKo.trim(),
      house,
      gender,
      age: Number(age) || 16,
      height: Number(height) > 0 ? Number(height) : undefined,
      weight: Number(weight) > 0 ? Number(weight) : undefined,
      year: Number(year) || 6,
      birthday: birthday.trim(),
      bloodStatus,
      wand: {
        wood: wandWood.trim(),
        core: wandCore.trim(),
        length: wandLength.trim(),
        flexibility: wandFlex.trim(),
      },
      patronus: patronus.trim(),
      boggart: boggart.trim(),
      portraitCrop,
      image: image || '/src/assets/images/portrait_gryffindor_oc_1791347670977.jpg',
      appearanceSummary: appearanceSummary.trim(),
      appearanceDetail: appearanceDetail.trim(),
      personality: personalityArray.length > 0 ? personalityArray : ['신비로움'],
      personalityDetail: personalityDetail.trim(),
      background: background.trim(),
      quote: quote.trim() || '"우리는 마법으로 연결되어 있어."',
      specialty: specialty.trim(),
      positionOrClub: positionOrClub.trim(),
      trivia: triviaArray,
      createdAt: initialCharacter ? initialCharacter.createdAt : Date.now(),
    };

    setSaving(true); setSaveError('');
    try { await onSave(characterData); sound.playChime('lumos'); onClose(); }
    catch (error) { setSaveError(error instanceof Error ? error.message : '저장하지 못했습니다.'); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#090d16] border border-[#d4a33e]/30 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#d4a33e]/20 flex items-center justify-between bg-[#0e1422]">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#f5d064]" />
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#f5f2eb]">
                {initialCharacter ? '캐릭터 프로필 수정' : '신규 캐릭터(OC) 등록'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#888] hover:text-[#fff] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form aria-busy={saving} onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {saveError && <p role="alert" className="admin-error">{saveError}</p>}
            {/* Top Grid: Portrait PNG Upload & Basic Bio */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Image PNG Preview & Upload */}
              <div className="md:col-span-4 flex flex-col items-center">
                <label className="text-xs font-cinzel font-bold text-[#d4a33e] uppercase mb-2 self-start">
                  Character Portrait (외관 PNG)
                </label>
                <div className="relative aspect-[4/5] w-full max-w-[240px] rounded-xl overflow-hidden border border-[#d4a33e]/30 bg-[#05070c] shadow-inner flex items-center justify-center">
                  {image ? (
                    <CharacterPortrait character={{ image, nameKo: nameKo || '크롭 미리보기', portraitCrop }} />
                  ) : (
                    <div className="text-center p-4 text-[#666]">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span className="text-xs">PNG 이미지를 등록해주세요</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-[240px] mt-3 py-2 px-3 rounded-lg text-xs font-semibold text-[#07090e] bg-gradient-to-r from-[#d4a33e] to-[#f5d064] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>외관 PNG 파일 업로드</span>
                </button>
                <fieldset className="crop-controls">
                  <legend>상반신 크롭 조정</legend>
                  <p>사진 구도에 맞춰 얼굴과 허리선이 보이도록 조절하세요.</p>
                  <label>확대 <output>{portraitCrop.zoom.toFixed(1)}배</output><input type="range" min="0.5" max="3" step="0.05" value={portraitCrop.zoom} onChange={e => setPortraitCrop(c => ({ ...c, zoom: Number(e.target.value) }))} /></label>
                  <label>좌우 위치<input type="range" min="-100" max="100" value={portraitCrop.x} onChange={e => setPortraitCrop(c => ({ ...c, x: Number(e.target.value) }))} /></label>
                  <label>상하 위치<input type="range" min="-100" max="100" value={portraitCrop.y} onChange={e => setPortraitCrop(c => ({ ...c, y: Number(e.target.value) }))} /></label>
                  <button type="button" onClick={() => setPortraitCrop({ zoom: 1, x: 0, y: 0 })}>자동 구도로 되돌리기</button>
                </fieldset>
              </div>

              {/* Right Column: Name & House & Basic Attributes */}
              <div className="md:col-span-8 space-y-4">
                {/* House Selection */}
                <div>
                  <label className="block text-xs font-cinzel font-bold text-[#d4a33e] uppercase mb-1.5">
                    Hogwarts House (기숙사 선택)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'] as HouseType[]).map((h) => {
                      const cfg = HOUSES[h];
                      const selected = house === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHouse(h)}
                          className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            selected
                              ? 'shadow-md brightness-110'
                              : 'opacity-60 hover:opacity-100 bg-[#0c121e]'
                          }`}
                          style={{
                            borderColor: cfg.colors.accent,
                            backgroundColor: selected ? `${cfg.colors.primary}99` : undefined,
                            color: selected ? '#fff' : cfg.colors.accent,
                          }}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{cfg.nameKo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className="block text-xs text-[#a19d94]">키 (cm)<input type="number" min="1" max="300" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder="미등록" className="w-full mt-2 p-2 border border-[#d4a33e]/30 bg-[#0c121e] text-[#e8e4dc]" /></label>
                    <label className="block text-xs text-[#a19d94]">몸무게 (kg)<input type="number" min="1" max="500" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="미등록" className="w-full mt-2 p-2 border border-[#d4a33e]/30 bg-[#0c121e] text-[#e8e4dc]" /></label>
                  </div>
                {/* Name Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">한글 이름 *</label>
                    <input
                      type="text"
                      required
                      value={nameKo}
                      onChange={(e) => setNameKo(e.target.value)}
                      placeholder="예: 발레리 애쉬우드"
                      className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-sm text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">영문 이름</label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="예: Valerie Ashwood"
                      className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-sm text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    />
                  </div>
                </div>

                {/* Gender, Age, Year, Blood */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">성별</label>
                    <input
                      type="text"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      placeholder="여성 / 남성"
                      className="w-full px-2.5 py-1.5 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">나이</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">학년</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}학년
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">혈통</label>
                    <select
                      value={bloodStatus}
                      onChange={(e) => setBloodStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    >
                      <option value="순수혈통">순수혈통</option>
                      <option value="혼혈">혼혈</option>
                      <option value="머글태생">머글태생</option>
                    </select>
                  </div>
                </div>

                {/* Birthday & Club/Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">생일</label>
                    <input
                      type="text"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      placeholder="예: 10월 24일"
                      className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a19d94] mb-1">동아리 / 퀴디치 직책</label>
                    <input
                      type="text"
                      value={positionOrClub}
                      onChange={(e) => setPositionOrClub(e.target.value)}
                      placeholder="예: 그리핀도르 퀴디치 추격꾼, 슬러그 클럽"
                      className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wand Information */}
            <div className="p-4 rounded-xl bg-[#0e1422] border border-[#d4a33e]/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-[#f5d064]">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Wand Information (지팡이 설정)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">목재 (Wood)</label>
                  <input
                    type="text"
                    value={wandWood}
                    onChange={(e) => setWandWood(e.target.value)}
                    placeholder="예: 주목, 마가목"
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">심 (Core)</label>
                  <input
                    type="text"
                    value={wandCore}
                    onChange={(e) => setWandCore(e.target.value)}
                    placeholder="예: 불사조 깃털, 용 심장줄"
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">길이 (Length)</label>
                  <input
                    type="text"
                    value={wandLength}
                    onChange={(e) => setWandLength(e.target.value)}
                    placeholder="예: 11.5인치"
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">유연성 (Flexibility)</label>
                  <input
                    type="text"
                    value={wandFlex}
                    onChange={(e) => setWandFlex(e.target.value)}
                    placeholder="예: 유연함, 단단함"
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  />
                </div>
              </div>
            </div>

            {/* Patronus, Boggart, Specialty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#a19d94] mb-1">패트로누스 (Patronus)</label>
                <input
                  type="text"
                  value={patronus}
                  onChange={(e) => setPatronus(e.target.value)}
                  placeholder="예: 붉은 여우, 은빛 매"
                  className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#a19d94] mb-1">보가트 (Boggart / 두려움)</label>
                <input
                  type="text"
                  value={boggart}
                  onChange={(e) => setBoggart(e.target.value)}
                  placeholder="예: 소중한 이들의 상실"
                  className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#a19d94] mb-1">특기 과목 (Specialty)</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="예: 어둠의 마법 방어술, 마법약학"
                  className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]"
                />
              </div>
            </div>

            {/* Representative Quote */}
            <div>
              <label className="block text-xs text-[#a19d94] mb-1">대표 대사 (Quote)</label>
              <input
                type="text"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder='예: "도망치지 마. 어둠이 짙을수록 우리가 밝혀야 할 루모스는 더 찬란해야 하니까."'
                className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]"
              />
            </div>

            {/* Appearance Summary & Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#a19d94] mb-1">외관 요약 (한 줄 묘사)</label>
                <input
                  type="text"
                  value={appearanceSummary}
                  onChange={(e) => setAppearanceSummary(e.target.value)}
                  placeholder="예: 붉은빛이 감도는 갈색 머리와 금빛 눈동자, 당당하고 곧은 자세."
                  className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#a19d94] mb-1">외관 상세 묘사 (키, 체형, 특징)</label>
                <textarea
                  rows={2}
                  value={appearanceDetail}
                  onChange={(e) => setAppearanceDetail(e.target.value)}
                  placeholder="예: 168cm의 늘씬한 체격. 망토 깃을 살짝 세워 입는 버릇..."
                  className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] resize-none"
                />
              </div>
            </div>

            {/* Personality Tags & Personality Detail */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#a19d94] mb-1">성격 키워드 (쉼표 구분)</label>
                <input
                  type="text"
                  value={personalityInput}
                  onChange={(e) => setPersonalityInput(e.target.value)}
                  placeholder="예: 의리파, 직선적인, 정의감, 승부욕"
                  className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#a19d94] mb-1">성격 상세 서술</label>
                <textarea
                  rows={3}
                  value={personalityDetail}
                  onChange={(e) => setPersonalityDetail(e.target.value)}
                  placeholder="캐릭터의 심리, 행동 양식, 타인을 대하는 태도 등..."
                  className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] resize-none"
                />
              </div>
            </div>

            {/* Background Story */}
            <div>
              <label className="block text-xs text-[#a19d94] mb-1">과거사 및 가문/성장 배경 (Background)</label>
              <textarea
                rows={3}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="가문의 유래, 호그와트 입학 계기, 인상 깊은 사건..."
                className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] resize-none"
              />
            </div>

            {/* Trivia / TMI (newline separated) */}
            <div>
              <label className="block text-xs text-[#a19d94] mb-1">기타 특징 / TMI (한 줄에 하나씩 입력)</label>
              <textarea
                rows={2}
                value={triviaInput}
                onChange={(e) => setTriviaInput(e.target.value)}
                placeholder="가장 좋아하는 간식은 호박 파이&#10;밤마다 천문탑을 바라보는 습관이 있음"
                className="w-full px-3 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#d4a33e]/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#aaa] hover:text-[#fff] hover:bg-white/5 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit" disabled={saving}
                className="px-6 py-2.5 rounded-lg text-xs font-bold text-[#07090e] bg-gradient-to-r from-[#e3b85d] via-[#f5d064] to-[#caa045] shadow-[0_0_15px_rgba(212,163,62,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {initialCharacter ? '수정 내용 저장' : '호그와트 명부에 등록'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
