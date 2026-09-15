"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";

/**
 * Clay-style growth machine in real 3D: ideas pour out of a funnel, bounce on a
 * rocking seesaw, get inspected by a magnifier and climb the revenue stairs.
 * Matte clay materials, speckled grass and fog; grain and vignette are CSS overlays
 * (postprocessing N8AO rendered a blank canvas with three 0.186).
 * Balls are simulated with Rapier physics.
 */

const COLORS = ["#e84a5f", "#4d9be6", "#ff8a3d", "#ff8fc0", "#8e6cff", "#ffd23f", "#3fb68b"];

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, repeat: [number, number]) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext("2d")!, w, h);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function speckle(base: string, flecks: string[]) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h * 0.18; i++) {
      ctx.fillStyle = flecks[(Math.random() * flecks.length) | 0];
      ctx.globalAlpha = 0.35 + Math.random() * 0.5;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
  };
}

function Clay({ color, map, side }: { color?: string; map?: THREE.Texture; side?: THREE.Side }) {
  return <meshStandardMaterial color={color} map={map} roughness={0.82} metalness={0} side={side} />;
}

function SkyBackground() {
  const texture = useCanvasTexture(
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#6cc3e6");
      g.addColorStop(0.55, "#b9e4f1");
      g.addColorStop(1, "#dcf1ec");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h * 0.55;
        const r = 20 + Math.random() * 60;
        const cloud = ctx.createRadialGradient(x, y, 0, x, y, r);
        cloud.addColorStop(0, "rgba(255,255,255,0.55)");
        cloud.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = cloud;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    },
    512,
    512,
    [1, 1],
  );
  return <primitive attach="background" object={texture} />;
}

function Responsive() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    cam.position.set(0.3, 3.6, aspect < 1 ? 24 : aspect < 1.5 ? 18 : 14.5);
    cam.lookAt(0.3, 2.3, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Parallax({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (!ref.current || reduced) return;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, state.pointer.x * 0.07, 2.5, dt);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -state.pointer.y * 0.025, 2.5, dt);
  });
  return <group ref={ref}>{children}</group>;
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 12]} />
        <Clay color="#6b4a33" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.75 + i * 0.45, 0]} castShadow>
          <coneGeometry args={[0.55 - i * 0.13, 0.8, 24]} />
          <Clay color={["#2f8d73", "#35997d", "#3ea585"][i]} />
        </mesh>
      ))}
    </group>
  );
}

function Landscape() {
  const grass = useCanvasTexture(speckle("#4e9d57", ["#3b8246", "#6cb866", "#2f6d3a", "#86c77a"]), 256, 256, [26, 26]);
  const hill = useCanvasTexture(speckle("#68b068", ["#55a05a", "#86c77a", "#4a8f50"]), 256, 256, [8, 4]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <Clay map={grass} />
      </mesh>
      {(
        [
          [-9, -2.6, -10, 9],
          [8.5, -2.9, -9, 9.5],
          [0, -4.5, -16, 12],
        ] as [number, number, number, number][]
      ).map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.42, 1]} receiveShadow>
          <sphereGeometry args={[r, 48, 32]} />
          <Clay map={hill} />
        </mesh>
      ))}
      {(
        [
          [-7.2, 0.9, -6.5, 1.1],
          [-6.2, 0.7, -7.2, 0.8],
          [-8.4, 0.5, -5.5, 0.9],
          [6.6, 0.7, -6, 1],
          [7.8, 0.6, -5.2, 0.8],
          [5.4, 0.5, -7.5, 0.7],
        ] as [number, number, number, number][]
      ).map(([x, y, z, s], i) => (
        <Tree key={i} position={[x, y, z]} scale={s} />
      ))}
    </group>
  );
}

