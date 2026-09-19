"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TerrainProps {
  reducedMotion?: boolean;
}

function TerrainMesh({ reducedMotion }: TerrainProps) {
  const meshRef = useRef<THREE.Points>(null);
  const mouseTargetRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const mouseLerpRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));

  // Determine grid dimensions based on viewport
  const { geometry, uniforms } = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const widthSegments = isMobile ? 50 : 95;
    const heightSegments = isMobile ? 40 : 70;
    const planeWidth = 26;
    const planeHeight = 18;

    // Base plane geometry for positions
    const plane = new THREE.PlaneGeometry(
      planeWidth,
      planeHeight,
      widthSegments,
      heightSegments
    );

    const posAttr = plane.attributes.position;
    const count = posAttr.count;

    // Precompute normalized UVs and custom alphas for edge falloff
    const alphas = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);

      // Normalized coordinates [0, 1]
      const nx = (x / planeWidth) + 0.5;
      const ny = (y / planeHeight) + 0.5;

      // Soft fade on the left (so editorial typography on the left remains crystal clear)
      // and soft fade at the outer perimeter edges
      const leftFade = THREE.MathUtils.smoothstep(0.12, 0.48, nx);
      const rightFade = 1.0 - THREE.MathUtils.smoothstep(0.85, 1.0, nx);
      const topBottomFade = THREE.MathUtils.smoothstep(0.02, 0.2, ny) * (1.0 - THREE.MathUtils.smoothstep(0.8, 0.98, ny));

      alphas[i] = Math.max(0.04, leftFade * rightFade * topBottomFade);
    }

    const pointsGeom = new THREE.BufferGeometry();
    pointsGeom.setAttribute("position", posAttr.clone());
    pointsGeom.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    const unis = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uStrength: { value: 0.8 },
    };

    return {
      geometry: pointsGeom,
      uniforms: unis,
    };
  }, []);

  // Custom Shader for the glowing particle points
  const pointsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        attribute float aAlpha;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uStrength;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vElevation;

        // Harmonic terrain wave function
        float getElevation(vec2 pos, float time) {
          float w1 = sin(pos.x * 0.35 + time * 0.55) * cos(pos.y * 0.4 + time * 0.42) * 1.35;
          float w2 = sin(pos.x * 0.7 - time * 0.35 + pos.y * 0.5) * 0.75;
          float w3 = cos((pos.x + pos.y) * 0.9 + time * 0.6) * 0.35;
          return w1 + w2 + w3;
        }

        void main() {
          vec3 pos = position;

          // Compute wavy topographical height
          float elevation = getElevation(pos.xy, uTime);

          // Pointer interactivity: smooth radial ripple elevation
          float dist = distance(pos.xy, uMouse);
          float mouseInfluence = smoothstep(5.0, 0.0, dist) * uStrength;
          elevation += mouseInfluence * 1.6;

          pos.z += elevation;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Point sizing with perspective depth
          gl_PointSize = (18.0 * (1.0 + mouseInfluence * 0.8)) * (1.0 / -mvPosition.z);

          // Color palette mapping:
          // Low: Deep Navy / Indigo (#0D111A / #172554)
          // Mid: Electric Cyan (#38BDF8)
          // Crests: Vibrant Emerald Green (#10B981 / #34D399)
          vec3 deepNavy = vec3(0.05, 0.12, 0.28);
          vec3 electricCyan = vec3(0.22, 0.74, 0.97);
          vec3 emeraldGreen = vec3(0.06, 0.73, 0.51);

          float normElev = clamp((elevation + 1.5) / 3.2, 0.0, 1.0);

          vec3 color;
          if (normElev < 0.45) {
            color = mix(deepNavy, electricCyan, normElev / 0.45);
          } else {
            color = mix(electricCyan, emeraldGreen, (normElev - 0.45) / 0.55);
          }

          vColor = color;
          vElevation = elevation;
          vAlpha = clamp(aAlpha * (0.65 + normElev * 0.35), 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float r = length(coord);
          if (r > 0.5) discard;

          // Soft radiant particle falloff
          float edgeAlpha = smoothstep(0.5, 0.1, r);
          gl_FragColor = vec4(vColor, vAlpha * edgeAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [uniforms]);

  // Track window pointer coordinates converted into field coordinates
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      // Map to 3D terrain space
      mouseTargetRef.current.set(x * 10.0, y * 7.0);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame((_, delta) => {
    if (!pointsMaterial) return;

    if (!reducedMotion) {
      pointsMaterial.uniforms.uTime.value += delta;
    }

    // Lerp mouse coordinates smoothly
    mouseLerpRef.current.lerp(mouseTargetRef.current, 0.06);
    pointsMaterial.uniforms.uMouse.value.copy(mouseLerpRef.current);

    // Subtle breathing tilt of the entire landscape
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(pointsMaterial.uniforms.uTime.value * 0.15) * 0.02;
    }
  });

  return (
    <group
      position={[2.5, -0.5, -2]}
      rotation={[-Math.PI * 0.38, 0.08, -Math.PI * 0.08]}
    >
      <primitive object={new THREE.Points(geometry, pointsMaterial)} ref={meshRef} />
    </group>
  );
}

