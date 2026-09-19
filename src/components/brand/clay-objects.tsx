/**
 * Clay objects: one familiar thing per idea, modelled like the 3D clay props on
 * Clay's blog (gears, a magnifier, a box of envelopes). They complement the
 * scene spots in clay.tsx so a page never repeats the same picture.
 *
 * Same rules as clay.tsx: matte gradients lit from the top left, a soft ground
 * shadow, and `m-anim m-*` motion that starts in view. Animated
 * groups never carry their own `transform` attribute; they wrap one.
 */
import { useId, type CSSProperties, type ReactNode } from "react";
import { CLAY, type ClayTone } from "@/components/brand/clay";

type Props = { className?: string };

const r = (id: string, t: ClayTone) => `url(#${id}-${t}-r)`;
const h = (id: string, t: ClayTone) => `url(#${id}-${t}-h)`;
const v = (id: string, t: ClayTone) => `url(#${id}-${t}-v)`;
const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

function Frame({ label, children, render }: { label: string; children?: ReactNode; render: (id: string) => ReactNode }) {
  const id = `co${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 240 200" role="img" aria-label={label} className="h-auto w-full">
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
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {render(id)}
      {children}
    </svg>
  );
}

function Ground({ id, cx = 120, cy = 182, rx = 70 }: { id: string; cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.15} fill="#10261b" opacity="0.2" filter={`url(#${id}-soft)`} />;
}

function Gloss({ cx, cy, rx, ry, rotate = -30, opacity = 0.5 }: { cx: number; cy: number; rx: number; ry: number; rotate?: number; opacity?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity={opacity} transform={`rotate(${rotate} ${cx} ${cy})`} />;
}

/** Understand: a magnifier reading a page of your product. */
export function ClayMagnifier({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay magnifier over a product page"
        render={(id) => (
          <>
            <Ground id={id} rx={78} />
            <g transform="rotate(-7 100 96)">
              <rect x="38" y="38" width="124" height="104" rx="16" fill={v(id, "cream")} />
              <rect x="54" y="58" width="56" height="10" rx="5" fill={h(id, "lime")} />
              <rect x="54" y="78" width="88" height="8" rx="4" fill={h(id, "cream")} opacity="0.9" />
              <rect x="54" y="94" width="72" height="8" rx="4" fill={h(id, "cream")} opacity="0.9" />
              <rect x="54" y="112" width="40" height="14" rx="7" fill={h(id, "blue")} />
            </g>
            <g className="m-anim m-float">
              <g transform="rotate(42 170 138)">
                <rect x="160" y="112" width="22" height="66" rx="11" fill={h(id, "tangerine")} />
                <rect x="157" y="108" width="28" height="14" rx="7" fill={h(id, "cream")} />
              </g>
              <circle cx="130" cy="92" r="42" fill="#e3ebff" opacity="0.55" />
              <circle cx="130" cy="92" r="42" fill="none" stroke={h(id, "blue")} strokeWidth="14" />
              <path d="M104 72 a32 32 0 0 1 24 -12" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
              <Gloss cx={112} cy={62} rx={9} ry={4} opacity={0.6} />
            </g>
          </>
        )}
      />
    </div>
  );
}

/** Decide: a dart right in the middle of the board. */
export function ClayTarget({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay dartboard with a dart in the bullseye"
        render={(id) => (
          <>
            <Ground id={id} rx={62} />
            <rect x="106" y="150" width="16" height="30" rx="6" fill={h(id, "cream")} />
            <circle cx="114" cy="96" r="66" fill={r(id, "cream")} />
            <circle cx="114" cy="96" r="52" fill={r(id, "tangerine")} />
            <circle cx="114" cy="96" r="38" fill={r(id, "cream")} />
            <circle cx="114" cy="96" r="24" fill={r(id, "tangerine")} />
            <circle cx="114" cy="96" r="10" fill={r(id, "lime")} />
            <Gloss cx={86} cy={52} rx={16} ry={6} opacity={0.55} />
            <g className="m-anim m-drop" style={delay(0.2)}>
              <g transform="rotate(-38 114 96)">
                <rect x="112" y="16" width="5" height="80" rx="2.5" fill="#3a3a44" />
                <rect x="108" y="30" width="13" height="40" rx="6.5" fill={h(id, "blue")} />
                <path d="M114 4 l-14 18 h28 z" fill={h(id, "lilac")} />
                <path d="M114 12 l-9 14 h18 z" fill="#fff" opacity="0.35" />
              </g>
            </g>
          </>
        )}
      />
    </div>
  );
}

function gearPath(cx: number, cy: number, r: number, teeth: number, depth: number) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const corners = [
      [a - step * 0.28, r],
      [a - step * 0.16, r + depth],
      [a + step * 0.16, r + depth],
      [a + step * 0.28, r],
    ] as const;
    for (const [ang, rad] of corners) pts.push(`${(cx + Math.cos(ang) * rad).toFixed(2)} ${(cy + Math.sin(ang) * rad).toFixed(2)}`);
  }
  return `M${pts.join(" L")}Z`;
}

