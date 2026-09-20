"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  speed: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

export function EventHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let isTabActive = true;
    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Star palette matching design system
    const starColors = [
      "rgba(245, 247, 250, ", // Soft white #F5F7FA
      "rgba(56, 189, 248, ",  // Electric cyan #38BDF8
      "rgba(37, 99, 235, ",   // IEDC blue #2563EB
      "rgba(167, 175, 190, ", // Cool gray #A7AFBE
    ];

    let stars: Star[] = [];

    const initStars = () => {
      const isMobile = window.innerWidth < 768;
      const count = isMobile ? 45 : 110;
      stars = [];

      for (let i = 0; i < count; i++) {
        const color =
          Math.random() > 0.6
            ? starColors[1] // Cyan
            : Math.random() > 0.85
            ? starColors[2] // Blue
            : starColors[0]; // White

        const baseAlpha = Math.random() * 0.6 + 0.2;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.4,
          baseAlpha,
          alpha: baseAlpha,
          speed: (Math.random() * 0.15 + 0.05) * (prefersReducedMotion ? 0 : 1),
          color,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      initStars();
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking for desktop parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / width - 0.5) * 30;
      targetMouseY = ((e.clientY - rect.top) / height - 0.5) * 20;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && isTabActive) {
          cancelAnimationFrame(animationFrameId);
          render();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Tab visibility handling
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (isVisible && isTabActive) {
        cancelAnimationFrame(animationFrameId);
        render();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Render loop
    const render = () => {
      if (!isVisible || !isTabActive) return;

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw celestial background dust gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5 + mouseX * 0.5,
        height * 0.3 + mouseY * 0.5,
        20,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      bgGrad.addColorStop(0, "rgba(23, 37, 84, 0.22)"); // Deep blue glow
      bgGrad.addColorStop(0.5, "rgba(13, 17, 26, 0.1)");
      bgGrad.addColorStop(1, "rgba(8, 10, 15, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw faint geometric constellation linkage lines between select nearby stars
      ctx.lineWidth = 0.5;
      for (let i = 0; i < Math.min(stars.length, 30); i++) {
        for (let j = i + 1; j < Math.min(stars.length, 30); j++) {
          const s1 = stars[i];
          const s2 = stars[j];
          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.12;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(s1.x + mouseX * (s1.radius * 0.4), s1.y + mouseY * (s1.radius * 0.4));
            ctx.lineTo(s2.x + mouseX * (s2.radius * 0.4), s2.y + mouseY * (s2.radius * 0.4));
            ctx.stroke();
          }
        }
      }

      // Draw Stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (!prefersReducedMotion) {
          // Slow upward drift
          star.y -= star.speed;
          if (star.y < -10) star.y = height + 10;

          // Twinkle
          star.twinklePhase += star.twinkleSpeed;
          star.alpha =
            star.baseAlpha + Math.sin(star.twinklePhase) * (star.baseAlpha * 0.4);
        }

        const px = star.x + mouseX * (star.radius * 0.5);
        const py = star.y + mouseY * (star.radius * 0.5);

        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.max(0.05, star.alpha)})`;
        ctx.fill();

        // Subtle bloom around brightest stars
        if (star.radius > 1.3) {
          ctx.beginPath();
          ctx.arc(px, py, star.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${star.alpha * 0.18})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
