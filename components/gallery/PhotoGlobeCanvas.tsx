"use client";

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IGalleryImage } from "@/types/content";
import { Move, Sparkles } from "lucide-react";

interface PhotoGlobeCanvasProps {
  images: IGalleryImage[];
  onSelectImage: (image: IGalleryImage) => void;
}

/**
 * Creates a crisp, high-resolution CanvasTexture representing the photo card.
 */
function createCardTexture(item: IGalleryImage): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Dark metallic gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 340);
    bgGrad.addColorStop(0, "#0D111A");
    bgGrad.addColorStop(1, "#151B26");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 340);

    // Glowing subtle cyber border
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 334);

    // Inner subtle border
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 484, 312);

    // Ambient tech radial glow in center
    const glow = ctx.createRadialGradient(256, 170, 10, 256, 170, 180);
    glow.addColorStop(0, "rgba(37, 99, 235, 0.25)");
    glow.addColorStop(1, "rgba(13, 17, 26, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(16, 16, 480, 308);

    // Tech grid overlay
    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 20; x < 500; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 320);
      ctx.stroke();
    }
    for (let y = 20; y < 320; y += 30) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(492, y);
      ctx.stroke();
    }

    // Category Tag Badge
    const tag = (item.tags && item.tags[0]) || "INNOVATION";
    ctx.fillStyle = "#151B26";
    ctx.fillRect(36, 36, 130, 32);
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, 130, 32);

    ctx.fillStyle = "#38BDF8";
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.textAlign = "center";
    ctx.fillText(tag.toUpperCase(), 101, 57);

    // Cell Archive stamp
    ctx.fillStyle = "#A7AFBE";
    ctx.font = "600 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`ARCHIVE #${item.id.replace("gal-", "")}`, 470, 56);

    // Center Emblem / Icon
    ctx.beginPath();
    ctx.arc(256, 160, 42, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(21, 27, 38, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 160, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#2563EB";
    ctx.fill();

    // Card Title
    ctx.fillStyle = "#F5F7FA";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    
    // Truncate title if long
    let titleText = item.title;
    if (titleText.length > 28) {
      titleText = titleText.substring(0, 25) + "...";
    }
    ctx.fillText(titleText, 36, 265);

    // Institution mark
    ctx.fillStyle = "#A7AFBE";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText("IEDC TKIET • Click to view full record", 36, 295);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface GlobeCardProps {
  item: IGalleryImage;
  position: [number, number, number];
  onSelect: (item: IGalleryImage) => void;
  onHover: (item: IGalleryImage | null) => void;
  isHovered: boolean;
}

function GlobeCard({ item, position, onSelect, onHover, isHovered }: GlobeCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createCardTexture(item), [item]);

  // Set card facing radially outward from sphere origin
  useEffect(() => {
    if (meshRef.current) {
      const normal = new THREE.Vector3(...position).multiplyScalar(2);
      meshRef.current.lookAt(normal);
    }
  }, [position]);

  // Smooth hover scale animation
  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = isHovered ? 1.22 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover(item);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      <planeGeometry args={[2.3, 1.5]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        roughness={0.4}
        metalness={0.2}
        emissive={isHovered ? new THREE.Color("#38BDF8") : new THREE.Color("#000000")}
        emissiveIntensity={isHovered ? 0.35 : 0}
      />
    </mesh>
  );
}

/**
 * Ambient orbital particles around the globe
 */
function GlobeParticles({ count = 220 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cyan = new THREE.Color("#38BDF8");
    const blue = new THREE.Color("#2563EB");

    for (let i = 0; i < count; i++) {
      const r = 5.6 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const color = Math.random() > 0.4 ? cyan : blue;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Interactive Sphere Group handling Pointer and Touch Rotational Inertia
 */
function SphereGroup({
  images,
  onSelectImage,
  setHoveredItem,
  hoveredItem,
  reducedMotion,
}: {
  images: IGalleryImage[];
  onSelectImage: (item: IGalleryImage) => void;
  setHoveredItem: (item: IGalleryImage | null) => void;
  hoveredItem: IGalleryImage | null;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Rotational state targets
  const rotTarget = useRef<{ x: number; y: number }>({ x: 0.1, y: 0 });
  const velocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMoved = useRef<boolean>(false);

  // Fibonacci sphere layout
  const cardsData = useMemo(() => {
    const radius = 5.2;
    const count = images.length;

    return images.map((item, i) => {
      // Golden spiral distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      return {
        item,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, [images]);

  // Pointer event listeners on window to guarantee smooth drag capture
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      hasMoved.current = false;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      dragStart.current = { x: clientX, y: clientY };
      velocity.current = { x: 0, y: 0 };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }

      const factor = 0.005;
      rotTarget.current.y += dx * factor;
      rotTarget.current.x += dy * factor;

      velocity.current = { x: dy * factor, y: dx * factor };
      dragStart.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    window.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);

      window.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, []);

  // Frame tick: smooth inertia damping + idle drift
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!isDragging.current) {
      // Velocity decay (inertia)
      rotTarget.current.x += velocity.current.x;
      rotTarget.current.y += velocity.current.y;
      velocity.current.x *= 0.93;
      velocity.current.y *= 0.93;

      // Ambient drift when idle
      if (!reducedMotion) {
        rotTarget.current.y += delta * 0.07;
      }
    }

    // Clamp vertical tilt to prevent disorienting flip
    rotTarget.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotTarget.current.x));

    // Lerp rotation towards target with smooth damping (0.06)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      rotTarget.current.x,
      0.08
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      rotTarget.current.y,
      0.08
    );
  });

  return (
    <group ref={groupRef}>
      {cardsData.map(({ item, position }) => (
        <GlobeCard
          key={item.id}
          item={item}
          position={position}
          onSelect={(selected) => {
            // Ignore click if user was dragging
            if (!hasMoved.current) {
              onSelectImage(selected);
            }
          }}
          onHover={setHoveredItem}
          isHovered={hoveredItem?.id === item.id}
        />
      ))}
      <GlobeParticles />
    </group>
  );
}