function Funnel() {
  const profile = useMemo(() => [new THREE.Vector2(0.2, 0), new THREE.Vector2(0.22, 0.55), new THREE.Vector2(1.05, 1.45), new THREE.Vector2(1.18, 1.52)], []);
  const shapes: [THREE.BufferGeometry, string, [number, number, number]][] = useMemo(
    () => [
      [new THREE.BoxGeometry(0.34, 0.34, 0.34), COLORS[1], [-0.45, 1.5, 0.1]],
      [new THREE.ConeGeometry(0.22, 0.42, 20), COLORS[4], [0.1, 1.62, -0.3]],
      [new THREE.SphereGeometry(0.2, 24, 24), COLORS[0], [0.45, 1.5, 0.2]],
      [new THREE.BoxGeometry(0.3, 0.3, 0.3), COLORS[3], [0, 1.52, 0.4]],
      [new THREE.SphereGeometry(0.18, 24, 24), COLORS[2], [-0.2, 1.6, -0.45]],
      [new THREE.ConeGeometry(0.2, 0.36, 20), COLORS[0], [0.55, 1.55, -0.35]],
    ],
    [],
  );
  return (
    <group position={[-1.3, 3.25, -0.8]} rotation={[0.18, 0, 0]}>
      <mesh castShadow>
        <latheGeometry args={[profile, 64]} />
        <Clay color="#efe6d6" side={THREE.DoubleSide} />
      </mesh>
      {shapes.map(([geometry, color, position], i) => (
        <mesh key={i} geometry={geometry} position={position} rotation={[i * 0.7, i * 0.4, 0]} castShadow>
          <Clay color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Trough() {
  return (
    <group position={[-1.9, 3.35, -1.25]} rotation={[0, 0, -0.1]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 4.4, 32, 1, true, Math.PI, Math.PI]} />
        <Clay color="#f07b3f" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PencilStand() {
  return (
    <group position={[-4.6, 0, 0.4]}>
      <RoundedBox args={[2.2, 0.22, 0.7]} radius={0.08} position={[0, 0.11, 0]} castShadow receiveShadow>
        <Clay color="#3aa7a0" />
      </RoundedBox>
      {[-0.8, 0.8].map((x) => (
        <RoundedBox key={x} args={[0.26, 1.7, 0.26]} radius={0.08} position={[x, 0.95, 0]} castShadow>
          <Clay color="#3aa7a0" />
        </RoundedBox>
      ))}
      <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.8, 16]} />
        <Clay color="#2c7f79" />
      </mesh>
      <group position={[0.1, 1.55, 0.25]} rotation={[0, 0, -0.55]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 1.9, 6]} />
          <Clay color="#3f7ee8" />
        </mesh>
        <mesh position={[0, 1.08, 0]} castShadow>
          <cylinderGeometry args={[0.155, 0.155, 0.22, 16]} />
          <Clay color="#c9ccd4" />
        </mesh>
        <mesh position={[0, 1.3, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.12, 8, 16]} />
          <Clay color="#ff8fa3" />
        </mesh>
        <mesh position={[0, -1.15, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.15, 0.4, 16]} />
          <Clay color="#f1d7b0" />
        </mesh>
      </group>
    </group>
  );
}

function Seesaw({ reduced }: { reduced: boolean }) {
  const body = useRef<RapierRigidBody>(null);
  const stripes = useCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#9cc04a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#7fa63a";
      ctx.lineWidth = 6;
      for (let x = -h; x < w + h; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }
    },
    128,
    32,
    [10, 1],
  );
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);

  useFrame((state) => {
    if (!body.current) return;
    e.set(0, 0, reduced ? -0.08 : Math.sin(state.clock.elapsedTime * 0.8) * 0.13 - 0.04);
    body.current.setNextKinematicRotation(q.setFromEuler(e));
  });

  return (
    <>
      <mesh position={[0.3, 0.55, 0.4]} castShadow>
        <coneGeometry args={[0.45, 1.1, 4]} />
        <Clay color="#efe6d6" />
      </mesh>
      <RigidBody ref={body} type="kinematicPosition" position={[0.3, 1.25, 0.4]} colliders={false}>
        <CuboidCollider args={[2.8, 0.2, 0.35]} />
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <capsuleGeometry args={[0.24, 5.4, 12, 32]} />
          <Clay map={stripes} />
        </mesh>
      </RigidBody>
    </>
  );
}