/**
 * Persistent 2D Night Sky Starfield:
 * - Always persistent behind typography and terrain
 * - Desktop: ~560 stars, Tablet: ~340 stars, Mobile: ~220 stars
 * - Natural distribution across the full hero viewport
 * - Size variation: 68% tiny (0.75-1.2px), 22% small (1.35-1.9px), 8% medium (2.1-2.9px), 2% bright accents (3.2-4.4px)
 * - Realistic Twinkle: ~28% of stars gently breathe on individual 2.5s-6.0s cycles with randomized delays; ~72% stay stable
 * - IEDC Palette: Cool white, subtle blue, subtle electric cyan
 * - Single requestAnimationFrame loop with high-DPI scaling; static render on reduced motion
 */
/**
 * Master Realistic Night Sky Starfield (Fine-Tuned for High Perceptibility):
 * - Group A (Stable Stars ~47%): Calm celestial baseline, constant opacity (0.42 - 0.65)
 * - Group B (Twinkling Stars ~45%): Clearly perceptible gentle breathing shimmer (0.28 -> 0.85 -> 0.28)
 *   with fast, lively cycles (1.8s - 4.2s) and organic radial expansion (+35% at peak)
 * - Group C (Strong Accent Stars ~8%): Visually luminous anchors with pulsing soft glow aura & 4-point sparkle (0.48 -> 0.98 -> 0.48)
 * - Desktop: ~540 stars, Tablet: ~330 stars, Mobile: ~200 stars
 * - Colors: IEDC Brand Palette (Cool soft white, subtle blue, subtle electric cyan)
 * - Performance: Single 60fps requestAnimationFrame loop with high-DPI canvas scaling
 * - Reduced Motion: Static stars rendered at calm baseline, animation loop stopped
 */
interface NightStar {
  x: number;
  y: number;
  baseRadius: number;
  minAlpha: number;
  peakAlpha: number;
  rgb: string;
  group: "stable" | "twinkle" | "accent";
  cycleDuration: number;
  delay: number;
  phase: number;
  harmonicSpeed: number;
}

