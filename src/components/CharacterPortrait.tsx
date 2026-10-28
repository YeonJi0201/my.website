import { useEffect, useRef, useState } from 'react';
import { Character } from '../types/character';
import { resolvePortrait } from '../utils/portraits';

type FaceBox = { x: number; y: number; width: number; height: number };
type Detector = { detect: (image: HTMLImageElement) => Promise<{ boundingBox: FaceBox }[]> };

/** Shared upper-body viewport for profiles, the directory and the crop editor. */
export function CharacterPortrait({ character, className = '' }: {
  character: Pick<Character, 'image' | 'nameKo' | 'portraitCrop'>;
  className?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [face, setFace] = useState<FaceBox | null>(null);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    setFace(null);
    const detect = async () => {
      const image = picture.current;
      const FaceDetector = (window as unknown as { FaceDetector?: new (options: { fastMode: boolean; maxDetectedFaces: number }) => Detector }).FaceDetector;
      if (!image?.complete || !image.naturalWidth || !FaceDetector) return;
      try {
        const faces = await new FaceDetector({ fastMode: true, maxDetectedFaces: 1 }).detect(image);
        if (!cancelled) setFace(faces[0]?.boundingBox || null);
      } catch { /* Use upper-body framing when native detection is unavailable. */ }
    };
    const image = picture.current;
    image?.addEventListener('load', detect);
    void detect();
    return () => { cancelled = true; image?.removeEventListener('load', detect); };
  }, [character.image]);
  const crop = character.portraitCrop;
  const sourceHeight = face ? Math.min(natural.height, face.height * 4.8) : Math.min(natural.height, natural.width * 1.25);
  const scale = natural.width ? Math.max(size.width / natural.width, size.height / natural.height, Math.max(size.width / natural.width, size.height / Math.max(1, sourceHeight)) * (crop?.zoom ?? 1)) : 1;
  const center = face ? face.x + face.width / 2 : natural.width / 2;
  const top = face ? Math.max(0, face.y - face.height * .45) : 0;
  const left = Math.min(0, Math.max(size.width - natural.width * scale, size.width / 2 - center * scale + (crop?.x ?? 0) / 100 * size.width));
  const offsetTop = Math.min(0, Math.max(size.height - natural.height * scale, -top * scale + (crop?.y ?? 0) / 100 * size.height));
  return <div className={`character-portrait ${className}`} ref={viewport}>
    <img ref={picture} src={resolvePortrait(character.image)} alt={character.nameKo} onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} style={natural.width ? { width: natural.width * scale, height: natural.height * scale, left, top: offsetTop } : { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
  </div>;
}
