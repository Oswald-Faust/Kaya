---
name: clay-grade-landing
description: Design and build a premium, Clay.com-grade marketing site and brand identity (landing page, mega menu, animated sections, 3D hero, logo marquee, pricing page, brand guidelines) in Next.js + Tailwind v4 + motion + three.js. Use when the user asks for a landing page, homepage, marketing site, pricing page, brand identity/charte, hero section, "make it look like Clay/Linear/Stripe", 3D hero, or wants a site that "claque".
---

# Clay-grade landing & brand

This skill captures the process and code that produced the Kaya marketing site (reference implementation: `/Users/oswaldfaust/Code/Kaya`, GitHub `Oswald-Faust/Kaya`). Copyable source lives in `assets/` next to this file. Read `references/playbook.md` for section-by-section recipes and `references/checklist.md` before shipping.

## Workflow (do these in order)

1. **Research first, with real references.**
   - Mobbin MCP: `search_sections` for each section type (hero, logo wall, tabs, pillars, pricing, FAQ, footer), `search_screens` for app UI. Name the reference site in the query ("Clay pricing page…"). Always pass a stable `task_intent`.
   - Open the live reference site in the Browser pane, scroll it, and read computed styles (`getComputedStyle(h1)`) to get the real font, sizes, tracking, weights and colors. WebFetch the page for the exact section order and copy.
   - Write down the reference's section order; mirror the structure, never copy its words or brand.

2. **Identity before pixels** (see `references/brand.md`): name, logo (mark + lowercase wordmark), black/white core + warm cream, a 6–7 accent clay palette where each accent owns one product idea (base / soft / deep), one grotesk family (Host Grotesk ≈ Roobert) + a mono for labels, radii scale, motion rules, voice rules. Publish it as a `/brand` page and `docs/brand.md`. Compare 4–6 candidate fonts side by side in the browser before choosing.

3. **Tokens** in `globals.css` `@theme` (see `assets/globals.css`): semantic app tokens + brand accents + keyframes. No hard-coded hex in components except inside illustrations.

4. **Build the page from shared pieces** (all in `assets/`):
   - `site-nav.tsx` + `nav-data.ts`: sticky floating nav with mega menus (columns of icon tiles + featured illustrated card), hover-intent close, Esc, mobile accordion sheet. Hash links use `<a>` so `hashchange` fires; unbuilt pages get a "Soon" badge and are not links.
   - Hero options: `hero-3d-scene.tsx` (R3F brand mark, pointer rig, Float, Lightformer env, ContactShadows, paused off-screen), `clay-machine-scene.tsx` (full Clay-like 3D scene: speckled CanvasTexture grass, fog, Rapier physics balls, kinematic seesaw, N8AO + Noise + Vignette), `hero-variants.tsx` (product-in-perspective with scroll tilt; typewriter URL demo). Always `next/dynamic(..., { ssr: false })` with an SVG/2D fallback, and offer a `/lab/hero` page + `?hero=` param so the user can compare.
   - `logo-marquee.tsx`: 3 CSS marquee rows, alternating direction, tiles of 3 kinds (logo, logo+capability text, stat), honest status badges (Connected / Channel / Soon). Real logos from `simple-icons` (CC0); LinkedIn path is inlined (removed from simple-icons).
   - `use-case-tabs.tsx`: 10–12 pill tabs, CSS progress fill that autoplays (`onAnimationEnd` → next), paused on hover/out of view, rotating subtitle with blur crossfade, per-tab tinted panel with animated product mocks, deep links `#uc-<id>`.
   - `clay.tsx`: SVG clay illustrations (radial/linear 3-stop gradients per tone, soft blurred ground shadow, highlight ellipse). Motion via CSS classes `m-anim m-*` that start when an ancestor has `data-inview="true"`. Never put a CSS-animated class on an element with an SVG `transform` attribute; wrap it.
   - `motion.tsx`: `Reveal`, `Stagger`/`StaggerItem`, `InView`, `CountUp`, `WordRise` on `motion/react`, ease `[0.2,0.7,0.2,1]`, once per view.
   - Pillar sections (pastel rounded cards, tag pill, two-tone headline, proof list, two CTAs, illustration or interactive widget), story cards, resource cards, FAQ (`details/summary`), closing CTA with swaying hills, big-wordmark footer.
   - Pricing (`plans.ts`, `pricing-plans.tsx`, `pricing-calculator.tsx`): toggle with `layoutId` pill, colored plan headers, tier `<select>` per plan, animated price swap, calculator whose formula is shown, grouped comparison table, trust cards, pricing FAQ. Prices are a proposal: log them as a draft decision and say so.

5. **Honesty rules** (non-negotiable): no fake customer logos, testimonials or metrics. Third-party logos only as integrations/channels with status. Stats come from demo data (labelled) or from rules enforced in code. Mark fictional examples as fictional.

6. **Verify like a designer** (`references/checklist.md`): typecheck, lint, `next build`; Browser pane at 1280×800 and 390×844; `scrollWidth === innerWidth`; open every menu; wait for animations (screenshots in the pane can lag — assert with JS before trusting an empty capture); check console and server logs; reset the viewport after.

7. **Ship**: marketing pages must render without a database (bounded, try/catch lookups). Commit, push, deploy (`vercel deploy --prod`), and report what needs credentials.

## Design principles that made it work

- Black leads, white follows, one lime per view. Accents live on soft tints; text on tints uses the deep shade.
- Headlines 500–560 weight, −4.5% tracking, huge (clamp up to ~100px). Mono uppercase 11px labels with +12% tracking.
- Radii: controls 12, cards 16, panels 28, sections 32. Sections are rounded cards floating on white with 16–20px gutters.
- Every section has motion, but small: 8–28px travel, once per view, reduced-motion respected. Illustrations each get a distinct loop that illustrates the idea (scan, stack, bubble, dial, grow).
- Product mocks beat abstract art: show the real UI states (approval with policy checks, experiment result with p-value, channel scores).
