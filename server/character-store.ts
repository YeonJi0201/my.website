import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';
import type { Character } from '../src/types/character.ts';

export interface CharacterStore {
  list(): Promise<Character[]>;
  create(character: Character): Promise<void>;
  update(character: Character): Promise<void>;
  remove(id: string): Promise<void>;
  import(characters: Character[]): Promise<void>;
}
export const storeError = (status: number, message: string) => Object.assign(new Error(message), { status });

export function createFileStore(directory: string): CharacterStore {
  const file = path.join(directory, 'characters.json');
  let queue: Promise<unknown> = Promise.resolve();
  const list = async (): Promise<Character[]> => {
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return structuredClone(INITIAL_CHARACTERS);
      throw error;
    }
  };
  const mutate = async (change: (characters: Character[]) => Character[]) => {
    const operation = queue.then(async () => {
      const characters = change(await list());
      await mkdir(directory, { recursive: true });
      await writeFile(`${file}.tmp`, JSON.stringify(characters, null, 2), { mode: 0o600 });
      await rename(`${file}.tmp`, file);
    });
    queue = operation.catch(() => {});
    return operation;
  };
  return {
    list,
    create: character => mutate(characters => {
      if (characters.some(c => c.id === character.id)) throw storeError(409, '이미 등록된 캐릭터입니다.');
      return [character, ...characters];
    }),
    update: character => mutate(characters => {
      if (!characters.some(c => c.id === character.id)) throw storeError(404, '캐릭터를 찾을 수 없습니다.');
      return characters.map(c => c.id === character.id ? character : c);
    }),
    remove: id => mutate(characters => {
      if (!characters.some(c => c.id === id)) throw storeError(404, '캐릭터를 찾을 수 없습니다.');
      return characters.filter(c => c.id !== id);
    }),
    import: imported => mutate(characters => [...imported, ...characters.filter(c => !imported.some(item => item.id === c.id))]),
  };
}