export function PhotoGlobeCanvas({ images, onSelectImage }: PhotoGlobeCanvasProps) {
  const [hoveredItem, setHoveredItem] = useState<IGalleryImage | null>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Check WebGL availability and reduced motion preference
  useEffect(() => {
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
    }
  }, []);

  // WebGL Graceful Fallback
  if (!hasWebGL) {
    return (
      <div className="p-8 rounded-2xl bg-foundation-dark border border-foundation-slate text-center space-y-4">
        <p className="font-sans text-sm text-typo-gray">
          WebGL hardware acceleration is disabled in your environment. Presenting standard gallery view:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelectImage(img)}
              className="p-4 rounded-xl bg-foundation-slate/50 border border-foundation-slate hover:border-brand-blue text-left transition-all"
            >
              <h4 className="font-display font-bold text-typo-white text-base">{img.title}</h4>
              <p className="font-sans text-xs text-typo-gray mt-1">{img.caption}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[540px] sm:h-[640px] md:h-[720px] rounded-3xl bg-foundation-space border border-foundation-slate overflow-hidden select-none touch-none shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
      {/* Subtle radial space glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Interactive Top HUD */}
      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-foundation-dark/80 backdrop-blur-md border border-foundation-slate text-xs font-sans text-brand-cyan">
          <Move className="w-3.5 h-3.5 animate-pulse-slow" />
          <span>Drag to rotate sphere • Tap card to inspect</span>
        </div>

        {hoveredItem && (
          <div className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foundation-dark/90 backdrop-blur-md border border-brand-cyan/50 text-xs font-sans text-typo-white animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="font-semibold">{hoveredItem.title}</span>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 11.5], fov: 48 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[10, 15, 12]} intensity={1.8} />
        <pointLight position={[-10, -10, -5]} color="#2563EB" intensity={1.2} />
        <pointLight position={[10, -10, 5]} color="#38BDF8" intensity={0.8} />

        <SphereGroup
          images={images}
          onSelectImage={onSelectImage}
          setHoveredItem={setHoveredItem}
          hoveredItem={hoveredItem}
          reducedMotion={reducedMotion}
        />
      </Canvas>

      {/* Bottom status badge */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none text-xs font-mono text-typo-gray">
        <span>SPHERICAL NODE ARCHIVE ({images.length} RECORDS)</span>
        <span className="hidden sm:inline">R3F HARDWARE ACCELERATED</span>
      </div>
    </div>
  );
}
