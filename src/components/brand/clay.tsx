/**
 * Kaya clay illustrations. Soft matte shapes lit from the top left, one idea per
 * scene. Drawn in SVG so they stay crisp, light and themable.
 *
 * Motion: elements tagged `m-anim m-*` animate once an ancestor has
 * data-inview="true" (see InView in components/marketing/motion.tsx).
 * CSS transforms override SVG transform attributes, so animated groups never
 * carry their own `transform` attribute; they wrap one instead.
 */
import type { CSSProperties } from "react";

export const CLAY = {
  lime: ["#f4ffc9", "#d4f36b", "#8faf22"],
  blue: ["#cfddff", "#4d78ff", "#2240b0"],
  tangerine: ["#ffd6bd", "#ff7a3d", "#bf4a12"],
  lilac: ["#e6deff", "#9c80ff", "#5636bf"],
  sun: ["#fff2bf", "#ffc83d", "#c08a06"],
  grass: ["#c4efcf", "#3da863", "#1c653a"],
  pink: ["#ffe0ee", "#ff8fc0", "#c2477f"],
  cream: ["#ffffff", "#efeae0", "#c7bfaf"],
} as const;

export type ClayTone = keyof typeof CLAY;

const radial = (id: string, t: ClayTone) => `url(#${id}-${t}-r)`;
const horizontal = (id: string, t: ClayTone) => `url(#${id}-${t}-h)`;
const vertical = (id: string, t: ClayTone) => `url(#${id}-${t}-v)`;
const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

