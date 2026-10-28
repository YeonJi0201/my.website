import { useEffect, useRef } from 'react';

type Particle = { x: number; y: number; radius: number; phase: number; speed: number };
type Spark = { x: number; y: number; life: number; vx: number; vy: number };
type Meteor = { x: number; y: number; age: number; life: number; vx: number; vy: number; tail: number };

export function MagicalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = innerWidth, height = innerHeight, frame = 0, previous = 0, elapsed = 0, nextMeteor = 1.8;
    let particles: Particle[] = [];
    const sparks: Spark[] = [], meteors: Meteor[] = [];
    const resize = () => {
      width = innerWidth; height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: width < 760 ? 25 : 42 }, () => ({ x: Math.random() * width, y: Math.random() * height, radius: .5 + Math.random(), phase: Math.random() * Math.PI * 2, speed: 7 + Math.random() * 12 }));
    };
    const pointer = (event: PointerEvent) => {
      if (motion.matches || event.pointerType === 'touch' || sparks.length >= 30 || document.hidden) return;
      sparks.push({ x: event.clientX, y: event.clientY, life: 1, vx: (Math.random() - .5) * 32, vy: 12 + Math.random() * 30 });
    };
    const render = (time: number) => {
      if (motion.matches || document.hidden) { ctx.clearRect(0, 0, width, height); previous = 0; return; }
      const dt = Math.min((time - (previous || time)) / 1000, .05);
      previous = time; elapsed += dt;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speed * dt; if (p.y < -5) { p.y = height + 5; p.x = Math.random() * width; }
        p.x += Math.sin(elapsed * .3 + p.phase) * dt * 3;
        const alpha = .13 + (Math.sin(elapsed + p.phase) + 1) * .13;
        ctx.fillStyle = `rgba(224,207,158,${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
      }
      if (elapsed > nextMeteor) {
        const speed = width < 760 ? 300 : 470;
        meteors.push({ x: width * (.3 + Math.random() * .65), y: height * (.06 + Math.random() * .22), age: 0, life: 1.05 + Math.random() * .45, vx: -speed * .8, vy: speed * .65, tail: width < 760 ? 100 : 190 });
        nextMeteor = elapsed + 6 + Math.random() * 7;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]; m.age += dt;
        if (m.age >= m.life) { meteors.splice(i, 1); continue; }
        m.x += m.vx * dt; m.y += m.vy * dt;
        const alpha = Math.sin(Math.PI * m.age / m.life) * .8;
        const speed = Math.hypot(m.vx, m.vy);
        const tailX = m.x - m.vx / speed * m.tail, tailY = m.y - m.vy / speed * m.tail;
        const trail = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        trail.addColorStop(0, 'rgba(147,187,213,0)'); trail.addColorStop(.65, `rgba(186,208,214,${alpha * .35})`); trail.addColorStop(1, `rgba(255,237,189,${alpha})`);
        ctx.save(); ctx.strokeStyle = trail; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.shadowBlur = 9; ctx.shadowColor = `rgba(217,224,206,${alpha})`;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(m.x, m.y); ctx.stroke();
        ctx.shadowBlur = 14; ctx.fillStyle = `rgba(255,245,218,${alpha})`; ctx.beginPath(); ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.life -= dt * 1.6;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        s.x += s.vx * dt; s.y += s.vy * dt;
        ctx.fillStyle = `rgba(232,207,153,${s.life * .55})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.life * 1.5, 0, Math.PI * 2); ctx.fill();
      }
      frame = requestAnimationFrame(render);
    };
    const restart = () => {
      cancelAnimationFrame(frame); previous = 0; meteors.length = 0; sparks.length = 0;
      nextMeteor = elapsed + 1.8;
      render(performance.now());
    };
    resize(); restart();
    addEventListener('resize', resize); addEventListener('pointermove', pointer, { passive: true });
    motion.addEventListener('change', restart); document.addEventListener('visibilitychange', restart);
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); removeEventListener('pointermove', pointer); motion.removeEventListener('change', restart); document.removeEventListener('visibilitychange', restart); };
  }, []);
  return <div className="magical-sky fixed inset-0 pointer-events-none z-20 overflow-hidden" aria-hidden="true"><canvas ref={canvasRef} className="absolute inset-0 w-full h-full" /></div>;
}
