import { useEffect, useRef, useState } from 'react';
import plate from '../assets/images/hero-castle-night.webp';
import sceneData from '../assets/images/hero-castle-night-depth.webp';
import { createHeroRenderer, type HeroRenderer } from '../utils/heroRenderer';

type Mode = 'pending' | 'live' | 'still';

// 비동기 이미지 디코딩을 마친 뒤 WebGL 초기화에 넘긴다.
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

// Painted night scene behind the home title. WebGL adds the arrival camera move, drifting clouds,
// lake mist and lantern light; without WebGL, or with reduced motion, the same plate stays still.
export function HeroScene({ onReady }: { onReady: () => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onReady);
  const [mode, setMode] = useState<Mode>('pending');
  const [stillIntro, setStillIntro] = useState(false);

  useEffect(() => { readyRef.current = onReady; }, [onReady]);

  // 동작 설정·기기 조건에 따라 WebGL 장면 또는 정지 이미지를 선택하고 자원을 정리한다.
  useEffect(() => {
    const container = frame.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(pointer: fine)');
    let renderer: HeroRenderer | null = null;
    let settled = false, visible = true, announced = false;

    const announce = () => {
      if (announced) return;
      announced = true;
      readyRef.current();
    };
    const showStill = (animate: boolean) => {
      settled = true;
      renderer?.dispose();
      renderer = null;
      setStillIntro(animate);
      setMode('still');
      announce();
    };
    const sync = () => {
      if (!renderer) return;
      if (visible && !document.hidden) renderer.play(); else renderer.pause();
    };
    const resize = () => {
      if (!renderer) return;
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const scale = Math.min(devicePixelRatio || 1, 1.25, Math.sqrt(2_400_000 / (width * height)));
      renderer.resize(Math.round(width * scale), Math.round(height * scale), width / height < 1 ? .63 : .5, .5);
    };
    const onScroll = () => renderer?.setScroll(scrollY / Math.max(container.offsetHeight, 1));
    const onPointer = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType === 'touch') return;
      renderer?.setPointer(event.clientX / innerWidth * 2 - 1, event.clientY / innerHeight * 2 - 1);
    };
    const onMotionPreference = () => { if (reduce.matches && renderer) showStill(false); };
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });

    if (reduce.matches) {
      showStill(false);
      return;
    }

    const timeout = window.setTimeout(() => { if (!settled) showStill(true); }, 4500);
    Promise.all([loadImage(plate), loadImage(sceneData)]).then(([image, data]) => {
      if (settled) return;
      if (reduce.matches) return showStill(false);
      renderer = createHeroRenderer(canvas, image, data, () => showStill(false));
      if (!renderer) return showStill(true);
      settled = true;
      resize();
      onScroll();
      setMode('live');
      sync();
      announce();
    }).catch(() => { if (!settled) showStill(true); });

    resizeObserver.observe(container);
    intersection.observe(container);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', onMotionPreference);
    return () => {
      settled = true;
      window.clearTimeout(timeout);
      renderer?.dispose();
      renderer = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', sync);
      reduce.removeEventListener('change', onMotionPreference);
    };
  }, []);

  return <div ref={frame} className="hero-scene" data-mode={mode} data-intro={stillIntro ? 'on' : undefined}>
    <img className="hero-scene-still" src={plate} width={1672} height={941} fetchPriority="high" decoding="async"
      alt="달빛 아래 호숫가 언덕 위에 선 마법학교 성. 앞쪽 난간에는 편지를 문 흰 부엉이와 오래된 책, 등불이 놓여 있다." />
    <canvas ref={canvasRef} className="hero-scene-canvas" aria-hidden="true" />
  </div>;
}
