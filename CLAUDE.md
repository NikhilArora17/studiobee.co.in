# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.
- **Phone preview:** serve.mjs binds to `0.0.0.0`, so it's reachable on the LAN. The LAN address is printed on startup (e.g. `http://192.168.x.x:3000`). Open that on your phone (same WiFi). If blocked, allow Node.js through Windows Defender Firewall → private networks.

### serve.mjs endpoints
- `GET /ping` — health check, returns `{ ok: true }`
- `POST /contact` — saves submission to `contacts.json`, sends email via SMTP if configured
- `POST /upload` — saves binary file to `media/`, returns `{ url: '/media/filename' }`

## Screenshot Workflow
- Chrome executable: `C:/Users/arora/.cache/puppeteer/chrome/win64-145.0.7632.77/chrome-win64/chrome.exe` (already configured in `screenshot.mjs`)
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Site Structure
- `index.html` — main site (homepage)
- `case-studies.html` — all projects page (blue bg, 4-col 9:16 grid)
- `config.html` — content admin panel (served at `http://localhost:3000/config.html`)
- `content.js` — project/media data shared across pages (`window.SC.projects`)

## API Base URL Pattern
When any page needs to POST to serve.mjs (forms, uploads), use this at the top of the script:
```js
var API = (window.location.port === '3000') ? '' : 'http://localhost:3000';
```
Then use `API + '/contact'`, `API + '/upload'`, `API + '/ping'` in all XHR calls.
This allows the page to work from both VS Code Live Server (port 5500) and serve.mjs (port 3000).

## Protected Files — Do Not Move
- `7945.png` and `7946.png` — must stay in the project root. They are referenced by `.intro-strip` CSS `background-image` and power the hero wave animation on `index.html`. Moving them breaks the animation.

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Config Page
- A content admin panel lives at `config.html` (served at `http://localhost:3000/config.html`).
- Changes made in the config panel are stored in `localStorage` under the key `studiobee_config`.
- `index.html` reads from `localStorage` on page load (before the scramble script runs) and applies content dynamically. Falls back to hardcoded defaults if no config is stored.
- Sections covered: What We Do (services), Projects, Stats, Process. (Section 5 / Testimonials is excluded pending redesign.)
- When adding new sections or content fields to `index.html`, always add a matching control to `config.html` and keep the `DEFAULT_CONFIG` object in both files in sync.

## Security Rules — Non-Negotiable
- **Never serve sensitive files.** `smtp-config.json`, `contacts.json`, `package.json`, `package-lock.json`, `serve.mjs`, `screenshot.mjs` are blocked by the server. Do not remove those blocks.
- **Always use `esc()` for user content in `innerHTML`.** Any value from `window.SC`, `config.json`, or `localStorage` that is interpolated into HTML must be wrapped with the `esc()` helper defined in each rendering `<script>` block. Never bypass this.
- **Do not add raw template-literal interpolation into `innerHTML`** without escaping. Use `esc(value)` — not `${value}` or `+ value +`.
- **Upload endpoint** only accepts: `.jpg .jpeg .png .gif .webp .mp4 .webm .mov .avi .mkv`. Do not expand this list without explicit security review.
- **smtp-config.json is in `.gitignore`** — never commit it. If you need to reference SMTP config, use the example file only.
- **contacts.json is in `.gitignore`** — contains customer PII. Never commit.
- **Path traversal is protected** in `serve.mjs` — never bypass the `filePath.startsWith(rootWithSep)` guard.
- **config.json injection** in the HTML pipeline uses `JSON.parse` + `JSON.stringify` to re-serialise before embedding, preventing injection via malformed JSON. Keep this pattern.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