function Magnifier({ reduced }: { reduced: boolean }) {
  const cube = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    if (cube.current && !reduced) {
      cube.current.rotation.y += dt * 0.6;
      cube.current.position.y = 0.05 * Math.sin(state.clock.elapsedTime * 1.5);
    }
  });
  return (
    <group position={[0.35, 0, 1.5]}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.5, 16]} />
        <Clay color="#efe6d6" />
      </mesh>
      <group position={[0, 2.25, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.72, 0.11, 24, 64]} />
          <Clay color="#efe6d6" />
        </mesh>
        <mesh>
          <circleGeometry args={[0.66, 48]} />
          <meshPhysicalMaterial color="#dff4fb" transmission={0.9} roughness={0.08} thickness={0.2} transparent opacity={0.45} />
        </mesh>
        <mesh ref={cube} castShadow>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <Clay color="#e84a5f" />
        </mesh>
      </group>
    </group>
  );
}

function Pinwheel({ reduced }: { reduced: boolean }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current && !reduced) blades.current.rotation.z -= dt * 1.4;
  });
  return (
    <group position={[2.0, 0, -1.3]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 2.8, 12]} />
        <Clay color="#3a9fa0" />
      </mesh>
      <group ref={blades} position={[0, 2.85, 0.12]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0.35, 0, (i * Math.PI) / 2]} castShadow>
            <boxGeometry args={[1.1, 0.2, 0.04]} />
            <Clay color="#46b0ae" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CurlyTube() {
  const { tube, hornPosition, hornQuaternion } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      (
        [
          [0.5, 4.4, -1.7],
          [1.4, 5.0, -1.6],
          [2.5, 4.9, -1.4],
          [3.2, 4.0, -1.2],
          [2.8, 3.2, -1.1],
          [2.1, 3.4, -1.1],
          [2.1, 4.1, -1.2],
          [2.9, 4.4, -1.3],
          [3.9, 3.9, -1.3],
          [4.6, 3.3, -1.2],
        ] as [number, number, number][]
      ).map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    const end = curve.getPoint(1);
    const tangent = curve.getTangent(1);
    return {
      tube: new THREE.TubeGeometry(curve, 220, 0.22, 20, false),
      hornPosition: end.clone().add(tangent.clone().multiplyScalar(0.35)),
      hornQuaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), tangent.clone().normalize()),
    };
  }, []);
  return (
    <group>
      <mesh geometry={tube} castShadow>
        <Clay color="#4d9be6" />
      </mesh>
      <mesh position={[0.5, 4.4, -1.7]} castShadow>
        <sphereGeometry args={[0.26, 24, 24]} />
        <Clay color="#4d9be6" />
      </mesh>
      <mesh position={hornPosition} quaternion={hornQuaternion} castShadow>
        <coneGeometry args={[0.55, 0.8, 32, 1, true]} />
        <Clay color="#4d9be6" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Stairs() {
  const steps = [0.7, 1.35, 2.0, 2.7, 3.4];
  const tones = ["#f08a4b", "#f3a261", "#efbb7f", "#ecd09c", "#f1dfb8"];
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[3.4, 0, 0.1]}>
      {steps.map((h, i) => (
        <RoundedBox key={i} args={[0.62, h, 1.3]} radius={0.06} position={[i * 0.6, h / 2, 0]} castShadow receiveShadow>
          <Clay color={tones[i]} />
        </RoundedBox>
      ))}
    </RigidBody>
  );
}