/** Execute: two gears turning together. */
export function ClayGears({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Two clay gears turning together"
        render={(id) => (
          <>
            <Ground id={id} rx={74} />
            <g className="m-anim m-spin">
              <path d={gearPath(98, 108, 50, 11, 13)} fill={r(id, "lime")} strokeLinejoin="round" stroke={CLAY.lime[1]} strokeWidth="4" />
              <circle cx="98" cy="108" r="18" fill={r(id, "cream")} />
              <circle cx="98" cy="108" r="7" fill={CLAY.lime[2]} />
            </g>
            <g className="m-anim m-spin-rev">
              <path d={gearPath(166, 62, 30, 8, 10)} fill={r(id, "blue")} strokeLinejoin="round" stroke={CLAY.blue[1]} strokeWidth="3" />
              <circle cx="166" cy="62" r="11" fill={r(id, "cream")} />
            </g>
            <Gloss cx={76} cy={78} rx={14} ry={6} opacity={0.45} />
          </>
        )}
      />
    </div>
  );
}

/** Launch: a rocket leaving the ground. */
export function ClayRocket({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay rocket taking off"
        render={(id) => (
          <>
            <Ground id={id} rx={50} cx={112} />
            <g className="m-anim m-float">
              <g transform="rotate(28 120 100)">
                <g className="m-anim m-flicker">
                  <path d="M120 206 C 100 178 104 160 120 150 C 136 160 140 178 120 206Z" fill={v(id, "sun")} />
                  <path d="M120 190 C 110 174 112 164 120 158 C 128 164 130 174 120 190Z" fill="#fff" opacity="0.7" />
                </g>
                <path d="M92 118 L66 150 L96 144Z" fill={h(id, "tangerine")} />
                <path d="M148 118 L174 150 L144 144Z" fill={h(id, "tangerine")} />
                <path d="M120 14 C 152 40 158 94 150 146 H 90 C 82 94 88 40 120 14Z" fill={h(id, "cream")} />
                <path d="M120 14 C 134 25 143 40 148 56 H 92 C 97 40 106 25 120 14Z" fill={h(id, "tangerine")} />
                <circle cx="120" cy="86" r="17" fill={h(id, "cream")} />
                <circle cx="120" cy="86" r="12" fill={r(id, "blue")} />
                <Gloss cx={114} cy={80} rx={4} ry={2.5} opacity={0.7} />
                <rect x="98" y="138" width="44" height="12" rx="6" fill={h(id, "cream")} />
              </g>
            </g>
          </>
        )}
      />
    </div>
  );
}

/** Campaigns: a megaphone with its sound waves. */
export function ClayMegaphone({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay megaphone"
        render={(id) => (
          <>
            <Ground id={id} rx={70} cx={110} />
            <g transform="rotate(-14 110 110)">
              <rect x="52" y="116" width="18" height="46" rx="8" fill={h(id, "cream")} />
              <path d="M44 88 L150 44 V176 L44 132Z" fill={h(id, "pink")} />
              <rect x="30" y="86" width="26" height="48" rx="10" fill={h(id, "cream")} />
              <ellipse cx="150" cy="110" rx="18" ry="66" fill={r(id, "pink")} />
              <ellipse cx="152" cy="110" rx="9" ry="46" fill={CLAY.pink[2]} opacity="0.55" />
              <Gloss cx={96} cy={78} rx={20} ry={5} rotate={-22} opacity={0.5} />
            </g>
            {[0, 1, 2].map((i) => (
              <g key={i} className="m-anim m-pop" style={delay(0.2 + i * 0.18)}>
                <path d={`M${186 + i * 14} ${58 - i * 4} q ${16 + i * 4} ${30 + i * 4} 0 ${62 + i * 8}`} stroke={CLAY.lilac[1]} strokeWidth="8" strokeLinecap="round" fill="none" />
              </g>
            ))}
          </>
        )}
      />
    </div>
  );
}

