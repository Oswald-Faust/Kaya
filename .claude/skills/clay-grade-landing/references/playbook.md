# Section playbook (Clay structure)

Order used on Kaya, mirroring clay.com. Each entry: purpose → layout → motion → source.

1. **Announcement bar** — one news line, lime or brand-dark, full width, links to the news. `landing-page.tsx`.
2. **Floating nav + mega menus** — white rounded bar (h-14) inside a sticky 76px header, 3px from top. Menus: 1–4 titled columns of icon tiles (tone-tinted 36px squares) + a 320px featured card with an illustration. Right side: Log in, grey "Get a demo", black "Start free", hamburger < lg. Panel animates height with `motion` (0.28s). `site-nav.tsx`, `nav-data.ts`.
3. **Hero** — either (a) cream rounded panel: headline left (clamp 48→92px, 560, −5%), subcopy, the *real* product input in a white card, secondary link + integration icons; 3D brand object right (R3F). Or (b) Clay classic: full-bleed 3D scene under the nav, fade into brand green, white headline bottom-left, subcopy + input + lime CTA right, "or connect directly with" icons. Stack card overlaps with −mt-32. `hero-variants.tsx`, `hero-clay-classic.tsx`, `*-scene.tsx`.
4. **Logo wall** — cream rounded card, one-line claim, 3 marquee rows (80–95s, alternating), tiles 96px tall: logo (210w), logo+text (440w), stat (300w, tinted). Mask edges with a linear-gradient mask. `logo-marquee.tsx`.
5. **"X build on Y" tabs** — big centered H2, rotating one-line subtitle, 10–12 pill tabs with autoplay progress, tinted panel with dot pattern and 2–3 animated UI cards. `use-case-tabs.tsx`.
6. **Interactive prompt** — "What do you want to grow?": the real input with clickable suggestions + example asks as a divided list.
7. **Loop overview** — cream card, H2, 4 illustrations with labels, staggered, each illustration animates its idea.
8. **Pillars ×5** — pastel rounded sections, alternating sides: tag pill + dots, two-tone H2 (ink + deep accent), body, integration icons, proof list with checks, black + white CTAs; illustration or an interactive widget (autonomy dial). Stagger the text column; `InView` + `Reveal` the visual; `CountUp` stats.
9. **Stories** — 2 large cards: tinted dotted media area with an animated mock, kicker + title, round arrow button that rotates on hover.
10. **Resources** — 4 tinted cards with kicker/title/CTA, lift on hover.
11. **FAQ** — left big H2, right `details` accordion with rotating plus.
12. **Closing CTA** — huge H2, one line, two buttons, swaying hills strip.
13. **Footer** — cream, brand + CTA column, columns derived from nav data, giant wordmark with per-letter rise, legal row.

## Pricing page (Clay pricing structure)
Header (huge H1 left, small integration marquee right) → billing toggle (monthly/annual, "Save 10%", motion `layoutId`) → 4 plan cards (deep-tone header with icon, recommended ring + badge, animated price, tier select, "Everything in X, plus", CTA) → 3 "how pricing works" cards → calculator (sliders + visible formula + lime recommendation card) → grouped comparison table (check / ban / text) → 4 trust cards → pricing FAQ → closing CTA → footer.

## 3D recipes
- Brand object: capsules on a RoundedBox slab; grow with easeOutBack on mount; breathe with sin; hover bump via damp; group rig follows `state.pointer` with `THREE.MathUtils.damp`; `Environment` built only from `Lightformer`s (no network); `ContactShadows`; `frameloop={visible ? "always" : "never"}`.
- Clay world: sky via `scene.background = CanvasTexture(gradient + soft cloud blobs)`; ground/hills with speckled CanvasTexture (repeat 26); `fog`; hemisphere + shadowed directional light; LatheGeometry funnel, TubeGeometry along CatmullRom for curly pipe, half open cylinders for troughs, capsule seesaw with diagonal-stripe texture; Rapier: fixed ground + invisible walls, kinematic seesaw (`setNextKinematicRotation`), balls spawned on an interval (keep last 12); postprocessing `N8AO` + `Noise` + `Vignette`; responsive camera distance by aspect; CSS grain overlay + gradient fade into the section color.

## Known pitfalls
- `@react-three/postprocessing` `EffectComposer` + `N8AO` rendered a blank canvas with three 0.186 / R3F 9.7 (no console error). Do grain and vignette as CSS overlays over the canvas instead, or bisect with URL flags (`?nofx`, `?nophys`) before shipping any composer.
- Browser-pane screenshots can show a stale frame right after scrolling or loading 3D; wait, assert with JS (canvas size, `gl.drawingBufferWidth`, computed opacity), then capture.
- A button with both `onFocus={open}` and `onClick={toggle}` opens then immediately closes on click. Use hover + click only.
- `react-hooks/immutability` forbids `scene.background = x` in effects; use `<primitive attach="background" object={texture} />`.
- Marketing pages must not depend on the database: wrap lookups in try/catch + timeout (`marketing-links.ts`).
