# Ship checklist

- [ ] Research logged: Mobbin sections + live reference inspected (fonts, sizes, section order).
- [ ] Tokens only; accents used one per surface; text on tints uses deep shades.
- [ ] No fake customers/testimonials/metrics; logos labelled Connected / Channel / Soon; fictional examples marked.
- [ ] Every section from the hero down has motion; illustrations animate their idea; reduced motion respected.
- [ ] 3D loaded client-only with fallback, paused off-screen, responsive camera.
- [ ] Menus: hover + click + Esc work; click must not be cancelled by focus handlers; mobile sheet works.
- [ ] Hash deep links (`/#uc-id`) select the right tab; unbuilt pages are "Soon" spans, not links.
- [ ] `pnpm typecheck`, `pnpm eslint`, `pnpm build` pass.
- [ ] Browser pane at 1280×800 and 390×844: no horizontal overflow (`scrollWidth === innerWidth`), no console errors, server logs clean. Pane screenshots can lag after a scroll: assert with JS, wait, then capture.
- [ ] Marketing pages render without a database (bounded try/catch lookups).
- [ ] Decisions logged (identity, pricing draft, 3D); build-status updated; viewport emulation reset.