function Defs({ id }: { id: string }) {
  return (
    <defs>
      {(Object.keys(CLAY) as ClayTone[]).map((tone) => {
        const [light, base, deep] = CLAY[tone];
        return (
          <g key={tone}>
            <radialGradient id={`${id}-${tone}-r`} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor={light} />
              <stop offset="0.5" stopColor={base} />
              <stop offset="1" stopColor={deep} />
            </radialGradient>
            <linearGradient id={`${id}-${tone}-h`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={light} />
              <stop offset="0.42" stopColor={base} />
              <stop offset="1" stopColor={deep} />
            </linearGradient>
            <linearGradient id={`${id}-${tone}-v`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={light} />
              <stop offset="0.45" stopColor={base} />
              <stop offset="1" stopColor={deep} />
            </linearGradient>
          </g>
        );
      })}
      <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
      </filter>
    </defs>
  );
}

function Grain({ id, w, h }: { id: string; w: number; h: number }) {
  return <rect width={w} height={h} filter={`url(#${id}-grain)`} opacity="0.07" style={{ mixBlendMode: "multiply" }} pointerEvents="none" />;
}

function Sphere({ id, cx, cy, r, tone, className, style }: { id: string; cx: number; cy: number; r: number; tone: ClayTone; className?: string; style?: CSSProperties }) {
  const hx = cx - r * 0.35;
  const hy = cy - r * 0.42;
  return (
    <g className={className} style={style}>
      <circle cx={cx} cy={cy} r={r} fill={radial(id, tone)} />
      <ellipse cx={hx} cy={hy} rx={r * 0.3} ry={r * 0.16} fill="#fff" opacity="0.5" transform={`rotate(-32 ${hx} ${hy})`} />
    </g>
  );
}

function Shadow({ id, cx, cy, rx, opacity = 0.22 }: { id: string; cx: number; cy: number; rx: number; opacity?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.16} fill="#10261b" opacity={opacity} filter={`url(#${id}-soft)`} />;
}

function Column({ id, x, bottom, w, height, tone }: { id: string; x: number; bottom: number; w: number; height: number; tone: ClayTone }) {
  const y = bottom - height;
  return (
    <g>
      <rect x={x} y={y} width={w} height={height} rx={w * 0.22} fill={horizontal(id, tone)} />
      <ellipse cx={x + w / 2} cy={y + w * 0.2} rx={w / 2 - 3} ry={w * 0.16} fill={CLAY[tone][0]} opacity="0.75" />
    </g>
  );
}

function Tree({ id, x, y, s = 1 }: { id: string; x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="-8" width="10" height="24" rx="4" fill="#8a5e3c" />
      <path d="M0 -96 C 17 -72 36 -32 38 -14 Q 0 4 -38 -14 C -36 -32 -17 -72 0 -96Z" fill={horizontal(id, "grass")} />
      <path d="M-8 -70 C -14 -52 -22 -34 -24 -22" stroke="#fff" strokeOpacity="0.28" strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.95">
      <ellipse cx="0" cy="10" rx="70" ry="22" fill="#eef6fa" />
      <circle cx="-28" cy="0" r="26" fill="#fff" />
      <circle cx="10" cy="-10" r="34" fill="#fff" />
      <circle cx="44" cy="4" r="22" fill="#fff" />
    </g>
  );
}

type SceneProps = { className?: string };

/** Former home hero: a funnel of ideas feeds a tube into rising revenue bars. */
export function HeroScene({ className }: SceneProps) {
  const id = "hero";
  return (
    <svg viewBox="0 -90 1440 730" preserveAspectRatio="xMidYMax slice" className={className} role="img" aria-label="Clay machine turning colored ideas into rising revenue bars">
      <Defs id={id} />
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b7dcf0" />
          <stop offset="0.72" stopColor="#e6f2e5" />
        </linearGradient>
        <linearGradient id="hero-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52ab6c" />
          <stop offset="0.5" stopColor="#35714f" />
          <stop offset="1" stopColor="#24533d" />
        </linearGradient>
      </defs>
      <rect y="-90" width="1440" height="730" fill="url(#hero-sky)" />
      <Cloud x={190} y={112} />
      <Cloud x={1190} y={84} s={1.2} />
      <path d="M0 330 C 220 270 400 300 580 320 S 920 270 1120 300 S 1350 280 1440 300 V640 H0Z" fill="#a6d9ae" />
      <Tree id={id} x={120} y={352} s={0.7} />
      <Tree id={id} x={1300} y={318} s={0.65} />
      <path d="M0 390 C 240 340 430 370 650 390 S 1010 350 1210 370 S 1380 360 1440 368 V640 H0Z" fill="#74c186" />
      <Tree id={id} x={70} y={420} s={0.95} />
      <Tree id={id} x={1345} y={402} s={1.05} />
      <path d="M0 440 C 300 410 600 425 900 432 S 1300 415 1440 425 V640 H0Z" fill="url(#hero-ground)" />
      <Shadow id={id} cx={660} cy={466} rx={210} />
      <Shadow id={id} cx={1060} cy={466} rx={150} />
      <Column id={id} x={968} bottom={462} w={52} height={72} tone="sun" />
      <Column id={id} x={1028} bottom={462} w={52} height={124} tone="sun" />
      <Column id={id} x={1088} bottom={462} w={52} height={180} tone="tangerine" />
      <Column id={id} x={1148} bottom={462} w={52} height={244} tone="tangerine" />
      <path d="M626 462 L660 352 L694 462 Z" fill={horizontal(id, "cream")} />
      <g transform="rotate(-7 660 346)">
        <rect x="470" y="333" width="390" height="26" rx="13" fill={vertical(id, "lime")} />
      </g>
      <path d="M660 198 C 660 266 742 274 802 236 S 902 154 962 200 S 1094 254 1172 218" fill="none" stroke={vertical(id, "blue")} strokeWidth="34" strokeLinecap="round" />
      <path d="M545 78 L775 78 L686 176 L686 204 L634 204 L634 176 Z" fill={horizontal(id, "cream")} />
      <ellipse cx="660" cy="78" rx="115" ry="24" fill={radial(id, "cream")} />
      <Sphere id={id} cx={606} cy={62} r={22} tone="lime" />
      <Sphere id={id} cx={658} cy={52} r={25} tone="blue" />
      <Sphere id={id} cx={712} cy={64} r={20} tone="tangerine" />
      <g transform="translate(0 -90)">
        <Grain id={id} w={1440} h={730} />
      </g>
    </svg>
  );
}

type SpotProps = { className?: string };

export function UnderstandSpot({ className }: SpotProps) {
  const id = "understand";
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Clay magnifying glass scanning a web page">
      <Defs id={id} />
      <Shadow id={id} cx={250} cy={352} rx={170} />
      <g className="m-anim m-float">
        <g transform="rotate(-6 240 190)">
          <rect x="80" y="84" width="270" height="200" rx="24" fill="#fff" />
          <rect x="80" y="84" width="270" height="36" rx="18" fill="#f2eee6" />
          <circle cx="104" cy="102" r="6" fill="#ff7a3d" />
          <circle cx="124" cy="102" r="6" fill="#ffc83d" />
          <circle cx="144" cy="102" r="6" fill="#3da863" />
          <rect x="104" y="142" width="130" height="14" rx="7" fill="#0b0b0b" opacity="0.85" />
          <rect className="m-anim m-shimmer" style={delay(0)} x="104" y="168" width="190" height="9" rx="4.5" fill="#d9d4c9" />
          <rect className="m-anim m-shimmer" style={delay(0.4)} x="104" y="186" width="160" height="9" rx="4.5" fill="#d9d4c9" />
          <rect className="m-anim m-shimmer" style={delay(0.8)} x="104" y="220" width="70" height="40" rx="10" fill="#eaf0ff" />
          <rect className="m-anim m-shimmer" style={delay(1.2)} x="186" y="220" width="70" height="40" rx="10" fill="#f3fbd6" />
        </g>
      </g>
      <g className="m-anim m-scan">
        <path d="M352 262 L424 336" stroke={horizontal(id, "blue")} strokeWidth="34" strokeLinecap="round" />
        <circle cx="300" cy="210" r="80" fill="#fff" opacity="0.28" />
        <circle cx="300" cy="210" r="80" fill="none" stroke={radial(id, "blue")} strokeWidth="26" />
        <path d="M252 168 Q 270 146 300 142" stroke="#fff" strokeOpacity="0.6" strokeWidth="8" strokeLinecap="round" fill="none" />
      </g>
      <Sphere id={id} cx={112} cy={320} r={26} tone="lime" className="m-anim m-bounce" style={delay(0.3)} />
      <Sphere id={id} cx={420} cy={112} r={18} tone="tangerine" className="clay-float" />
      <Sphere id={id} cx={70} cy={150} r={13} tone="lilac" className="clay-float-slow" />
    </svg>
  );
}

export function DecideSpot({ className }: SpotProps) {
  const id = "decide";
  const coins = (x: number, n: number, tone: ClayTone, stack: number) =>
    Array.from({ length: n }, (_, i) => {
      const y = 330 - i * 20;
      return (
        <g key={`${x}-${i}`} className="m-anim m-drop" style={delay(stack * 0.2 + i * 0.07)}>
          <rect x={x - 46} y={y} width="92" height="20" rx="8" fill={horizontal(id, tone)} />
          <ellipse cx={x} cy={y} rx="46" ry="14" fill={radial(id, tone)} />
        </g>
      );
    });
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Clay coin stacks growing under a rising arrow">
      <Defs id={id} />
      <Shadow id={id} cx={240} cy={356} rx={190} />
      {coins(120, 3, "sun", 0)}
      {coins(240, 6, "sun", 1)}
      {coins(360, 10, "tangerine", 2)}
      <path
        className="m-anim m-draw"
        style={delay(1.3)}
        pathLength={1}
        d="M72 250 C 150 220 220 170 300 120 S 380 72 410 62"
        stroke={vertical(id, "lime")}
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
      />
      <g className="m-anim m-pop" style={delay(2.3)}>
        <path d="M430 50 L 382 52 L 414 96 Z" fill={radial(id, "lime")} strokeLinejoin="round" stroke="#8faf22" strokeWidth="2" />
      </g>
      <Sphere id={id} cx={70} cy={120} r={16} tone="blue" className="clay-float" />
    </svg>
  );
}

