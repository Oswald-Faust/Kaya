# Kaya brand guidelines

Live version: `/brand`. Tokens: `src/app/globals.css`. Components: `src/components/brand/`.

## Idea

Kaya is the AI agent that does marketing for people who build products. The brand is black and white, warm, and a little playful: serious about money, never stiff about it. Visual reference: Clay (clay.com) — light grounds, one confident grotesk, soft 3D "clay" illustrations, pastel section cards.

Principles: **clear before clever**, **proof over promises**, **playful, never silly**.

## Logo

- Mark: three clay pills rising on an ink tile (tangerine → lime → blue). `KayaMark`.
- Wordmark: lowercase `kaya`, Host Grotesk Semibold, −5% tracking, beside the mark. `KayaWordmark`.
- Minimum size 16px. Clear space = height of the first pill. Don't recolor, stretch, rotate or add effects.

## Color

| Role | Token | Hex |
|---|---|---|
| Ink | `ink` | #0B0B0B |
| White | `surface` | #FFFFFF |
| Cream | `cream` | #F7F5F0 |
| Stone | `stone` | #EDEAE3 |
| Muted text | `muted` | #5F5B54 |
| Hero ground | `forest` | #24533D |

Accents (base / soft / deep), one per surface, each owning one step of the loop:

| Accent | Idea | Base | Soft | Deep |
|---|---|---|---|---|
| Lime | Signature | #D4F36B | #F3FBD6 | #56700F |
| Blue | Understand · the agent | #4D78FF | #EAF0FF | #2240B0 |
| Tangerine | Decide · spend | #FF7A3D | #FFF0E7 | #B0450F |
| Grass | Experiment · wins | #3DA863 | #E8F6EC | #1C653A |
| Lilac | Control · trust | #9C80FF | #F1EDFF | #5636BF |
| Sun | Learn · attention | #FFC83D | #FFF7DC | #8A6000 |
| Pink | Illustration details | #FF8FC0 | #FFEEF5 | #B23A70 |

Deep shade on its soft tint for text. In the product, the agent color is `agent` #2F56E8.

## Typography

- **Host Grotesk** for everything. Display 100/96 at 560, −4.5%; H1 72 at 500; H2 44 at 500, −3.5%; body 17/28.
- **Geist Mono** for labels, IDs and numbers in small caps (11px, +12%, uppercase).
- Headlines are never bold (max 560).

## Clay illustration

Soft matte shapes lit from the top left, light grain, soft ground shadow, one idea per scene on its accent tint. Spots: Understand (magnifier), Decide (coin stacks), Experiment (flask), Control (dial + shield), Learn (block tower). Hero: the growth machine. All SVG in `src/components/brand/clay.tsx`.

## Interface

Buttons: black primary, white secondary, lime once per view. Radii: controls 12, cards 16, panels 28, sections 32 (product app keeps 4–8). Status colors only where they carry meaning.

## Voice

Plain, specific, honest. "Kaya paused the ad. It cost $212 per customer." — not "Leveraging AI-driven optimization."

## Third-party logos

Real logos (Simple Icons, CC0) appear only for integrations Kaya connects to. They are never presented as customers or endorsements.

## Motion

- **Ease**: `cubic-bezier(0.2, 0.7, 0.2, 1)`, short distances (8–28px), once per view. `motion` handles reveals, staggers, counters and tab transitions (`src/components/marketing/motion.tsx`).
- **Illustrations**: each clay spot has its own loop, driven by CSS keyframes and started when visible (`InView` → `data-inview`): the magnifier scans, coins drop and the arrow draws, the flask tilts and bubbles, the dial cycles through the four autonomy modes, blocks stack and a sprout grows, trees sway.
- **Hero**: a real-time 3D Kaya mark (three.js via @react-three/fiber): the three pills grow out of an ink slab, breathe, react to hover and follow the pointer. Paused when off-screen.
- **Marquee**: three rows of integration tiles in alternating directions, paused on hover.
- Everything respects `prefers-reduced-motion`.
