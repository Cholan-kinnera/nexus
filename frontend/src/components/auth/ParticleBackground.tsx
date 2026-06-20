import { useEffect, useRef } from "react";
import { useTheme } from "../../hooks/useTheme";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
}

interface CursorTrail {
  x: number;
  y: number;
  life: number;
  size: number;
}

export default function ParticleBackground() {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<CursorTrail[]>([]);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    if (resolvedTheme === "light") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Colors that match Nexus PM violet theme
    const COLORS = [
      "rgba(167, 139, 250,",  // violet-400
      "rgba(139, 92, 246,",   // violet-500
      "rgba(109, 40, 217,",   // violet-700
      "rgba(196, 181, 253,",  // violet-300
      "rgba(224, 231, 255,",  // indigo-100
      "rgba(99, 102, 241,",   // indigo-500
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse move → spawn particles + update trail
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Cursor trail dots
      trailRef.current.push({
        x: e.clientX,
        y: e.clientY,
        life: 1,
        size: Math.random() * 4 + 2,
      });
      // Keep trail length reasonable
      if (trailRef.current.length > 25) trailRef.current.shift();

      // Throttle particle spawn
      const now = Date.now();
      if (now - lastSpawnRef.current < 30) return;
      lastSpawnRef.current = now;

      // Spawn 2-3 particles per move event
      const count = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.3;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const life = Math.random() * 60 + 40;
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5, // slight upward drift
          life,
          maxLife: life,
          size: Math.random() * 3 + 1,
          opacity: 1,
          color,
        });
      }

      // Cap total particles
      if (particlesRef.current.length > 180) {
        particlesRef.current = particlesRef.current.slice(-180);
      }
    };

    window.addEventListener("mousemove", onMouseMove);

    // Ambient floating particles (always present in background)
    const ambientParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      ambientParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        life: Math.random() * 200 + 100,
        maxLife: 300,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color,
      });
    }

    // Draw loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Ambient background particles ──────────────────────────────────────
      for (let i = ambientParticles.length - 1; i >= 0; i--) {
        const p = ambientParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Respawn when dead or off screen
        if (p.life <= 0 || p.y < -10) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = -Math.random() * 0.4 - 0.1;
          p.life = Math.random() * 200 + 100;
          p.opacity = Math.random() * 0.3 + 0.05;
          p.size = Math.random() * 1.5 + 0.5;
        }

        const fade = p.life < 50 ? p.life / 50 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity * fade})`;
        ctx.fill();
      }

      // ── Cursor trail ──────────────────────────────────────────────────────
      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const t = trailRef.current[i];
        t.life -= 0.06;
        if (t.life <= 0) {
          trailRef.current.splice(i, 1);
          continue;
        }
        const progress = i / trailRef.current.length;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size * progress * t.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${t.life * 0.35 * progress})`;
        ctx.fill();
      }

      // ── Cursor glow ring ──────────────────────────────────────────────────
      const { x, y } = mouseRef.current;
      if (x > 0) {
        // Outer soft glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 80);
        glow.addColorStop(0, "rgba(139, 92, 246, 0.12)");
        glow.addColorStop(0.5, "rgba(139, 92, 246, 0.04)");
        glow.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Inner bright dot
        const inner = ctx.createRadialGradient(x, y, 0, x, y, 6);
        inner.addColorStop(0, "rgba(196, 181, 253, 0.9)");
        inner.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = inner;
        ctx.fill();
      }

      // ── Cursor-spawned floating particles ─────────────────────────────────
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.02; // float upward
        p.vx *= 0.99; // slow drag
        p.life--;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        const fade = Math.min(lifeRatio * 3, 1) * lifeRatio;
        const size = p.size * (0.5 + lifeRatio * 0.5);

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${fade * 0.9})`;
        ctx.fill();

        // Tiny inner bright core
        if (size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${Math.min(fade * 1.5, 1)})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [resolvedTheme]);

  if (resolvedTheme === "light") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}
