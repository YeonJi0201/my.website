import { MAX_IMAGE_BYTES } from '../utils/image-limits';
import { formatSchoolYear } from '../utils/registration-fields';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, LogOut, Plus, ShieldCheck, Upload, Edit3, Trash2, Search } from 'lucide-react';
import type { Character, HouseType } from '../types/character';
import { HOUSES } from '../data/houseData';
import { api, ApiError, getCharacters } from '../utils/api';
import { CharacterPortrait } from './CharacterPortrait';
import { CharacterModal } from './CharacterModal';
import { HouseEmblem } from './HouseEmblem';

type Props = { characters: Character[]; onCharactersChange: (characters: Character[]) => void };
export default function AdminPage({ characters, onCharactersChange }: Props) {
  // 세션 확인 결과에 따라 로그인 또는 관리 화면을 보여주고 요청 상태를 공유한다.
  const [status, setStatus] = useState<'checking' | 'guest' | 'admin'>('checking');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [house, setHouse] = useState<HouseType | 'all'>('all');
  const [editor, setEditor] = useState<Character | 'new' | null>(null);
  const [legacyCount, setLegacyCount] = useState(0);
  const imageInput = useRef<HTMLInputElement>(null);
  const imageTarget = useRef<Character | null>(null);
  useEffect(() => {
    let active = true;
    api<{ authenticated: boolean }>('/api/admin/session').then(session => { if (active) setStatus(session.authenticated ? 'admin' : 'guest'); }).catch(() => { if (active) { setStatus('guest'); setError('인증 서버에 연결하지 못했습니다.'); } });
    try { const old = JSON.parse(localStorage.getItem('utopia_hogwarts_characters_v1') || 'null'); if (Array.isArray(old)) setLegacyCount(old.length); } catch {}
    return () => { active = false; };
  }, []);

  // 인증·등록·수정·이미지 교체·삭제 및 이전 브라우저 기록 가져오기 요청을 처리한다.
  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) { setStatus('guest'); setEditor(null); }
    setError(e instanceof Error ? e.message : '요청을 완료하지 못했습니다.');
  };
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api('/api/admin/login', 'POST', { username, password });
      setPassword(''); setStatus('admin');
      onCharactersChange(await getCharacters());
    } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const logout = async () => {
    setBusy(true); setError('');
    try { await api('/api/admin/logout', 'POST', {}); setStatus('guest'); setEditor(null); setMessage(''); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };
  const save = async (character: Character) => {
    try {
      const existing = characters.some(c => c.id === character.id);
      onCharactersChange(await api<Character[]>(existing ? `/api/admin/characters/${encodeURIComponent(character.id)}` : '/api/admin/characters', existing ? 'PUT' : 'POST', character));
      setMessage(`${character.nameKo}의 기록을 저장했습니다.`); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : '저장하지 못했습니다.'); throw e; }
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0], target = imageTarget.current;
    event.target.value = '';
    if (!file || !target) return;
    if (file.type !== 'image/png' || file.size > MAX_IMAGE_BYTES) { setError('20MB 이하의 PNG 이미지를 선택해주세요.'); return; }
    setBusy(true); setError('');
    try {
      const image = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.')); reader.readAsDataURL(file); });
      await save({ ...target, image, imageOriginal: undefined, imageThumbnail: undefined, portraitCrop: { zoom: 1, x: 0, y: 0 } });
    } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const remove = async (character: Character) => {
    if (!confirm(`${character.nameKo}의 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    setBusy(true); setError('');
    try { onCharactersChange(await api<Character[]>(`/api/admin/characters/${encodeURIComponent(character.id)}`, 'DELETE', {})); setMessage(`${character.nameKo}의 기록을 삭제했습니다.`); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };
  const importLegacy = async () => {
    if (!confirm(`이 브라우저에 남아 있는 ${legacyCount}개의 기록을 서버로 가져올까요? 같은 인물의 서버 기록은 가져온 내용으로 바뀝니다.`)) return;
    setBusy(true); setError('');
    try { const records = JSON.parse(localStorage.getItem('utopia_hogwarts_characters_v1') || 'null'); onCharactersChange(await api<Character[]>('/api/admin/import', 'POST', records)); setMessage('기존 브라우저 기록을 가져왔습니다.'); setLegacyCount(0); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };
  const filtered = characters.filter(c => (house === 'all' || house === c.house) && `${c.nameKo} ${c.nameEn}`.toLowerCase().includes(query.toLowerCase()));

  // 로그인 폼과 검색 가능한 기록 목록, 편집 모달을 인증 상태별로 렌더링한다.
  return <main className="admin-page">
    <div className="admin-topbar"><a href="/"><ArrowLeft size={15} /> 커뮤니티로 돌아가기</a><span>Once Upon a time...</span>{status === 'admin' && <button onClick={() => void logout()} disabled={busy}><LogOut size={15} /> 로그아웃</button>}</div>
    {status === 'checking' ? <p className="archive-loading" role="status">출입 권한을 확인하는 중입니다…</p> : status === 'guest' ? <section className="admin-login">
      <ShieldCheck size={36} strokeWidth={1} /><span className="small-caps">THE KEEPER'S ARCHIVE</span><h1>기록 관리자의 서고</h1><p>허가된 관리자만 이 서고의 기록을 바꿀 수 있습니다.</p>
      <form onSubmit={login}><label>관리자 아이디<input autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} /></label><label>비밀번호<input type="password" autoComplete="current-password" required maxLength={512} value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy ? '권한 확인 중…' : '서고에 들어가기'}</button></form>
    </section> : <>
      <div className="admin-heading"><div><span className="small-caps">ADMINISTRATION · 관리자 전용</span><h1>인물 기록 관리</h1><p>캐릭터의 등록, 이미지와 프로필 수정, 기록 삭제를 관리합니다.</p></div><button className="admin-primary" onClick={() => setEditor('new')} disabled={busy}><Plus size={16} /> 캐릭터 등록</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}<p className="admin-message" role="status">{message}</p>
      <div className="admin-filters"><label><Search size={15} /><input aria-label="관리할 캐릭터 검색" placeholder="이름으로 기록 찾기" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="기숙사 선택" value={house} onChange={e => setHouse(e.target.value as HouseType | 'all')}><option value="all">전체 기숙사</option>{Object.values(HOUSES).map(h => <option key={h.id} value={h.id}>{h.nameKo}</option>)}</select><span>{filtered.length}개의 기록</span></div>
      <input ref={imageInput} type="file" accept="image/png" hidden onChange={upload} />
      <div className="admin-character-list">{filtered.map(c => <article key={c.id} data-house={c.house} className="admin-character-row"><div className="admin-portrait"><CharacterPortrait character={c} variant="thumbnail" /></div><div className="admin-character-name"><span className="small-caps">{HOUSES[c.house].nameKo} · {formatSchoolYear(c.year)}</span><h2>{c.nameKo}</h2><p>{c.nameEn}</p></div><HouseEmblem house={c.house} /><div className="admin-row-actions"><button disabled={busy} onClick={() => { imageTarget.current = c; imageInput.current?.click(); }} aria-label={`${c.nameKo} 캐릭터 이미지 변경`}><Upload size={14} /> 캐릭터 이미지 변경</button><button disabled={busy} onClick={() => setEditor(c)} aria-label={`${c.nameKo} 프로필 수정`}><Edit3 size={14} /> 프로필 수정</button><button disabled={busy} className="admin-delete" onClick={() => void remove(c)} aria-label={`${c.nameKo} 기록 삭제`}><Trash2 size={14} /> 기록 삭제</button></div></article>)}{!filtered.length && <p className="admin-empty">조건에 맞는 기록이 없습니다.</p>}</div>
      {legacyCount > 0 && <aside className="admin-legacy"><p>이 브라우저에 이전 방식으로 저장된 {legacyCount}개의 기록이 있습니다.</p><button disabled={busy} onClick={() => void importLegacy()}>기존 브라우저 기록 가져오기</button></aside>}
      <CharacterModal isOpen={editor !== null} onClose={() => setEditor(null)} onSave={save} initialCharacter={editor && editor !== 'new' ? editor : null} defaultHouse={house === 'all' ? 'gryffindor' : house} />
    </>}
  </main>;
}
