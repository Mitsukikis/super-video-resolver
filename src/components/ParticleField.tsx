"use client";

import { useEffect, useRef } from "react";
import { getParticleSettings } from "@/lib/client/particleConfig";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tone: number;
};

function makeParticle(width: number, height: number, speed: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const velocity = speed * (0.45 + Math.random() * 0.8);
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity,
    radius: 1.1 + Math.random() * 1.8,
    tone: Math.random()
  };
}

function particleColor(tone: number, alpha: number) {
  if (tone > 0.82) return `rgba(244, 114, 182, ${alpha})`;
  if (tone > 0.58) return `rgba(245, 158, 11, ${alpha})`;
  return `rgba(45, 212, 191, ${alpha})`;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const canvasElement = canvas;
    const ctx = context;
    let frameId = 0;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let settings = getParticleSettings({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    });
    const pointer = { x: 0, y: 0, active: false };

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      settings = getParticleSettings({
        width,
        height,
        devicePixelRatio: ratio,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      });
      canvasElement.width = Math.floor(width * ratio);
      canvasElement.height = Math.floor(height * ratio);
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: settings.count }, () => makeParticle(width, height, settings.speed));
      draw();
    }

    function drawLinks() {
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const first = particles[i];
          const second = particles[j];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.hypot(dx, dy);
          if (distance > settings.linkDistance) continue;
          const alpha = (1 - distance / settings.linkDistance) * 0.28;
          ctx.strokeStyle = `rgba(94, 234, 212, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(first.x, first.y);
          ctx.lineTo(second.x, second.y);
          ctx.stroke();
        }
      }
    }

    function updateParticle(particle: Particle) {
      if (settings.speed > 0) {
        particle.x += particle.vx;
        particle.y += particle.vy;
      }

      if (pointer.active) {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distance = Math.hypot(dx, dy);
        if (distance < settings.interactionRadius && distance > 0) {
          const pull = (1 - distance / settings.interactionRadius) * 0.82;
          particle.x += (dx / distance) * pull;
          particle.y += (dy / distance) * pull;
        }
      }

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(width * 0.52, height * 0.26, 0, width * 0.52, height * 0.26, Math.max(width, height));
      gradient.addColorStop(0, "rgba(20, 184, 166, 0.12)");
      gradient.addColorStop(0.38, "rgba(15, 23, 42, 0.04)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      drawLinks();

      for (const particle of particles) {
        updateParticle(particle);
        const pointerDistance = pointer.active ? Math.hypot(pointer.x - particle.x, pointer.y - particle.y) : Infinity;
        const pointerBoost = pointerDistance < settings.interactionRadius ? 0.38 : 0;
        ctx.fillStyle = particleColor(particle.tone, 0.54 + pointerBoost);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius + pointerBoost, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pointer.active) {
        ctx.strokeStyle = "rgba(45, 212, 191, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, settings.interactionRadius * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function tick() {
      draw();
      frameId = window.requestAnimationFrame(tick);
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        window.cancelAnimationFrame(frameId);
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    }

    resize();
    frameId = window.requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />;
}