/** Winners: a trophy with confetti. */
export function ClayTrophy({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay trophy with confetti"
        render={(id) => (
          <>
            <Ground id={id} rx={62} />
            <rect x="82" y="158" width="76" height="22" rx="8" fill={h(id, "cream")} />
            <rect x="94" y="146" width="52" height="16" rx="6" fill={h(id, "tangerine")} />
            <rect x="111" y="116" width="18" height="34" rx="6" fill={h(id, "sun")} />
            <path d="M60 50 q-8 44 34 54" stroke={CLAY.sun[2]} strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M180 50 q8 44 -34 54" stroke={CLAY.sun[2]} strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M68 34 H172 V60 C172 100 150 124 120 124 C90 124 68 100 68 60Z" fill={h(id, "sun")} />
            <ellipse cx="120" cy="34" rx="52" ry="10" fill={CLAY.sun[0]} />
            <path d="M120 58 l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2z" fill="#fff" opacity="0.75" />
            <Gloss cx={84} cy={62} rx={6} ry={16} rotate={8} opacity={0.4} />
            {(
              [
                [40, 70, 7, "blue", 0.3],
                [196, 84, 6, "pink", 0.5],
                [52, 128, 5, "lime", 0.7],
                [200, 138, 7, "lilac", 0.4],
                [178, 26, 5, "grass", 0.6],
              ] as const
            ).map(([cx, cy, rad, tone, d], i) => (
              <g key={i} className="m-anim m-pop" style={delay(d)}>
                <circle cx={cx} cy={cy} r={rad} fill={r(id, tone)} />
              </g>
            ))}
          </>
        )}
      />
    </div>
  );
}

/** Learn: an idea lighting up. */
export function ClayBulb({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay light bulb"
        render={(id) => (
          <>
            <Ground id={id} rx={46} />
            {[-60, -30, 0, 30, 60].map((a, i) => (
              <g key={a} className="m-anim m-pop" style={delay(0.15 * i)}>
                <g transform={`rotate(${a} 120 76)`}>
                  <rect x="116" y="0" width="8" height="18" rx="4" fill={h(id, "sun")} />
                </g>
              </g>
            ))}
            <circle cx="120" cy="80" r="46" fill={r(id, "sun")} />
            <path d="M104 86 q8 -18 16 0 q8 18 16 0" stroke={CLAY.sun[2]} strokeWidth="5" fill="none" strokeLinecap="round" />
            <rect x="102" y="116" width="36" height="24" rx="6" fill={v(id, "sun")} />
            <rect x="98" y="136" width="44" height="12" rx="6" fill={h(id, "cream")} />
            <rect x="100" y="150" width="40" height="12" rx="6" fill={h(id, "cream")} />
            <rect x="108" y="164" width="24" height="12" rx="6" fill={h(id, "cream")} />
            <Gloss cx={100} cy={58} rx={14} ry={7} opacity={0.65} />
          </>
        )}
      />
    </div>
  );
}

/** Control: a padlock and its key. */
export function ClayPadlock({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay padlock with its key"
        render={(id) => (
          <>
            <Ground id={id} rx={70} />
            <path d="M78 94 V66 a32 32 0 0 1 64 0 V94" stroke={h(id, "cream")} strokeWidth="16" fill="none" strokeLinecap="round" />
            <rect x="58" y="86" width="104" height="90" rx="22" fill={v(id, "lilac")} />
            <circle cx="110" cy="122" r="11" fill={CLAY.lilac[2]} />
            <rect x="106" y="126" width="8" height="24" rx="4" fill={CLAY.lilac[2]} />
            <Gloss cx={80} cy={100} rx={14} ry={5} rotate={-15} opacity={0.5} />
            <g className="m-anim m-float">
              <g transform="rotate(-30 186 128)">
                <circle cx="186" cy="100" r="18" fill="none" stroke={h(id, "tangerine")} strokeWidth="11" />
                <rect x="181" y="116" width="10" height="52" rx="5" fill={h(id, "tangerine")} />
                <rect x="190" y="146" width="12" height="7" rx="3" fill={h(id, "tangerine")} />
                <rect x="190" y="158" width="9" height="7" rx="3" fill={h(id, "tangerine")} />
              </g>
            </g>
          </>
        )}
      />
    </div>
  );
}