function Mailbox() {
  return (
    <group position={[-1.9, 0, 1.6]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.7, 12]} />
        <Clay color="#efe6d6" />
      </mesh>
      <RoundedBox args={[1.1, 0.55, 0.62]} radius={0.12} position={[0, 0.9, 0]} castShadow>
        <Clay color="#5aa9e6" />
      </RoundedBox>
      <mesh position={[0, 1.17, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.31, 0.31, 1.1, 32, 1, false, 0, Math.PI]} />
        <Clay color="#5aa9e6" />
      </mesh>
      <group position={[0.35, 1.3, 0.34]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.06, 0.6, 0.04]} />
          <Clay color="#d9403b" />
        </mesh>
        <mesh position={[0.13, 0.48, 0]} castShadow>
          <boxGeometry args={[0.28, 0.16, 0.04]} />
          <Clay color="#e84a5f" />
        </mesh>
      </group>
    </group>
  );
}

type Ball = { id: number; color: string; x: number; z: number };

function Balls({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [balls, setBalls] = useState<Ball[]>([]);
  useEffect(() => {
    if (!active || reduced) return;
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setBalls((b) => [...b.slice(-11), { id: Date.now(), color: COLORS[n % COLORS.length], x: -1.25 + (Math.random() - 0.5) * 0.25, z: 0.3 + (Math.random() - 0.5) * 0.2 }]);
    }, 1300);
    return () => window.clearInterval(timer);
  }, [active, reduced]);

  return (
    <>
      {balls.map((b) => (
        <RigidBody key={b.id} colliders="ball" position={[b.x, 3.1, b.z]} restitution={0.55} friction={0.35} linearVelocity={[0.4, 0, 0.15]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 32, 32]} />
            <Clay color={b.color} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

function StaticBalls() {
  const balls: [number, number, number, string, number][] = [
    [-3.1, 0.22, 1.9, "#ffd23f", 0.22],
    [0.9, 0.2, 2.6, "#ff8a3d", 0.2],
    [-1.5, 0.2, 2.35, "#ff8fc0", 0.18],
    [3.0, 0.2, 1.5, "#8e6cff", 0.2],
    [-2.6, 4.7, -0.4, "#ffd23f", 0.18],
  ];
  return (
    <>
      {balls.map(([x, y, z, color, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 32, 32]} />
          <Clay color={color} />
        </mesh>
      ))}
      <mesh position={[1.4, 0.012, 2.9]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.55, 40]} />
        <meshBasicMaterial color="#10261a" />
      </mesh>
    </>
  );
}

export function ClayMachineScene({ eventSource, active = true }: { eventSource?: RefObject<HTMLElement | null>; active?: boolean }) {
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0.3, 3.6, 14.5], fov: 30 }}
      eventSource={eventSource as RefObject<HTMLElement> | undefined}
      eventPrefix="client"
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="!absolute inset-0"
    >
      <SkyBackground />
      <Responsive />
      <fog attach="fog" args={["#c9e9f1", 16, 38]} />
      <hemisphereLight args={["#e6f7ff", "#3b6e45", 1.1]} />
      <directionalLight
        position={[5, 10, 7]}
        intensity={2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0004}
      />

      <Parallax reduced={reduced}>
        <Landscape />
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]} paused={!active}>
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[12, 0.1, 6]} position={[0, -0.1, 0]} />
              <CuboidCollider args={[12, 3, 0.1]} position={[0, 3, 3.6]} />
              <CuboidCollider args={[12, 3, 0.1]} position={[0, 3, -2.4]} />
              <CuboidCollider args={[0.1, 3, 6]} position={[-7, 3, 0]} />
              <CuboidCollider args={[0.1, 3, 6]} position={[7, 3, 0]} />
            </RigidBody>
            <Seesaw reduced={reduced} />
            <Stairs />
            <Balls active={active} reduced={reduced} />
          </Physics>
        </Suspense>
        <Funnel />
        <Trough />
        <PencilStand />
        <Magnifier reduced={reduced} />
        <Pinwheel reduced={reduced} />
        <CurlyTube />
        <Mailbox />
        <StaticBalls />
      </Parallax>

    </Canvas>
  );
}