function NightSkyStarfield({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let stars: NightStar[] = [];
    let width = 0;
    let height = 0;

    const initStars = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Verified natural density: Desktop ~540, Tablet ~330, Mobile ~200
      const count =
        width >= 1024 ? 540 : width >= 768 ? 330 : 200;

      stars = [];

      const navbarBandCount = Math.round(count * 0.12);
      const navbarBandHeight = Math.min(88, height * 0.12);

      for (let i = 0; i < count; i++) {
        // Natural celestial distribution: ensure upper portion behind translucent navbar is richly populated
        const x = Math.random() * width;
        const y =
          i < navbarBandCount
            ? 4 + Math.random() * (navbarBandHeight - 4)
            : Math.random() * height;

        // Tuned Population Balance (Sections 2, 7, 32):
        // Group A: Stable Stars (~47%)
        // Group B: Twinkling Stars (~45%)
        // Group C: Strong Twinkle Accents (~8%)
        const groupRand = Math.random();
        let group: "stable" | "twinkle" | "accent";
        let baseRadius: number;
        let minAlpha: number;
        let peakAlpha: number;

        if (groupRand < 0.47) {
          // GROUP A — STABLE STARS (~47%)
          group = "stable";
          const sizeRand = Math.random();
          if (sizeRand < 0.75) {
            baseRadius = 0.75 + Math.random() * 0.40; // 0.75px - 1.15px
            minAlpha = 0.42 + Math.random() * 0.14; // 0.42 - 0.56
          } else {
            baseRadius = 1.25 + Math.random() * 0.45; // 1.25px - 1.70px
            minAlpha = 0.54 + Math.random() * 0.12; // 0.54 - 0.66
          }
          peakAlpha = minAlpha; // Stable: no visible blinking
        } else if (groupRand < 0.92) {
          // GROUP B — TWINKLING STARS (~45%)
          group = "twinkle";
          const sizeRand = Math.random();
          if (sizeRand < 0.65) {
            baseRadius = 0.85 + Math.random() * 0.40; // 0.85px - 1.25px
          } else {
            baseRadius = 1.35 + Math.random() * 0.65; // 1.35px - 2.00px
          }
          // Strong, easily perceptible opacity range (Section 3): 0.28-0.36 -> 0.80-0.88
          minAlpha = 0.26 + Math.random() * 0.10; // 0.26 - 0.36
          peakAlpha = 0.78 + Math.random() * 0.10; // 0.78 - 0.88
        } else {
          // GROUP C — STRONG TWINKLE ACCENTS (~8%, between 5-10%)
          group = "accent";
          baseRadius = 2.40 + Math.random() * 0.90; // 2.40px - 3.30px
          minAlpha = 0.46 + Math.random() * 0.10; // 0.46 - 0.56
          peakAlpha = 0.94 + Math.random() * 0.06; // 0.94 - 1.00
        }

        // Color Distribution (Section 17):
        // ~80% cool soft white (#F5F7FA), ~12% subtle blue (#60A5FA), ~8% subtle electric cyan (#38BDF8)
        const colorRand = Math.random();
        let rgb: string;
        if (colorRand < 0.80) {
          rgb = "245, 247, 250";
        } else if (colorRand < 0.92) {
          rgb = "96, 165, 250";
        } else {
          rgb = "56, 189, 248";
        }

        // Tuned Livelier Twinkle Cycle (Section 5: 1.8s - 4.5s)
        const cycleDuration = 1.8 + Math.random() * 2.4; // 1.8s to 4.2s
        const delay = 0.1 + Math.random() * 7.5; // Staggered delay across 7.5s
        const phase = Math.random() * Math.PI * 2;
        const harmonicSpeed = 0.45 + Math.random() * 0.45;

        stars.push({
          x,
          y,
          baseRadius,
          minAlpha,
          peakAlpha,
          rgb,
          group,
          cycleDuration,
          delay,
          phase,
          harmonicSpeed,
        });
      }
    };

    const render = (timeMs: number) => {
      if (width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);
      const timeSec = timeMs * 0.001;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        let alpha = star.minAlpha;
        let radius = star.baseRadius;

        if (star.group === "stable") {
          // Stable stars: calm and constant
          alpha = star.minAlpha;
          radius = star.baseRadius;
        } else if (!reducedMotion) {
          // Twinkling (Group B) & Accent (Group C): smooth dual-harmonic breathing pulse
          const t = timeSec + star.delay;
          const mainWave = Math.sin(t * (2 * Math.PI / star.cycleDuration) + star.phase);
          const secondaryWave = Math.sin(t * star.harmonicSpeed + star.phase * 1.5) * 0.18;
          const combined = Math.max(-1, Math.min(1, mainWave + secondaryWave));
          const factor = (combined + 1) * 0.5; // Smooth 0 to 1

          alpha = star.minAlpha + (star.peakAlpha - star.minAlpha) * factor;

          // Organic radial expansion during peak brightness so shimmer is clearly visible
          if (star.group === "accent") {
            radius = star.baseRadius * (1.0 + 0.28 * factor);
          } else {
            radius = star.baseRadius * (1.0 + 0.35 * factor);
          }
        } else {
          // Reduced motion: static mid-brightness
          alpha = (star.minAlpha + star.peakAlpha) * 0.5;
          radius = star.baseRadius;
        }

        if (star.group === "accent") {
          // Group C: Bright Accent Star with pulsing soft aura & 4-point sparkle
          const glowRadius = radius * 2.4;
          const grad = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            glowRadius
          );
          grad.addColorStop(0, `rgba(${star.rgb}, ${alpha})`);
          grad.addColorStop(0.35, `rgba(${star.rgb}, ${alpha * 0.55})`);
          grad.addColorStop(1, `rgba(${star.rgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // Delicate cross sparkle that brightens with the star
          ctx.strokeStyle = `rgba(${star.rgb}, ${alpha * 0.42})`;
          ctx.lineWidth = 0.9;
          const arm = radius * 2.6;
          ctx.beginPath();
          ctx.moveTo(star.x - arm, star.y);
          ctx.lineTo(star.x + arm, star.y);
          ctx.moveTo(star.x, star.y - arm);
          ctx.lineTo(star.x, star.y + arm);
          ctx.stroke();
        } else if (star.baseRadius > 1.5) {
          // Small/Medium stars: soft anti-aliased luminous falloff
          const glowRadius = radius * 1.7;
          const grad = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            glowRadius
          );
          grad.addColorStop(0, `rgba(${star.rgb}, ${alpha})`);
          grad.addColorStop(0.45, `rgba(${star.rgb}, ${alpha * 0.45})`);
          grad.addColorStop(1, `rgba(${star.rgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Tiny star: crisp circular disc
          ctx.fillStyle = `rgba(${star.rgb}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    initStars();

    if (reducedMotion) {
      render(0);
    } else {
      animId = requestAnimationFrame(render);
    }

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initStars();
        if (reducedMotion) render(0);
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

/**
 * Cinematic Shooting Star:
 * - Appears randomly every 3-7s (desktop) or 5-10s (mobile)
 * - Strictly maximum ONE active at a time (no meteor shower)
 * - Fast crossing animation (750ms - 1150ms)
 * - Trajectories across open background areas (upper sky & peripheral expanse)
 * - Bright head with elegant gradient trail (white -> cyan -> deep blue -> transparent)
 */
function ShootingStar({ reducedMotion }: { reducedMotion?: boolean }) {
  const lineRef = useRef<THREE.Line>(null);
  const headPointRef = useRef<THREE.Points>(null);

  const stateRef = useRef({
    active: false,
    progress: 0,
    duration: 0.9,
    start: new THREE.Vector3(0, 0, 0),
    end: new THREE.Vector3(0, 0, 0),
    nextSpawnTime: 2.2, // First shooting star appears quickly (~2.2s after load)
  });

  const trailSegments = 18;
  const { lineGeom, headGeom, lineMat, headMat } = useMemo(() => {
    const linePositions = new Float32Array(trailSegments * 3);
    const lineColors = new Float32Array(trailSegments * 3);

    for (let i = 0; i < trailSegments; i++) {
      const t = i / (trailSegments - 1);
      // Head (i = 0) is pure soft white (#F8FAFC), trail transitions to soft cyan (#38BDF8)
      // and then subtle deep blue (#1E40AF)
      if (t < 0.35) {
        const localT = t / 0.35;
        lineColors[i * 3] = THREE.MathUtils.lerp(1.0, 0.24, localT);
        lineColors[i * 3 + 1] = THREE.MathUtils.lerp(1.0, 0.78, localT);
        lineColors[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.98, localT);
      } else {
        const localT = (t - 0.35) / 0.65;
        lineColors[i * 3] = THREE.MathUtils.lerp(0.24, 0.12, localT);
        lineColors[i * 3 + 1] = THREE.MathUtils.lerp(0.78, 0.32, localT);
        lineColors[i * 3 + 2] = THREE.MathUtils.lerp(0.98, 0.85, localT);
      }
    }

    const lGeom = new THREE.BufferGeometry();
    lGeom.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lGeom.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

    const lMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const hGeom = new THREE.BufferGeometry();
    hGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3)
    );
    const hMat = new THREE.PointsMaterial({
      color: new THREE.Color(1.0, 1.0, 1.0),
      size: 0.24,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { lineGeom: lGeom, headGeom: hGeom, lineMat: lMat, headMat: hMat };
  }, []);

  useFrame((state, delta) => {
    if (reducedMotion) return;

    const s = stateRef.current;
    const time = state.clock.getElapsedTime();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    // Trigger spawn when idle and countdown reached
    if (!s.active) {
      if (time >= s.nextSpawnTime) {
        s.active = true;
        s.progress = 0;
        // Fast, realistic crossing duration (Section 14: 700ms - 1200ms)
        s.duration = 0.75 + Math.random() * 0.40; // 0.75s to 1.15s

        // 4 Trajectory Modes avoiding central typography (left-mid):
        // Mode 0: Top-left -> bottom-right across upper sky
        // Mode 1: Top-right -> bottom-left across upper/mid expanse
        // Mode 2: Upper-middle -> lower-right across open right side
        // Mode 3: Upper-right sweep
        const mode = Math.floor(Math.random() * 4);

        if (mode === 0) {
          // Top-left across upper sky
          s.start.set(
            -11.0 + Math.random() * 4.0,
            5.0 + Math.random() * 2.5,
            -1.0 - Math.random() * 2.0
          );
          s.end.set(
            s.start.x + (7.0 + Math.random() * 5.0),
            s.start.y - (3.5 + Math.random() * 2.5),
            s.start.z - 0.5
          );
        } else if (mode === 1) {
          // Top-right -> bottom-left across upper expanse
          s.start.set(
            7.0 + Math.random() * 5.0,
            4.5 + Math.random() * 2.5,
            -1.0 - Math.random() * 2.0
          );
          s.end.set(
            s.start.x - (7.0 + Math.random() * 5.0),
            s.start.y - (4.0 + Math.random() * 2.5),
            s.start.z - 0.5
          );
        } else if (mode === 2) {
          // Upper-mid -> lower-right down the open right expanse
          s.start.set(
            1.5 + Math.random() * 4.0,
            5.5 + Math.random() * 2.0,
            -1.5 - Math.random() * 2.0
          );
          s.end.set(
            s.start.x + (6.0 + Math.random() * 4.0),
            s.start.y - (4.5 + Math.random() * 3.0),
            s.start.z - 0.5
          );
        } else {
          // Upper-right high sky sweep
          s.start.set(
            3.0 + Math.random() * 6.0,
            6.0 + Math.random() * 2.0,
            -2.0 - Math.random() * 2.0
          );
          s.end.set(
            s.start.x - (6.0 + Math.random() * 4.0),
            s.start.y - (3.5 + Math.random() * 2.0),
            s.start.z - 0.5
          );
        }
      }
      return;
    }

    // Active flight animation step
    s.progress += delta / s.duration;

    if (s.progress >= 1.0) {
      // Completed, deactivate and set next randomized interval:
      // Target (Section 10): 3s to 7s randomly on desktop!
      // Mobile: 5s to 10s
      s.active = false;
      const minWait = isMobile ? 5.0 : 3.0;
      const extraWait = isMobile ? 5.0 : 4.0;
      s.nextSpawnTime = time + (minWait + Math.random() * extraWait);
      lineMat.opacity = 0;
      headMat.opacity = 0;
      return;
    }

    // Smooth sinusoidal bell-curve opacity: 0 -> peak ~0.95 -> 0
    const opacity = Math.sin(s.progress * Math.PI) * 0.95;
    lineMat.opacity = opacity;
    headMat.opacity = opacity;

    // Interpolated current head position
    const currentHead = new THREE.Vector3().lerpVectors(
      s.start,
      s.end,
      s.progress
    );

    // Update head point position
    const headAttr = headGeom.attributes.position as THREE.BufferAttribute;
    headAttr.setXYZ(0, currentHead.x, currentHead.y, currentHead.z);
    headAttr.needsUpdate = true;

    // Update trailing segments with progressive lag
    const posAttr = lineGeom.attributes.position as THREE.BufferAttribute;
    const trailLength = 0.18; // Elegant luminous trail lag
    for (let i = 0; i < trailSegments; i++) {
      const trailProgress = Math.max(
        0,
        s.progress - (i / (trailSegments - 1)) * trailLength
      );
      const trailPos = new THREE.Vector3().lerpVectors(
        s.start,
        s.end,
        trailProgress
      );
      posAttr.setXYZ(i, trailPos.x, trailPos.y, trailPos.z);
    }
    posAttr.needsUpdate = true;
  });

  if (reducedMotion) return null;

  return (
    <group>
      <primitive object={new THREE.Line(lineGeom, lineMat)} ref={lineRef} />
      <primitive object={new THREE.Points(headGeom, headMat)} ref={headPointRef} />
    </group>
  );
}

export default function InnovationFieldCanvas() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setReducedMotion(prefersReduced);
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
      {/* 1. Persistent 2D Night Sky Starfield with Realistic Shimmer/Twinkle */}
      <NightSkyStarfield reducedMotion={reducedMotion} />

      {/* 2. WebGL 3D Terrain & Cinematic Shooting Star */}
      <Canvas
        camera={{ position: [0, -1, 9.5], fov: 50 }}
        dpr={
          typeof window !== "undefined" && window.innerWidth < 768
            ? [1, 1.2]
            : [1, 2]
        }
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          depth: false,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <TerrainMesh reducedMotion={reducedMotion} />
        <ShootingStar reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