export function ExperimentSpot({ className }: SpotProps) {
  const id = "experiment";
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Clay lab flask with bubbling experiments">
      <Defs id={id} />
      <Shadow id={id} cx={240} cy={356} rx={180} />
      <g className="m-anim m-tilt">
        <path d="M196 70 h72 v84 l86 150 a26 26 0 0 1 -22 40 H132 a26 26 0 0 1 -22 -40 l86 -150 z" fill="#fff" opacity="0.6" />
        <g className="m-anim m-slosh">
          <path d="M150 250 h164 l40 54 a26 26 0 0 1 -22 40 H132 a26 26 0 0 1 -22 -40 z" fill={vertical(id, "lilac")} />
        </g>
        {[
          [196, 300, 11, 0],
          [236, 310, 8, 0.9],
          [268, 296, 10, 1.7],
          [218, 320, 6, 2.3],
        ].map(([cx, cy, r, d], i) => (
          <circle key={i} className="m-anim m-bubble" style={delay(d)} cx={cx} cy={cy} r={r} fill="#e6deff" />
        ))}
        <path d="M196 70 h72 v84 l86 150 a26 26 0 0 1 -22 40 H132 a26 26 0 0 1 -22 -40 l86 -150 z" fill="none" stroke={horizontal(id, "cream")} strokeWidth="10" strokeLinejoin="round" />
        <rect x="186" y="58" width="92" height="20" rx="10" fill={vertical(id, "cream")} />
      </g>
      <rect x="344" y="220" width="70" height="124" rx="16" fill="#fff" opacity="0.6" />
      <g className="m-anim m-fill">
        <rect x="344" y="270" width="70" height="74" rx="16" fill={horizontal(id, "grass")} />
      </g>
      <rect x="344" y="220" width="70" height="124" rx="16" fill="none" stroke={horizontal(id, "cream")} strokeWidth="8" />
      <g className="m-anim m-grow" style={delay(0.2)}>
        <Column id={id} x={62} bottom={344} w={44} height={120} tone="lime" />
      </g>
      <Sphere id={id} cx={84} cy={200} r={14} tone="tangerine" className="clay-float" />
    </svg>
  );
}

