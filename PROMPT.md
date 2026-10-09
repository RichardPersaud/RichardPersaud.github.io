# PROMPT — Build the AniNinja showcase landing page

You are building a **single-page, static promotional landing website** for **AniNinja**, a personal anime browsing/streaming app available for **Windows (Electron desktop)** and **Android (Expo)**. The page's only job is to showcase the app beautifully and link to its downloads. There is no backend, no sign-up, no tracking — one HTML file (plus optional separate `style.css`) and local image assets.

Project folder: `anininja-landing/`

```
anininja-landing/
├── index.html      ← the landing page (all CSS inline or in style.css)
├── PROMPT.md       ← this file
└── assets/
    ├── logo.png            (square logo, 512×512)
    ├── logo-nav.png        (horizontal wordmark, 512×215)
    ├── shot-home.png       (desktop screenshots, captured from the app)
    ├── shot-detail.png
    ├── shot-player.png
    └── mobile-*.png        (portrait mobile screenshots)
```

---

## 1. Brand facts (use exactly)

**Product** — AniNinja v1.2.1. Tagline material: *"Your personal anime streaming app."* Description: "Personal anime browsing and streaming desktop app." Free, local-first, open development; installers distributed via GitHub Releases.

**Logo** — a white 6-pointed ninja **shuriken (throwing star)** behind a rounded bold wordmark: "**Ani**" in white, "**Ninja**" in teal. Use `assets/logo.png` (square) for the hero icon + favicon and `assets/logo-nav.png` (horizontal) in the navbar. No SVG version exists — don't invent one.

**Color palette** — taken from the app's own UI (`ui/style.css`). Use these exact CSS variables:

```css
:root {
  --bg:        #0b0e14;  /* page background — near-black navy */
  --bg2:       #11151f;  /* raised surfaces / navbar */
  --bg3:       #181d2a;  /* cards, inputs, panels */
  --border:    #232a3a;  /* borders */
  --text:      #e8ecf4;  /* primary text */
  --muted:     #8b94a7;  /* secondary text */
  --accent:    #35d5bf;  /* teal accent — buttons, highlights, glow */
  --accent-dim:#1fa392;  /* hover accent */
  --danger:    #ff6b6b;  /* sparing use (badges) */
  --on-accent: #06231f;  /* text on accent buttons */
}
```

- Radii: 10px for cards/inputs, 999px for pills/badges/buttons.
- Shadows: `0 10px 30px rgba(0,0,0,.5)`, `0 12px 32px rgba(0,0,0,.5)`.
- The hero glow is **teal** (`#35d5bf`), radial-gradient fading into `--bg` — never blue or purple.

**Fonts** — system stack only: `"Segoe UI", system-ui, -apple-system, sans-serif`. No webfonts, no @import, no Google Fonts.

## 2. Design direction (composition spec)

Model the page on a modern dark SaaS showcase: near-black navy page, a soft radial glow behind the hero, generous vertical spacing, large confident typography, device mockups floating in a glow halo. Section order:

1. **Navbar** (sticky, `--bg2` with blur/border-bottom): `logo-nav.png` on the left; right side: "Features", "Downloads", "GitHub" text links + a filled accent **Download** pill button. Collapses to logo + Download on mobile.
2. **Hero** (centered): small square `logo.png` (~72px, rounded) → headline in two lines (~56–64px desktop, bold): **"Watch anime. **Stay ninja.**"** or **"Your anime, streamed like a ninja."** → one muted subtitle line (~18px): *"A fast, personal anime streaming app for Windows and Android — sub & dub, cloud sync, zero accounts required."* → CTA pair: filled accent **"Download for Windows"** + ghost/outline **"Get the Android APK"** → small muted caption: *"Free · v1.2.1 · Windows 10+ and Android 8+"*. Behind it all: a large teal radial glow (`radial-gradient(ellipse, rgba(53,213,191,.18), transparent 70%)`).
3. **Showcase** — the centerpiece: the desktop screenshot (`shot-home.png`) inside a browser-style chrome frame (rounded top, three traffic-light dots, subtle `--border`), floating over a teal glow halo with a soft drop shadow. On wide screens, a phone-frame mockup (`mobile-*.png`, rounded ~28px frame with notch/punch-hole look) overlaps its right edge; on mobile they stack. Optionally a second row: `shot-detail.png` + `shot-player.png` as smaller tilted or plain cards.
4. **Feature grid** — 6 cards on `--bg3` with `--border`, 10px radius, teal icon or emoji, title + 1–2 sentence body. Pick the six strongest:
   - **Skip intro, auto-next** — HLS player with quality selector (1080p→360p), subtitles, skip-intro, and auto-play of the next episode.
   - **Pick up where you left off** — Continue Watching row on Home and per-episode resume in the player.
   - **Mini player** — dock the episode into a draggable corner mini player and keep browsing; picture-in-picture on Android.
   - **Browse everything** — full catalog with A–Z index and filters for type, status, genre, season, score, and SUB/DUB.
   - **Favorites & alerts** — heart any show and get notified when new episodes drop.
   - **Cloud sync** — sign in with Google to sync favorites, history, and settings across devices. Works fully offline without an account.
5. **Privacy strip** (one centered line, muted, maybe with a shuriken divider): *"Everything streams through a local proxy — nothing leaves this machine except the requests to the source site."*
6. **Downloads** — two side-by-side cards: **Windows** (`AniNinja-Setup-1.2.1.exe`, ~112 MB, accent-filled button "Download for Windows") and **Android** (`AniNinja-v1.2.1-arm64.apk`, ~78 MB, ghost button "Download APK"). Below, one muted line: *"More ABIs and past releases on GitHub Releases."* Both buttons link to `https://github.com/RichardPersaud/AniBrowser/releases/latest`.
7. **Footer** (centered, muted, small): logo mark, "AniNinja — a personal project. Not affiliated with any streaming source." · GitHub link · "MIT licensed".

## 3. Technical constraints

- **One static page.** `index.html` with inline `<style>` (or a single `style.css`). No build step, no JS frameworks; a tiny bit of vanilla JS is fine (e.g. smooth-scroll, scroll-reveal) but the page must work with JS disabled.
- **Zero external requests.** All images local under `assets/`, system fonts only, no CDNs. Add `<link rel="icon" href="assets/logo.png">`.
- **Dark-only theme** (the app is dark); still set explicit `background`/`color` on `body` so it renders identically in light-mode browsers.
- **Responsive**: hero text scales down, device mockups stack, feature grid goes 3→2→1 columns, nav collapses. No horizontal scrolling at 360px width.
- Keep image weight sane: any screenshot over ~1 MB gets downscaled/compressed before use.
- Semantic HTML (`header`, `main`, `section`, `footer`), alt text on every image, and a `<title>` like "AniNinja — Your anime, streamed like a ninja".

## 4. Screenshots (how they're produced)

Desktop screenshots are captured from the real app (`~/anime-player`, `npm start`) or reused from its `probe/shots/` automation captures; mobile shots from a connected Android device via `adb exec-out screencap -p`. Copy the chosen shots into `assets/` with the names above. If no Android device is available, present a desktop screenshot inside a CSS phone frame as the mobile mockup instead of a real mobile capture — do not fabricate UI that doesn't exist.