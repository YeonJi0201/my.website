import { MAX_IMAGE_BYTES } from '../utils/image-limits';
import { characterErrors } from '../utils/character-validation';
import { CharacterPortrait } from './CharacterPortrait';
import { resolvePortrait } from '../utils/portraits';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Sparkles, Wand2, Shield, Image as ImageIcon } from 'lucide-react';
import { Character, HouseType } from '../types/character';
import { HOUSES } from '../data/houseData';
import { WAND_WOODS, WAND_CORES, WAND_LENGTHS, WAND_FLEXIBILITIES } from '../data/wand-options';
import { sound } from '../utils/audio';
import { birthdayDays, parseBirthday, WEEKDAYS } from '../utils/registration-fields';

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
  // 폼 입력값을 캐릭터 데이터 필드와 일대일로 보관한다.
  const [nameKo, setNameKo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const errorMessageRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (saveError) { errorMessageRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); errorMessageRef.current?.focus({ preventScroll: true }); } }, [saveError]);
  const [nameEn, setNameEn] = useState('');
  const [house, setHouse] = useState<HouseType>(defaultHouse);
  const [gender, setGender] = useState('여성');
  const [age, setAge] = useState(16);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [year, setYear] = useState(1);
  const [birthdayMonth, setBirthdayMonth] = useState(1);
  const [birthdayDay, setBirthdayDay] = useState(1);
  const [birthdayWeekday, setBirthdayWeekday] = useState('');
  const [bloodStatus, setBloodStatus] = useState<'순수혈통' | '혼혈' | '머글태생'>('혼혈');

  // 지팡이와 마법 설정 입력값
  const [wandWood, setWandWood] = useState('마가목');
  const [wandCore, setWandCore] = useState('불사조의 깃털');
  const [wandLength, setWandLength] = useState('11인치');
  const [wandFlex, setWandFlex] = useState('단단함');

  const [image, setImage] = useState('');
  const [portraitCrop, setPortraitCrop] = useState({ zoom: 1, x: 0, y: 0 });

  const [appearanceSummary, setAppearanceSummary] = useState('');
  const [appearanceDetail, setAppearanceDetail] = useState('');

  const [personalityInput, setPersonalityInput] = useState('용기, 정의로움, 온화함');
  const [personalityDetail, setPersonalityDetail] = useState('');

  const [background, setBackground] = useState('');
  const [quote, setQuote] = useState('');
  const [positionOrClub, setPositionOrClub] = useState('');
  const [triviaInput, setTriviaInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 편집 대상 또는 새 캐릭터의 기본값으로 폼 상태를 초기화한다.
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
      const birthday = parseBirthday(initialCharacter.birthday);
      setBirthdayMonth(birthday.month);
      setBirthdayDay(birthday.day);
      setBirthdayWeekday(birthday.weekday);
      setBloodStatus(initialCharacter.bloodStatus);
      setWandWood(initialCharacter.wand.wood);
      setWandCore(initialCharacter.wand.core);
      setWandLength(initialCharacter.wand.length);
      setWandFlex(initialCharacter.wand.flexibility);
      setImage(initialCharacter.image);
      setPortraitCrop(initialCharacter.portraitCrop || { zoom: 1, x: 0, y: 0 });
      setAppearanceSummary(initialCharacter.appearanceSummary);
      setAppearanceDetail(initialCharacter.appearanceDetail);
      setPersonalityInput(initialCharacter.personality.join(', '));
      setPersonalityDetail(initialCharacter.personalityDetail);
      setBackground(initialCharacter.background);
      setQuote(initialCharacter.quote);
      setPositionOrClub(initialCharacter.positionOrClub || '');
      setTriviaInput((initialCharacter.trivia || []).join('\n'));
    } else {
      // 신규 등록용 기본값
      setNameKo('');
      setNameEn('');
      setHouse(defaultHouse);
      setGender('여성');
      setAge(16);
      setHeight('');
      setWeight('');
      setYear(1);
      setBirthdayMonth(1);
      setBirthdayDay(1);
      setBirthdayWeekday('');
      setBloodStatus('혼혈');
      setWandWood('주목');
      setWandCore('용의 심근');
      setWandLength('11인치');
      setWandFlex('단단함');
      setImage('/src/assets/images/portrait_gryffindor_oc_1791347670977.jpg');
      setPortraitCrop({ zoom: 1, x: 0, y: 0 });
      setAppearanceSummary('');
      setAppearanceDetail('');
      setPersonalityInput('용맹함, 따뜻한 마음, 직관적');
      setPersonalityDetail('');
      setBackground('');
      setQuote('');
      setPositionOrClub('');
      setTriviaInput('');
    }
  }, [initialCharacter, defaultHouse, isOpen]);

  // 선택한 이미지를 미리보기 가능한 데이터 URL로 읽고 크롭 설정을 초기화한다.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png' || file.size > MAX_IMAGE_BYTES) {
      setSaveError('캐릭터 이미지: 20MB 이하의 PNG 파일을 선택해주세요.');
      e.target.value = '';
      return;
    }
    setSaveError('');
    const reader = new FileReader();
    reader.onerror = () => setSaveError('이미지 파일을 읽지 못했습니다. 파일을 다시 선택해주세요.');
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

  // 입력 문자열을 목록 데이터로 정리하고 저장 성공·실패와 중복 제출을 처리한다.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!nameKo.trim()) {
      setSaveError('캐릭터 한글 이름을 입력해주세요.');
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
      year,
      birthday: `${birthdayMonth}월 ${birthdayDay}일${birthdayWeekday ? ` (${birthdayWeekday})` : ''}`,
      bloodStatus,
      wand: {
        wood: wandWood.trim(),
        core: wandCore.trim(),
        length: wandLength.trim(),
        flexibility: wandFlex.trim(),
      },
      portraitCrop,
      imageOriginal: image === initialCharacter?.image ? initialCharacter.imageOriginal : undefined,
      imageThumbnail: image === initialCharacter?.image ? initialCharacter.imageThumbnail : undefined,
      image: image || '/src/assets/images/portrait_gryffindor_oc_1791347670977.jpg',
      appearanceSummary: appearanceSummary.trim(),
      appearanceDetail: appearanceDetail.trim(),
      personality: personalityArray.length > 0 ? personalityArray : ['신비로움'],
      personalityDetail: personalityDetail.trim(),
      background: background.trim(),
      quote: quote.trim() || '"우리는 마법으로 연결되어 있어."',
      positionOrClub: positionOrClub.trim(),
      trivia: triviaArray,
      createdAt: initialCharacter ? initialCharacter.createdAt : Date.now(),
    };

    const errors = characterErrors(characterData);
    if (errors.length) { setSaveError(errors.join('\n')); return; }
    setSaving(true); setSaveError('');
    try { await onSave(characterData); sound.playChime('lumos'); onClose(); }
    catch (error) { setSaveError(error instanceof Error ? error.message : '저장하지 못했습니다.'); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  // 이미지 크롭, 기본 정보, 마법 설정과 서사를 한 편집 폼으로 제공한다.
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#090d16] border border-[#d4a33e]/30 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* 편집 모달 제목과 닫기 동작 */}
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

          {/* 저장 상태와 입력 섹션을 포함한 전체 편집 폼 */}
          <form aria-busy={saving} onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {saveError && <p ref={errorMessageRef} tabIndex={-1} role="alert" className="admin-error" style={{ whiteSpace: 'pre-line' }}><strong>저장하지 못했습니다.</strong><br />{saveError}</p>}
            {/* 초상화 업로드·크롭 및 기숙사·기본 인물 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* 이미지 미리보기, 파일 업로드, 확대·위치 크롭 조정 */}
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
                  accept="image/png"
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

              {/* 기숙사, 신체 정보, 이름, 학년과 혈통 등 기본 프로필 */}
              <div className="md:col-span-8 space-y-4">
                {/* 기숙사 선택 */}
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
                {/* 한글·영문 이름 */}
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

                {/* 성별, 나이, 학년과 혈통 */}
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
                      value={[1, 4, 7].includes(year) ? year : 0}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc] focus:outline-none focus:border-[#d4a33e]"
                    >
                      {[1, 4, 7].map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}학년
                        </option>
                      ))}
                      <option value={0}>그 외</option>
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
                    <fieldset>
                      <legend className="block text-xs text-[#a19d94] mb-1">생일</legend>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="text-xs text-[#a19d94]">월
                          <select aria-label="생일 월" value={birthdayMonth} onChange={e => { const month = Number(e.target.value); setBirthdayMonth(month); setBirthdayDay(day => Math.min(day, birthdayDays(month))); }} className="w-full mt-1 px-2 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]">
                            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-[#a19d94]">일
                          <select aria-label="생일 일" value={birthdayDay} onChange={e => setBirthdayDay(Number(e.target.value))} className="w-full mt-1 px-2 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]">
                            {Array.from({ length: birthdayDays(birthdayMonth) }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-[#a19d94]">요일
                          <select aria-label="생일 요일" value={birthdayWeekday} onChange={e => setBirthdayWeekday(e.target.value)} className="w-full mt-1 px-2 py-2 bg-[#0c121e] border border-[#d4a33e]/25 rounded-lg text-xs text-[#e8e4dc]">
                            <option value="">미선택</option>
                            {WEEKDAYS.map(day => <option key={day} value={day}>{day}</option>)}
                          </select>
                        </label>
                      </div>
                    </fieldset>
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

            {/* 지팡이 목재·심·길이·유연성 */}
            <div className="p-4 rounded-xl bg-[#0e1422] border border-[#d4a33e]/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-[#f5d064]">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Wand Information (지팡이 설정)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">목재 (Wood)</label>
                  <select
                    aria-label="지팡이 목재"
                    value={wandWood}
                    onChange={(e) => setWandWood(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  >
                    {!WAND_WOODS.some(wood => wood.value === wandWood) && <option value={wandWood}>{wandWood || '미등록'} (기존 값)</option>}
                    {WAND_WOODS.map(wood => <option key={wood.value} value={wood.value}>{wood.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">심 (Core)</label>
                  <select
                    aria-label="지팡이 심"
                    value={wandCore}
                    onChange={(e) => setWandCore(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  >
                    {!WAND_CORES.some(core => core.value === wandCore) && <option value={wandCore}>{wandCore || '미등록'} (기존 값)</option>}
                    {WAND_CORES.map(core => <option key={core.value} value={core.value}>{core.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">길이 (Length)</label>
                  <select
                    aria-label="지팡이 길이"
                    value={wandLength}
                    onChange={(e) => setWandLength(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  >
                    {!WAND_LENGTHS.some(length => length.value === wandLength) && <option value={wandLength}>{wandLength || '미등록'} (기존 값)</option>}
                    {WAND_LENGTHS.map(length => <option key={length.value} value={length.value}>{length.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#888] mb-1">유연함 (Flexibility)</label>
                  <select
                    aria-label="지팡이 유연함"
                    value={wandFlex}
                    onChange={(e) => setWandFlex(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#090d16] border border-[#d4a33e]/20 rounded text-xs text-[#e8e4dc]"
                  >
                    {!WAND_FLEXIBILITIES.some(flexibility => flexibility.value === wandFlex) && <option value={wandFlex}>{wandFlex || '미등록'} (기존 값)</option>}
                    {WAND_FLEXIBILITIES.map(flexibility => <option key={flexibility.value} value={flexibility.value}>{flexibility.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 대표 대사 */}
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

            {/* 외관 요약과 상세 묘사 */}
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

            {/* 성격 키워드와 상세 서술 */}
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

            {/* 과거사와 성장 배경 */}
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

            {/* 한 줄씩 입력하는 기타 특징 */}
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

            {/* 취소와 등록·수정 저장 동작 */}
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
