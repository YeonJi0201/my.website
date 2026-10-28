import { useEffect, useRef } from 'react';

export function SmokeVeil() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 256;
    const brush = sprite.getContext('2d');
    if (!brush) return;
    // Overlapping soft lobes create an uneven, billowing plume.
    for (let i = 0; i < 18; i++) {
      const x = 128 + Math.cos(i * 2.399) * (i % 4) * 15;
      const y = 128 + Math.sin(i * 2.399) * (i % 5) * 12;
      const gradient = brush.createRadialGradient(x, y, 0, x, y, 65);
      gradient.addColorStop(0, 'rgba(153,177,166,.12)');
      gradient.addColorStop(.4, 'rgba(111,145,137,.065)');
      gradient.addColorStop(1, 'rgba(81,119,114,0)');
      brush.fillStyle = gradient;
      brush.fillRect(0, 0, 256, 256);
    }
    let width = 0, height = 0, frame = 0, previous = 0, time = 0;
    const resize = () => {
      width = innerWidth; height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio; canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const render = (now: number) => {
      time += Math.min((now - (previous || now)) / 1000, .05);
      previous = now;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < (width < 760 ? 12 : 20); i++) {
        const p = (time / (20 + i % 5 * 3) + i * .137) % 1;
        const side = i % 2 === 0 ? -1 : 1;
        const origin = i % 3 === 0 ? width * .5 : width * .5 + side * width * .46;
        const size = Math.min(width * .75, 680) * (.6 + p);
        ctx.save();
        ctx.globalAlpha = Math.sin(p * Math.PI) * (i % 3 === 0 ? .22 : .55);
        ctx.translate(origin + Math.sin(p * 4 + i) * width * .14, height * (1.3 - p * 1.5));
        ctx.rotate(Math.sin(p * 3 + i) * .65);
        ctx.scale(1.5, 1);
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
      if (!media.matches && !document.hidden) frame = requestAnimationFrame(render);
    };
    const restart = () => { cancelAnimationFrame(frame); previous = 0; render(performance.now()); };
    resize(); restart();
    addEventListener('resize', resize);
    media.addEventListener('change', restart);
    document.addEventListener('visibilitychange', restart);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('resize', resize);
      media.removeEventListener('change', restart);
      document.removeEventListener('visibilitychange', restart);
    };
  }, []);
  return <canvas ref={ref} className="smoke-veil" aria-hidden="true" />;
}
