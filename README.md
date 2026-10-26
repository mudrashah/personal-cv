# CV Website

Animated, single-page CV for Mudra Shah, built to match `handoff/design-reference.dc.html`.
Plain HTML/CSS/JS, no build step or dependencies (fonts load from Google Fonts).

## Run

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(or just open `index.html` in a browser)

## Edit content

- **Projects (10 cards) and Personal projects (Trip Planner)**: `index.html`, in `#projects` and `#personal`. Each project card has an animated scene (`data-scene`) followed by the title, bullet points and tags. The Trip Planner links are the "View live app" and "GitHub" anchors in `#personal`.
- **Project scene animations**: the `sceneAnim()` switch in `script.js`, keyed by each element's `data-a` attribute.
- Skills, experience, education, contact: `index.html`
- Colors and light/dark themes: CSS variables at the top of `style.css`
- Background mode, custom cursor, intro loader: `CONFIG` at the top of `script.js` (`bgEffect`: "Dot field", "Particles" or "Off")

## Features

- Intro loader (0-100 counter, clip-path wipe) with a timeout fallback
- Canvas background: "Dot field" (ripples, pushes away from the cursor) or "Particles"; click sends a shockwave and a ring
- Scroll reveals (up, word, line, drop, flip, blur), scramble/decode section titles, count-up stats
- Hero name: per-letter rise-in, then letters react to cursor proximity
- Role rotator, word-by-word About highlight tied to scroll, dropping chips, flipping skill cards with filling bars
- Experience timeline that fills with scroll and lights up dots
- Projects dealt out from the grid center, 3D tilt with cursor spotlight, and a 150px animated scene per card (paused off-screen)
- Custom cursor ring/dot (fine pointers only), magnetic buttons, wave-on-hover email
- Tech marquee whose speed, direction and skew follow scroll velocity
- Dark/light toggle with a circular View Transitions reveal (instant fallback), persisted in `localStorage("theme")`
- Scroll progress bar and a sliding active-link indicator in the nav (links hidden below 760px)
- `prefers-reduced-motion`: no animations; bars, counters and the About text show their final state