/** Content and email: envelopes jumping out of a box. */
export function ClayEnvelopes({ className }: Props) {
  const envelope = (id: string, x: number, y: number, rot: number, tone: ClayTone, d: number) => (
    <g className="m-anim m-float" style={delay(d)}>
      <g transform={`rotate(${rot} ${x + 30} ${y + 20})`}>
        <rect x={x} y={y} width="60" height="40" rx="7" fill={h(id, tone)} />
        <path d={`M${x + 3} ${y + 4} L${x + 30} ${y + 24} L${x + 57} ${y + 4}`} stroke="#fff" strokeOpacity="0.8" strokeWidth="4" fill="none" strokeLinejoin="round" />
      </g>
    </g>
  );
  return (
    <div className={className}>
      <Frame
        label="Clay box of envelopes"
        render={(id) => (
          <>
            <Ground id={id} rx={80} />
            {envelope(id, 64, 30, -18, "blue", 0)}
            {envelope(id, 116, 16, 12, "pink", 0.8)}
            {envelope(id, 150, 52, 28, "lime", 1.6)}
            <path d="M50 96 L120 80 L190 96 L120 112Z" fill={CLAY.tangerine[2]} />
            <path d="M50 96 L120 112 V182 L50 164Z" fill={h(id, "tangerine")} />
            <path d="M190 96 L120 112 V182 L190 164Z" fill={v(id, "tangerine")} />
            <path d="M50 96 L28 118 L98 134 L120 112Z" fill={h(id, "tangerine")} opacity="0.92" />
            <path d="M190 96 L212 118 L142 134 L120 112Z" fill={CLAY.tangerine[1]} />
            <Gloss cx={78} cy={140} rx={12} ry={4} rotate={20} opacity={0.35} />
          </>
        )}
      />
    </div>
  );
}

/** Strategy: a compass picking the direction. */
export function ClayCompass({ className }: Props) {
  return (
    <div className={className}>
      <Frame
        label="Clay compass"
        render={(id) => (
          <>
            <Ground id={id} rx={66} />
            <rect x="108" y="8" width="24" height="20" rx="8" fill={h(id, "cream")} />
            <circle cx="120" cy="100" r="74" fill={r(id, "blue")} />
            <circle cx="120" cy="100" r="58" fill={r(id, "cream")} />
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 30} 120 100)`}>
                <rect x="118" y="46" width="4" height={i % 3 === 0 ? 12 : 7} rx="2" fill={CLAY.cream[2]} />
              </g>
            ))}
            <g className="m-anim m-needle">
              <path d="M120 58 L132 100 L120 108 L108 100Z" fill={h(id, "tangerine")} />
              <path d="M120 142 L132 100 L120 92 L108 100Z" fill={h(id, "cream")} stroke={CLAY.cream[2]} strokeWidth="1.5" />
            </g>
            <circle cx="120" cy="100" r="7" fill={r(id, "lime")} />
            <Gloss cx={84} cy={50} rx={20} ry={7} opacity={0.45} />
          </>
        )}
      />
    </div>
  );
}

/** One object per marketing page, so neighbouring pages never share a picture. */
export const OBJECT_BY_SLUG: Record<string, (props: Props) => React.JSX.Element> = {
  // Solutions
  "pre-launch": ClayRocket,
  "first-revenue": ClayTrophy,
  scaling: ClayGears,
  "b2b-saas": ClayCompass,
  "developer-tools": ClayMagnifier,
  "ai-apps": ClayBulb,
  "mobile-apps": ClayMegaphone,
  "solo-founders": ClayTarget,
  "small-teams": ClayEnvelopes,
  agencies: ClayPadlock,
  // Use cases
  "first-100-customers": ClayTarget,
  "launch-hn-product-hunt": ClayRocket,
  "comparison-searches": ClayMagnifier,
  "scale-paid-search": ClayMegaphone,
  "small-budget": ClayPadlock,
  "turn-trials-into-customers": ClayEnvelopes,
  "diagnose-signups-drop": ClayCompass,
  "revenue-attribution": ClayTrophy,
};
