"use client";

import React, { useEffect, useRef } from "react";

interface JourneyStarfieldCanvasProps {
  scrollProgress?: number;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  layer: number; // 1 = distant, 2 = mid, 3 = near
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

export function JourneyStarfieldCanvas({
  scrollProgress = 0,
  className = "",
}: JourneyStarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Initialize stars once
  useEffect(() => {
    const starCount = 280;
    const stars: Star[] = [];

    const colors = [
      "#FFFFFF",
      "#F8FAFC",
      "#E2E8F0",
      "#38BDF8", // electric cyan
      "#60A5FA", // sky blue
      "#93C5FD", // light blue
    ];

    for (let i = 0; i < starCount; i++) {
      const rand = Math.random();
      let layer = 1;
      let radius = 0.8 + Math.random() * 0.5;
      let baseAlpha = 0.25 + Math.random() * 0.25;

      if (rand > 0.88) {
        // Near prominent stars
        layer = 3;
        radius = 1.8 + Math.random() * 1.0;
        baseAlpha = 0.75 + Math.random() * 0.25;
      } else if (rand > 0.65) {
        // Midground stars
        layer = 2;
        radius = 1.2 + Math.random() * 0.6;
        baseAlpha = 0.45 + Math.random() * 0.35;
      }

      const color =
        layer === 3 && Math.random() > 0.5
          ? "#38BDF8"
          : colors[Math.floor(Math.random() * colors.length)];

      stars.push({
        x: Math.random(), // normalized 0 to 1
        y: Math.random(),
        radius,
        layer,
        baseAlpha,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        color,
      });
    }

    starsRef.current = stars;
  }, []);

  // Main canvas render & resize loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Visibility observer to pause rendering when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    let lastTime = performance.now();

    const render = (now: number) => {
      animFrameRef.current = requestAnimationFrame(render);
      if (!isVisibleRef.current) return;

      const elapsed = (now - lastTime) * 0.001;
      lastTime = now;

      // 1. Deep space base fill
      ctx.fillStyle = "#080A0F";
      ctx.fillRect(0, 0, width, height);

      // 2. Cosmic Ambient Nebular Dust Gradients (Parallaxed horizontally)
      const p = scrollProgress;
      
      // Navy Blue core nebula
      const nebulaGrad1 = ctx.createRadialGradient(
        width * 0.7 - p * 200,
        height * 0.35,
        50,
        width * 0.7 - p * 200,
        height * 0.35,
        width * 0.55
      );
      nebulaGrad1.addColorStop(0, "rgba(37, 99, 235, 0.07)");
      nebulaGrad1.addColorStop(0.5, "rgba(30, 58, 138, 0.03)");
      nebulaGrad1.addColorStop(1, "transparent");
      ctx.fillStyle = nebulaGrad1;
      ctx.fillRect(0, 0, width, height);

      // Electric Cyan soft cloud
      const nebulaGrad2 = ctx.createRadialGradient(
        width * 0.25 - p * 120,
        height * 0.65,
        40,
        width * 0.25 - p * 120,
        height * 0.65,
        width * 0.45
      );
      nebulaGrad2.addColorStop(0, "rgba(56, 189, 248, 0.05)");
      nebulaGrad2.addColorStop(0.6, "rgba(14, 165, 233, 0.02)");
      nebulaGrad2.addColorStop(1, "transparent");
      ctx.fillStyle = nebulaGrad2;
      ctx.fillRect(0, 0, width, height);

      // 3. Giant Planetary Horizon Arc in Bottom-Left (Reference Blueprint Detail)
      const horizonX = -120 - p * 80;
      const horizonY = height + 140;
      const horizonR = Math.max(width * 0.45, 380);

      const horizonGrad = ctx.createRadialGradient(
        horizonX,
        horizonY,
        horizonR * 0.75,
        horizonX,
        horizonY,
        horizonR
      );
      horizonGrad.addColorStop(0, "#030712");
      horizonGrad.addColorStop(0.85, "#0D1527");
      horizonGrad.addColorStop(0.96, "#1E3A8A");
      horizonGrad.addColorStop(1, "rgba(56, 189, 248, 0.4)");

      ctx.save();
      ctx.beginPath();
      ctx.arc(horizonX, horizonY, horizonR, 0, Math.PI * 2);
      ctx.fillStyle = horizonGrad;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
      ctx.stroke();
      ctx.restore();

      // 4. Render Stars with 3-Layer Parallax & Subtle Twinkling
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Parallax speed based on layer
        const parallaxFactor =
          star.layer === 1 ? 0.08 : star.layer === 2 ? 0.22 : 0.45;

        // Wrap horizontal position smoothly across width
        let sx = ((star.x - p * parallaxFactor) % 1.0) * width;
        if (sx < 0) sx += width;
        const sy = star.y * height;

        // Twinkling alpha modulation
        star.twinklePhase += star.twinkleSpeed * elapsed;
        const twinkle = Math.sin(star.twinklePhase);
        const alpha = Math.max(
          0.1,
          Math.min(1, star.baseAlpha + twinkle * (star.layer === 3 ? 0.25 : 0.15))
        );

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Cross diffraction spikes on prominent layer 3 stars
        if (star.layer === 3 && alpha > 0.75) {
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.6;
          const spikeLen = star.radius * 2.8;

          ctx.beginPath();
          ctx.moveTo(sx - spikeLen, sy);
          ctx.lineTo(sx + spikeLen, sy);
          ctx.moveTo(sx, sy - spikeLen);
          ctx.lineTo(sx, sy + spikeLen);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1.0;
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className={"absolute inset-0 w-full h-full pointer-events-none " + className}
      style={{ display: "block" }}
    />
  );
}