export function ControlSpot({ className }: SpotProps) {
  const id = "control";
  const dots: [number, number, ClayTone, number][] = [
    [142, 236, "cream", 0],
    [186, 272, "sun", 2],
    [294, 272, "lime", 4],
    [338, 236, "tangerine", 6],
  ];
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Clay control dial cycling through four autonomy settings">
      <Defs id={id} />
      <Shadow id={id} cx={240} cy={350} rx={170} />
      <rect x="110" y="236" width="260" height="84" rx="42" fill={vertical(id, "cream")} />
      <ellipse cx="240" cy="236" rx="130" ry="56" fill={radial(id, "cream")} />
      <ellipse cx="240" cy="226" rx="84" ry="36" fill={horizontal(id, "lilac")} />
      <ellipse cx="240" cy="210" rx="84" ry="36" fill={radial(id, "lilac")} />
      <g className="m-anim m-dial">
        <rect x="232" y="150" width="16" height="64" rx="8" fill="#0b0b0b" />
        <circle cx="240" cy="210" r="12" fill="#0b0b0b" />
      </g>
      {dots.map(([cx, cy, tone, d]) => (
        <Sphere key={tone} id={id} cx={cx} cy={cy} r={11} tone={tone} className="m-anim m-dot" style={delay(d)} />
      ))}
      <g className="m-anim m-bob">
        <path d="M370 70 C 400 84 430 88 452 86 C 452 150 428 190 370 216 C 312 190 288 150 288 86 C 310 88 340 84 370 70Z" fill={radial(id, "blue")} />
        <path className="m-anim m-draw" style={delay(0.6)} pathLength={1} d="M346 142 L364 160 L398 122" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

export function LearnSpot({ className }: SpotProps) {
  const id = "learn";
  const blocks: [number, number, number, ClayTone][] = [
    [110, 284, 260, "blue"],
    [140, 222, 200, "tangerine"],
    [170, 160, 140, "lilac"],
    [196, 98, 88, "lime"],
  ];
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Clay blocks stacking into a tower with a sprout growing on top">
      <Defs id={id} />
      <Shadow id={id} cx={240} cy={356} rx={170} />
      {blocks.map(([x, y, w, tone], i) => (
        <g key={tone} className="m-anim m-drop" style={delay(i * 0.25)}>
          <rect x={x} y={y} width={w} height="58" rx="14" fill={horizontal(id, tone)} />
          <rect x={x + 8} y={y + 6} width={w - 16} height="8" rx="4" fill="#fff" opacity="0.35" />
        </g>
      ))}
      <g className="m-anim m-sprout" style={delay(1.2)}>
        <path d="M240 98 C 240 70 240 56 240 40" stroke="#1c653a" strokeWidth="8" strokeLinecap="round" />
        <path d="M240 62 C 214 60 196 40 196 20 C 222 22 238 38 240 62Z" fill={radial(id, "grass")} />
        <path d="M240 50 C 264 46 282 26 284 8 C 258 10 242 26 240 50Z" fill={radial(id, "grass")} />
      </g>
      <Sphere id={id} cx={400} cy={320} r={22} tone="sun" className="m-anim m-bounce" style={delay(1.6)} />
      <Sphere id={id} cx={86} cy={180} r={14} tone="pink" className="clay-float" />
    </svg>
  );
}

