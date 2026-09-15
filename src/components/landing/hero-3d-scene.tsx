"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";

/**
 * The Kaya mark in 3D: three clay pills grow out of an ink slab ("Kaya grows it"),
 * surrounded by floating clay shapes. Follows the pointer; pills bump on hover.
 */

const PALETTE = { tangerine: "#ff7a3d", lime: "#cdef5c", blue: "#4d78ff", pink: "#ff8fc0", lilac: "#9c80ff", sun: "#ffc83d", grass: "#3da863" };

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function Clay({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={0.45} clearcoatRoughness={0.35} sheen={0.6} sheenColor="#ffffff" />;
}

function Pill({ x, height, color, delay, reduced }: { x: number; height: number; color: string; delay: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const bump = useRef(0);
  const [hovered, setHovered] = useState(false);
  const r = 0.34;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current - delay;
    const grow = reduced ? 1 : easeOutBack(THREE.MathUtils.clamp(t / 1.1, 0, 1));
    const breathe = reduced ? 0 : Math.sin(state.clock.elapsedTime * 1.4 + x * 2.2) * 0.035;
    bump.current = THREE.MathUtils.damp(bump.current, hovered ? 0.14 : 0, 7, dt);
    g.scale.y = Math.max(0.001, grow * (1 + breathe + bump.current));
  });

  return (
    <group ref={group} position={[x, 0.175, 0]}>
      <mesh
        position={[0, height / 2 + r, 0]}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <capsuleGeometry args={[r, height, 16, 40]} />
        <Clay color={color} />
      </mesh>
    </group>
  );
}

function Rig({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const drift = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.22) * 0.22;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.45 + drift + state.pointer.x * 0.45, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.06 - state.pointer.y * 0.12, 3, dt);
  });
  return <group ref={ref}>{children}</group>;
}

/** On wide screens the scene spans the whole hero; shift the objects into the right half. */
function Offset({ children }: { children: ReactNode }) {
  const { size, viewport } = useThree();
  const wide = size.width >= 1024;
  return <group position={[wide ? viewport.width * 0.22 : 0, 0, 0]}>{children}</group>;
}

function Floater({ children, speed, reduced }: { children: ReactNode; speed: number; reduced: boolean }) {
  return (
    <Float speed={reduced ? 0 : speed} rotationIntensity={reduced ? 0 : 0.9} floatIntensity={reduced ? 0 : 1.3}>
      {children}
    </Float>
  );
}

export function Hero3DScene({ eventSource, active = true }: { eventSource?: RefObject<HTMLElement | null>; active?: boolean }) {
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 2.4, 12.5], fov: 30 }}
      eventSource={eventSource as RefObject<HTMLElement> | undefined}
      eventPrefix="client"
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera }) => camera.lookAt(0, 1.2, 0)}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 5]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 6, -3]} scale={[12, 6, 1]} />
        <Lightformer intensity={1.2} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer intensity={0.8} color="#ffe8d6" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
      </Environment>

      <Offset>
      <Rig reduced={reduced}>
        <group position={[0, -0.4, 0]}>
          <RoundedBox args={[3.3, 0.35, 1.7]} radius={0.17} smoothness={6} castShadow receiveShadow>
            <meshPhysicalMaterial color="#111111" roughness={0.3} clearcoat={1} clearcoatRoughness={0.18} />
          </RoundedBox>
          <Pill x={-0.98} height={0.9} color={PALETTE.tangerine} delay={0.1} reduced={reduced} />
          <Pill x={0} height={1.6} color={PALETTE.lime} delay={0.28} reduced={reduced} />
          <Pill x={0.98} height={2.35} color={PALETTE.blue} delay={0.46} reduced={reduced} />
        </group>

        <Floater speed={1.6} reduced={reduced}>
          <mesh position={[-2.5, 2.4, -0.6]} castShadow>
            <sphereGeometry args={[0.36, 48, 48]} />
            <Clay color={PALETTE.pink} />
          </mesh>
        </Floater>
        <Floater speed={1.3} reduced={reduced}>
          <mesh position={[2.45, 2.7, -0.5]} rotation={[0.7, 0.3, 0]} castShadow>
            <torusGeometry args={[0.38, 0.16, 32, 64]} />
            <Clay color={PALETTE.lilac} />
          </mesh>
        </Floater>
        <Floater speed={1.9} reduced={reduced}>
          <mesh position={[-2.3, 0.3, 1.1]} rotation={[0.3, 0, 0.5]} castShadow>
            <coneGeometry args={[0.34, 0.72, 48]} />
            <Clay color={PALETTE.sun} />
          </mesh>
        </Floater>
        <Floater speed={1.4} reduced={reduced}>
          <RoundedBox args={[0.62, 0.62, 0.62]} radius={0.15} smoothness={5} position={[2.3, 0.35, 1.0]} rotation={[0.4, 0.6, 0]} castShadow>
            <Clay color={PALETTE.grass} />
          </RoundedBox>
        </Floater>
        <Floater speed={2.2} reduced={reduced}>
          <mesh position={[1.1, 3.5, -1.1]} castShadow>
            <sphereGeometry args={[0.2, 32, 32]} />
            <Clay color={PALETTE.lime} />
          </mesh>
        </Floater>
      </Rig>

      <ContactShadows position={[0, -0.6, 0]} opacity={0.32} scale={12} blur={2.6} far={4} resolution={512} color="#3b3226" />
      </Offset>
    </Canvas>
  );
}