/** Low horizon of hills for closing sections: trees sway, balls bounce. */
export function HillsStrip({ className }: SceneProps) {
  const id = "hills";
  const trees: [number, number, number][] = [
    [220, 160, 0.8],
    [1180, 140, 0.9],
    [1240, 150, 0.65],
  ];
  const front: [number, number, number][] = [
    [90, 222, 1],
    [1350, 214, 1.1],
  ];
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <Defs id={id} />
      <path d="M0 150 C 220 90 420 120 640 140 S 1040 90 1240 118 S 1400 110 1440 116 V260 H0Z" fill="#a6d9ae" />
      {trees.map(([x, y, s], i) => (
        <g key={x} className="m-anim m-sway" style={delay(i * 0.7)}>
          <Tree id={id} x={x} y={y} s={s} />
        </g>
      ))}
      <path d="M0 200 C 300 160 640 180 900 188 S 1300 168 1440 176 V260 H0Z" fill="#6fbd82" />
      {front.map(([x, y, s], i) => (
        <g key={x} className="m-anim m-sway" style={delay(0.4 + i)}>
          <Tree id={id} x={x} y={y} s={s} />
        </g>
      ))}
      <Sphere id={id} cx={520} cy={196} r={16} tone="tangerine" className="m-anim m-bounce" style={delay(0)} />
      <Sphere id={id} cx={760} cy={200} r={20} tone="blue" className="m-anim m-bounce" style={delay(0.5)} />
      <Sphere id={id} cx={980} cy={196} r={14} tone="lime" className="m-anim m-bounce" style={delay(1)} />
    </svg>
  );
}

/** 4-point puffy clay star inspired by Clay's brand motifs. */
export function ClayStar({
  tone = "sun",
  size = 40,
  className,
}: {
  tone?: ClayTone;
  size?: number;
  className?: string;
}) {
  const id = `star-${tone}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <Defs id={id} />
      <Shadow id={id} cx={50} cy={88} rx={36} opacity={0.25} />
      <path
        d="M 50 12 C 51 32, 68 49, 88 50 C 68 51, 51 68, 50 88 C 49 68, 32 51, 12 50 C 32 49, 49 32, 50 12 Z"
        fill={radial(id, tone)}
      />
      <ellipse
        cx="44"
        cy="40"
        rx="12"
        ry="7"
        fill="#ffffff"
        opacity="0.55"
        transform="rotate(-25 44 40)"
      />
    </svg>
  );
}

/** Wavy soft matte clay squiggle / noodle tube. */
export function ClaySquiggle({
  tone = "blue",
  width = 120,
  height = 48,
  className,
}: {
  tone?: ClayTone;
  width?: number;
  height?: number;
  className?: string;
}) {
  const id = `squiggle-${tone}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 60"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <Defs id={id} />
      <path
        d="M 12 40 C 35 10, 65 10, 85 40 C 105 70, 135 70, 148 40"
        stroke={horizontal(id, tone)}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d="M 16 37 C 36 12, 62 12, 82 38"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Clay doodle circle / hand-drawn loop highlight. */
export function ClayDoodleCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 90"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <path
        d="M 20 50 C 15 22, 90 10, 175 14 C 240 18, 272 32, 268 55 C 262 76, 205 84, 125 82 C 55 80, 12 68, 28 42 C 40 24, 110 16, 185 20"
        stroke="#ff7a3d"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

